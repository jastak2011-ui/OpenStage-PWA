import type { PerformanceState, ReceiverDisplaySettings, Song } from '../types';
import { supabase } from '../data/supabase';

export type RemoteReceiverPayload = {
  song: Song;
  performance: PerformanceState;
  effectiveCapo: number;
  scrollTop: number;
  scrollProgress: number;
  autoscrollActive: boolean;
  receiver: ReceiverDisplaySettings;
  visualTheme?: {
    stageTheme: PerformanceState['stageTheme'];
    theme: PerformanceState['theme'];
    background: string;
    text: string;
    muted: string;
    chordColor: string;
    sectionColor: string;
    harmonyTextColor: string;
    harmonyIconColor: string;
    sectionBold: boolean;
    sectionItalic: boolean;
    sectionUppercase: boolean;
  };
  typography: {
    lyricFontSize: number;
    chordFontSize: number;
    sectionFontSize: number;
    headerFontSize: number;
    songTitleFontSize: number;
    songArtistFontSize: number;
    lineSpacing: number;
  };
  updatedAt: string;
};

export type RemoteReceiverTestPatternPayload = {
  receiver: ReceiverDisplaySettings;
  updatedAt: string;
};

export type RemoteDisplayMessage =
  | { type: 'hello'; role: 'controller' | 'display'; clientId: string }
  | { type: 'song'; songId: string }
  | { type: 'receiver-state'; payload: RemoteReceiverPayload }
  | { type: 'receiver-test-pattern'; payload: RemoteReceiverTestPatternPayload };

export type RemoteDisplayStatus = 'connecting' | 'connected' | 'disconnected' | 'error';

export type RemoteDisplayControllerSnapshot = {
  status: RemoteDisplayStatus;
  url: string;
  detail: string;
  lastEventAt: string;
  lastSongId: string;
  lastPublishState: 'none' | 'queued' | 'sent';
  lastReceiverMode: string;
};

type RemoteDisplayConnectionOptions = {
  role: 'controller' | 'display';
  onMessage?: (message: RemoteDisplayMessage) => void;
  onStatus?: (status: RemoteDisplayStatus, detail?: string) => void;
};

const remoteDisplayUrlStorageKey = 'openstage-remote-display-ws-url-v1';
const hostedReceiverRoomStorageKey = 'openstage-hosted-receiver-room-v1';
const reconnectDelayMs = 1200;
const clientId = `${Date.now().toString(36)}-${Math.random().toString(36).slice(2)}`;
const receiverRoomAlphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';

let controllerConnection: ReturnType<typeof connectRemoteDisplay> | null = null;
let pendingControllerSongId = '';
let pendingControllerMessage: RemoteDisplayMessage | null = null;
let pendingHostedMessage: RemoteDisplayMessage | null = null;
let hostedReceiverRoomCode = getHostedReceiverRoomCode();
let hostedReceiverChannel: ReturnType<NonNullable<typeof supabase>['channel']> | null = null;
let hostedReceiverChannelCode = '';
let lastDurableReceiverSignature = '';
let controllerStatus: RemoteDisplayStatus = 'disconnected';
const controllerStatusListeners = new Set<(status: RemoteDisplayStatus) => void>();
let controllerSnapshot: RemoteDisplayControllerSnapshot = {
  status: 'disconnected',
  url: '',
  detail: 'Controller has not connected yet.',
  lastEventAt: '',
  lastSongId: '',
  lastPublishState: 'none',
  lastReceiverMode: ''
};
const controllerSnapshotListeners = new Set<(snapshot: RemoteDisplayControllerSnapshot) => void>();

export function isDisplayRoute() {
  return window.location.pathname.replace(/\/+$/, '') === '/display';
}

export function isReceiverRoute() {
  return window.location.pathname.replace(/\/+$/, '') === '/receiver';
}

export function getRemoteDisplayUrl() {
  const params = new URLSearchParams(window.location.search);
  const queryUrl = params.get('remoteWs')?.trim();
  if (queryUrl) return queryUrl;

  try {
    const saved = localStorage.getItem(remoteDisplayUrlStorageKey);
    if (saved) return saved;
  } catch {
    // Ignore storage failures. The default URL is enough for Phase 1.
  }

  const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
  const host = window.location.hostname || 'localhost';
  return `${protocol}//${host}:8787`;
}

export function shouldUseLocalReceiverRelay() {
  const params = new URLSearchParams(window.location.search);
  return Boolean(params.get('remoteWs')?.trim() || params.get('transport') === 'ws');
}

export function getHostedReceiverRoomCode() {
  try {
    return localStorage.getItem(hostedReceiverRoomStorageKey)?.trim().toUpperCase() || '';
  } catch {
    return '';
  }
}

export function saveHostedReceiverRoomCode(roomCode: string) {
  hostedReceiverRoomCode = normalizeHostedReceiverRoomCode(roomCode);
  try {
    if (hostedReceiverRoomCode) {
      localStorage.setItem(hostedReceiverRoomStorageKey, hostedReceiverRoomCode);
    } else {
      localStorage.removeItem(hostedReceiverRoomStorageKey);
    }
  } catch {
    // Pairing can still work for this session.
  }
  updateControllerSnapshot({
    url: hostedReceiverRoomCode ? `supabase:${hostedReceiverRoomCode}` : getRemoteDisplayUrl(),
    detail: hostedReceiverRoomCode ? `Supabase receiver room ${hostedReceiverRoomCode} saved.` : 'Supabase receiver room cleared.'
  });
}

export async function createHostedReceiverRoom() {
  if (!supabase) throw new Error('Supabase is not configured.');
  const storedRoomCode = normalizeHostedReceiverRoomCode(getHostedReceiverRoomCode());
  if (isReceiverRoomCode(storedRoomCode)) {
    return ensureHostedReceiverRoom(storedRoomCode, false);
  }

  for (let attempt = 0; attempt < 12; attempt += 1) {
    const roomCode = createReceiverRoomCode();
    try {
      const room = await ensureHostedReceiverRoom(roomCode, true);
      saveHostedReceiverRoomCode(room.roomCode);
      return room;
    } catch (error) {
      if (typeof error === 'object' && error && 'code' in error && error.code === '23505') continue;
      throw error;
    }
  }
  throw new Error('Could not create receiver room.');
}

export function resetHostedReceiverRoomCode() {
  saveHostedReceiverRoomCode('');
}

export async function fetchHostedReceiverRoomState(roomCode: string) {
  if (!supabase) throw new Error('Supabase is not configured.');
  const normalized = normalizeHostedReceiverRoomCode(roomCode);
  if (!normalized) throw new Error('Receiver room code is required.');
  const { data, error } = await supabase
    .from('receiver_state')
    .select('latest_message, updated_at')
    .eq('pairing_code', normalized)
    .maybeSingle();
  if (error) throw error;
  const message = parseRemoteDisplayMessage(JSON.stringify(data?.latest_message ?? null));
  return {
    roomCode: normalized,
    lastUpdatedAt: typeof data?.updated_at === 'string' ? data.updated_at : '',
    message
  };
}

export function subscribeHostedReceiverRoom({
  roomCode,
  role,
  onMessage,
  onStatus
}: {
  roomCode: string;
  role: 'controller' | 'display';
  onMessage?: (message: RemoteDisplayMessage) => void;
  onStatus?: (status: RemoteDisplayStatus, detail?: string) => void;
}) {
  if (!supabase) {
    onStatus?.('error', 'Supabase is not configured.');
    return { close: () => undefined };
  }
  const supabaseClient = supabase;
  const normalized = normalizeHostedReceiverRoomCode(roomCode);
  const channel = supabaseClient.channel(receiverChannelName(normalized), {
    config: {
      broadcast: { self: false },
      presence: { key: `${role}-${clientId}` }
    }
  });
  let closed = false;

  channel
    .on('broadcast', { event: 'receiver-message' }, (event) => {
      const message = parseRemoteDisplayMessage(JSON.stringify(event.payload?.message));
      if (message) onMessage?.(message);
    })
    .on('presence', { event: 'sync' }, () => {
      if (!closed) onStatus?.('connected', `Supabase receiver room ${normalized} connected.`);
    })
    .subscribe((status) => {
      if (closed) return;
      if (status === 'SUBSCRIBED') {
        onStatus?.('connected', `Supabase receiver room ${normalized} connected.`);
        void channel.track({ role, clientId, onlineAt: new Date().toISOString() });
        return;
      }
      if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT') {
        onStatus?.('error', `Supabase receiver room ${normalized} ${status.toLowerCase()}.`);
      }
      if (status === 'CLOSED') onStatus?.('disconnected', `Supabase receiver room ${normalized} closed.`);
    });

  return {
    close: () => {
      closed = true;
      void channel.untrack();
      void supabaseClient.removeChannel(channel);
    }
  };
}

export function saveRemoteDisplayUrl(url: string) {
  try {
    localStorage.setItem(remoteDisplayUrlStorageKey, url);
  } catch {
    // Optional convenience only.
  }
  resetRemoteDisplayController();
}

export function subscribeRemoteDisplayControllerStatus(listener: (status: RemoteDisplayStatus) => void) {
  controllerStatusListeners.add(listener);
  listener(controllerStatus);
  return () => {
    controllerStatusListeners.delete(listener);
  };
}

export function subscribeRemoteDisplayControllerSnapshot(listener: (snapshot: RemoteDisplayControllerSnapshot) => void) {
  controllerSnapshotListeners.add(listener);
  listener(controllerSnapshot);
  return () => {
    controllerSnapshotListeners.delete(listener);
  };
}

function setControllerStatus(status: RemoteDisplayStatus, detail = '') {
  controllerStatus = status;
  controllerSnapshot = {
    ...controllerSnapshot,
    status,
    url: getRemoteDisplayUrl(),
    detail: detail || controllerSnapshot.detail,
    lastEventAt: new Date().toLocaleTimeString()
  };
  controllerStatusListeners.forEach((listener) => listener(status));
  controllerSnapshotListeners.forEach((listener) => listener(controllerSnapshot));
}

function updateControllerSnapshot(next: Partial<RemoteDisplayControllerSnapshot>) {
  controllerSnapshot = {
    ...controllerSnapshot,
    ...next,
    lastEventAt: next.lastEventAt ?? new Date().toLocaleTimeString()
  };
  controllerSnapshotListeners.forEach((listener) => listener(controllerSnapshot));
}

export function connectRemoteDisplay({ role, onMessage, onStatus }: RemoteDisplayConnectionOptions) {
  let socket: WebSocket | null = null;
  let reconnectTimer: number | null = null;
  let closedByClient = false;

  const setStatus = (status: RemoteDisplayStatus, detail?: string) => onStatus?.(status, detail);

  const connect = () => {
    if (closedByClient || typeof WebSocket === 'undefined') return;
    const url = getRemoteDisplayUrl();
    const mixedContentHint = window.location.protocol === 'https:' && url.startsWith('ws://')
      ? ' HTTPS pages usually block ws:// as mixed content. Use wss:// for Render-loaded OpenStage.'
      : '';
    let hadSocketError = false;
    setStatus('connecting', `Connecting to ${url}.${mixedContentHint}`);
    console.info(`[OpenStage Remote Display] ${role} connecting to ${url}`);

    try {
      socket = new WebSocket(url);
    } catch (error) {
      const detail = `Failed to create WebSocket for ${url}: ${error instanceof Error ? error.message : String(error)}.${mixedContentHint}`;
      console.error('[OpenStage Remote Display]', detail);
      setStatus('error', detail);
      scheduleReconnect();
      return;
    }

    socket.addEventListener('open', () => {
      hadSocketError = false;
      setStatus('connected', `Connected to ${url}.`);
      send({ type: 'hello', role, clientId });
    });

    socket.addEventListener('message', (event) => {
      const message = parseRemoteDisplayMessage(event.data);
      if (message) onMessage?.(message);
    });

    socket.addEventListener('close', (event) => {
      const detail = `Disconnected from ${url}. code=${event.code} clean=${event.wasClean}${event.reason ? ` reason=${event.reason}` : ''}`;
      console.warn('[OpenStage Remote Display]', detail);
      socket = null;
      setStatus(hadSocketError ? 'error' : 'disconnected', hadSocketError ? `${detail}. Previous WebSocket error occurred.${mixedContentHint}` : detail);
      scheduleReconnect();
    });

    socket.addEventListener('error', () => {
      hadSocketError = true;
      const detail = `WebSocket error for ${url}. readyState=${socket?.readyState ?? 'unknown'}.${mixedContentHint}`;
      console.error('[OpenStage Remote Display]', detail);
      setStatus('error', detail);
    });
  };

  const scheduleReconnect = () => {
    if (closedByClient || reconnectTimer) return;
    reconnectTimer = window.setTimeout(() => {
      reconnectTimer = null;
      connect();
    }, reconnectDelayMs);
  };

  const send = (message: RemoteDisplayMessage) => {
    if (socket?.readyState === WebSocket.OPEN) {
      socket.send(JSON.stringify(message));
      return true;
    }
    return false;
  };

  connect();

  return {
    send,
    close: () => {
      closedByClient = true;
      if (reconnectTimer) window.clearTimeout(reconnectTimer);
      reconnectTimer = null;
      socket?.close();
      socket = null;
    }
  };
}

export function publishRemoteDisplaySong(songId: string) {
  if (!songId) return false;
  pendingControllerSongId = songId;
  pendingControllerMessage = { type: 'song', songId };
  updateControllerSnapshot({
    url: getRemoteDisplayUrl(),
    lastSongId: songId,
    lastPublishState: 'queued',
    detail: `Queued song update ${songId} for ${getRemoteDisplayUrl()}.`
  });
  if (hostedReceiverRoomCode) {
    void publishHostedReceiverMessage({ type: 'song', songId });
  }
  ensureControllerConnection();
  const sent = controllerConnection?.send({ type: 'song', songId }) ?? false;
  updateControllerSnapshot({
    lastSongId: songId,
    lastPublishState: sent ? 'sent' : 'queued',
    detail: sent ? `Sent song update ${songId} to ${getRemoteDisplayUrl()}.` : `Queued song update ${songId}; controller socket is not open yet.`
  });
  return sent;
}

export function publishRemoteReceiverState(payload: RemoteReceiverPayload) {
  pendingControllerSongId = payload.song.id;
  pendingControllerMessage = { type: 'receiver-state', payload };
  pendingHostedMessage = pendingControllerMessage;
  updateControllerSnapshot({
    url: hostedReceiverRoomCode ? `supabase:${hostedReceiverRoomCode}` : getRemoteDisplayUrl(),
    lastSongId: payload.song.id,
    lastReceiverMode: payload.receiver.displayMode,
    lastPublishState: 'queued',
    detail: hostedReceiverRoomCode
      ? `Queued receiver update ${payload.song.title || payload.song.id} for Supabase room ${hostedReceiverRoomCode}.`
      : `Queued receiver update ${payload.song.title || payload.song.id} for ${getRemoteDisplayUrl()}.`
  });
  if (hostedReceiverRoomCode) {
    void publishHostedReceiverMessage(pendingControllerMessage);
    return true;
  }
  ensureControllerConnection();
  const sent = controllerConnection?.send(pendingControllerMessage) ?? false;
  updateControllerSnapshot({
    lastSongId: payload.song.id,
    lastReceiverMode: payload.receiver.displayMode,
    lastPublishState: sent ? 'sent' : 'queued',
    detail: sent ? `Sent receiver update to ${getRemoteDisplayUrl()}.` : 'Queued receiver update; controller socket is not open yet.'
  });
  return sent;
}

export function publishRemoteReceiverTestPattern(receiver: ReceiverDisplaySettings) {
  pendingControllerMessage = {
    type: 'receiver-test-pattern',
    payload: {
      receiver,
      updatedAt: new Date().toISOString()
    }
  };
  pendingHostedMessage = pendingControllerMessage;
  updateControllerSnapshot({
    url: hostedReceiverRoomCode ? `supabase:${hostedReceiverRoomCode}` : getRemoteDisplayUrl(),
    lastReceiverMode: receiver.displayMode,
    lastPublishState: 'queued',
    detail: hostedReceiverRoomCode
      ? `Queued receiver test pattern for Supabase room ${hostedReceiverRoomCode}.`
      : `Queued receiver test pattern for ${getRemoteDisplayUrl()}.`
  });
  if (hostedReceiverRoomCode) {
    void publishHostedReceiverMessage(pendingControllerMessage);
    return true;
  }
  ensureControllerConnection();
  const sent = controllerConnection?.send(pendingControllerMessage) ?? false;
  updateControllerSnapshot({
    lastReceiverMode: receiver.displayMode,
    lastPublishState: sent ? 'sent' : 'queued',
    detail: sent ? `Sent receiver test pattern to ${getRemoteDisplayUrl()}.` : 'Queued receiver test pattern; controller socket is not open yet.'
  });
  return sent;
}

async function publishHostedReceiverMessage(message: RemoteDisplayMessage) {
  if (!supabase) {
    setControllerStatus('error', 'Supabase is not configured.');
    return false;
  }
  const roomCode = normalizeHostedReceiverRoomCode(hostedReceiverRoomCode);
  if (!roomCode) return false;
  try {
    const channel = await getHostedReceiverControllerChannel(roomCode);
    const sendResult = await channel.send({
      type: 'broadcast',
      event: 'receiver-message',
      payload: { message }
    });
    if (sendResult !== 'ok') throw new Error(`Supabase broadcast failed: ${sendResult}`);
    await maybePersistDurableReceiverMessage(roomCode, message);
    const hasReceiver = channelPresenceHasRole(channel, 'display');
    const detail = hasReceiver
      ? `Sent ${message.type} to Supabase receiver room ${roomCode}.`
      : `Sent ${message.type} to Supabase room ${roomCode}; waiting for FireTV receiver presence.`;
    updateControllerSnapshot({
      status: hasReceiver ? 'connected' : 'disconnected',
      url: `supabase:${roomCode}`,
      lastPublishState: 'sent',
      detail
    });
    setControllerStatus(hasReceiver ? 'connected' : 'disconnected', detail);
    return true;
  } catch (error) {
    updateControllerSnapshot({
      status: 'error',
      url: `supabase:${roomCode}`,
      lastPublishState: 'queued',
      detail: error instanceof Error ? error.message : String(error)
    });
    setControllerStatus('error', error instanceof Error ? error.message : String(error));
    return false;
  }
}

export function connectRemoteDisplayControllerForDiagnostics() {
  return ensureControllerConnection();
}

export function resetRemoteDisplayController() {
  controllerConnection?.close();
  controllerConnection = null;
  pendingControllerSongId = '';
  pendingControllerMessage = null;
  pendingHostedMessage = null;
  updateControllerSnapshot({
    status: 'disconnected',
    url: getRemoteDisplayUrl(),
    detail: 'Controller connection reset.',
    lastPublishState: 'none',
    lastReceiverMode: ''
  });
  setControllerStatus('disconnected', 'Controller connection reset.');
}

function normalizeHostedReceiverRoomCode(roomCode: string) {
  return roomCode.trim().toUpperCase().replace(/[^A-Z0-9]/g, '');
}

function isReceiverRoomCode(roomCode: string) {
  return /^[A-Z0-9]{8}$/.test(roomCode);
}

async function ensureHostedReceiverRoom(roomCode: string, createNew: boolean) {
  if (!supabase) throw new Error('Supabase is not configured.');
  const expiresAt = new Date(Date.now() + 12 * 60 * 60 * 1000).toISOString();
  const row = {
    pairing_code: roomCode,
    updated_at: new Date().toISOString(),
    expires_at: expiresAt
  };
  const { error } = createNew
    ? await supabase
      .from('receiver_state')
      .insert({
        ...row,
        latest_message: null,
        durable_payload: null
      })
    : await supabase
      .from('receiver_state')
      .upsert(row, { onConflict: 'pairing_code' });
  if (error) throw error;
  return { roomCode, expiresAt };
}

function createReceiverRoomCode() {
  const bytes = new Uint8Array(8);
  crypto.getRandomValues(bytes);
  return Array.from(bytes, (byte) => receiverRoomAlphabet[byte % receiverRoomAlphabet.length]).join('');
}

function receiverChannelName(roomCode: string) {
  return `receiver:${roomCode}`;
}

async function getHostedReceiverControllerChannel(roomCode: string) {
  if (!supabase) throw new Error('Supabase is not configured.');
  if (hostedReceiverChannel && hostedReceiverChannelCode === roomCode) return hostedReceiverChannel;
  if (hostedReceiverChannel) {
    void supabase.removeChannel(hostedReceiverChannel);
    hostedReceiverChannel = null;
  }
  hostedReceiverChannelCode = roomCode;
  hostedReceiverChannel = supabase.channel(receiverChannelName(roomCode), {
    config: {
      broadcast: { self: false },
      presence: { key: `controller-${clientId}` }
    }
  });
  const channel = hostedReceiverChannel;
  channel.on('presence', { event: 'sync' }, () => {
    const hasReceiver = channelPresenceHasRole(channel, 'display');
    const detail = hasReceiver
      ? `Receiver ${roomCode} is present.`
      : `Supabase receiver room ${roomCode} connected. Waiting for FireTV receiver presence.`;
    updateControllerSnapshot({
      status: hasReceiver ? 'connected' : 'disconnected',
      url: `supabase:${roomCode}`,
      detail
    });
    setControllerStatus(hasReceiver ? 'connected' : 'disconnected', detail);
  });
  await new Promise<void>((resolve, reject) => {
    const timeout = window.setTimeout(() => reject(new Error('Supabase receiver channel timed out.')), 5000);
    channel.subscribe((status) => {
      if (status === 'SUBSCRIBED') {
        window.clearTimeout(timeout);
        void channel.track({ role: 'controller', clientId, onlineAt: new Date().toISOString() });
        resolve();
      }
      if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT') {
        window.clearTimeout(timeout);
        reject(new Error(`Supabase receiver channel ${status.toLowerCase()}.`));
      }
    });
  });
  return channel;
}

function channelPresenceHasRole(channel: ReturnType<NonNullable<typeof supabase>['channel']>, role: 'controller' | 'display') {
  const state = channel.presenceState() as Record<string, Array<{ role?: string }>>;
  return Object.values(state).some((metas) => metas.some((meta) => meta.role === role));
}

async function maybePersistDurableReceiverMessage(roomCode: string, message: RemoteDisplayMessage) {
  if (!supabase) return;
  if (message.type !== 'receiver-state' && message.type !== 'receiver-test-pattern') return;
  const durableSignature = durableReceiverMessageSignature(message);
  if (durableSignature === lastDurableReceiverSignature) return;
  lastDurableReceiverSignature = durableSignature;
  const now = new Date().toISOString();
  const { error } = await supabase
    .from('receiver_state')
    .upsert({
      pairing_code: roomCode,
      latest_message: message,
      durable_payload: durableReceiverPayload(message),
      updated_at: now,
      expires_at: new Date(Date.now() + 12 * 60 * 60 * 1000).toISOString()
    }, { onConflict: 'pairing_code' });
  if (error) throw error;
}

function durableReceiverMessageSignature(message: RemoteDisplayMessage) {
  return JSON.stringify(durableReceiverPayload(message));
}

function durableReceiverPayload(message: RemoteDisplayMessage) {
  if (message.type === 'receiver-test-pattern') {
    return {
      type: message.type,
      receiver: message.payload.receiver
    };
  }
  if (message.type !== 'receiver-state') return { type: message.type };
  const payload = message.payload;
  return {
    type: message.type,
    song: payload.song,
    receiver: payload.receiver,
    visualTheme: payload.visualTheme,
    typography: payload.typography,
    transpose: payload.performance.transpose,
    showChords: payload.performance.showChords,
    showChordsByProfile: payload.performance.showChordsByProfile,
    showHarmonyCues: payload.performance.showHarmonyCues,
    showHarmonyCuesByProfile: payload.performance.showHarmonyCuesByProfile,
    showNashvilleNumbers: payload.performance.showNashvilleNumbers,
    stageTheme: payload.performance.stageTheme,
    theme: payload.performance.theme,
    activeProfile: payload.performance.activeProfile
  };
}

function ensureControllerConnection() {
  if (controllerConnection) return controllerConnection;
  controllerConnection = connectRemoteDisplay({
    role: 'controller',
    onStatus: (status, detail) => {
      setControllerStatus(status, detail);
      if (status !== 'connected' || !pendingControllerMessage) return;
      const sentPending = controllerConnection?.send(pendingControllerMessage);
      updateControllerSnapshot({
        lastPublishState: sentPending ? 'sent' : 'queued',
        detail: sentPending
          ? `Sent pending ${pendingControllerMessage.type} to ${getRemoteDisplayUrl()}.`
          : `Controller connected but pending ${pendingControllerMessage.type} could not be sent yet.`
      });
    }
  });
  return controllerConnection;
}

function parseRemoteDisplayMessage(data: unknown): RemoteDisplayMessage | null {
  if (typeof data !== 'string') return null;
  try {
    const parsed = JSON.parse(data) as Partial<RemoteDisplayMessage>;
    if (parsed.type === 'song' && typeof parsed.songId === 'string') return { type: 'song', songId: parsed.songId };
    if (parsed.type === 'receiver-state' && isRemoteReceiverPayload(parsed.payload)) return { type: 'receiver-state', payload: parsed.payload };
    if (parsed.type === 'receiver-test-pattern' && isRemoteReceiverTestPatternPayload(parsed.payload)) {
      return { type: 'receiver-test-pattern', payload: parsed.payload };
    }
    if (
      parsed.type === 'hello' &&
      (parsed.role === 'controller' || parsed.role === 'display') &&
      typeof parsed.clientId === 'string'
    ) {
      return { type: 'hello', role: parsed.role, clientId: parsed.clientId };
    }
  } catch {
    return null;
  }
  return null;
}

function isRemoteReceiverPayload(payload: unknown): payload is RemoteReceiverPayload {
  if (!payload || typeof payload !== 'object') return false;
  const candidate = payload as Partial<RemoteReceiverPayload>;
  return Boolean(
    candidate.song &&
      typeof candidate.song === 'object' &&
      typeof candidate.song.id === 'string' &&
      candidate.performance &&
      typeof candidate.performance === 'object' &&
      candidate.receiver &&
      typeof candidate.receiver === 'object' &&
      typeof candidate.updatedAt === 'string'
  );
}

function isRemoteReceiverTestPatternPayload(payload: unknown): payload is RemoteReceiverTestPatternPayload {
  if (!payload || typeof payload !== 'object') return false;
  const candidate = payload as Partial<RemoteReceiverTestPatternPayload>;
  return Boolean(candidate.receiver && typeof candidate.receiver === 'object' && typeof candidate.updatedAt === 'string');
}
