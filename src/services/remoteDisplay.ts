import type { PerformanceState, ReceiverDisplaySettings, Song } from '../types';

export type RemoteReceiverPayload = {
  song: Song;
  performance: PerformanceState;
  effectiveCapo: number;
  scrollTop: number;
  scrollProgress: number;
  autoscrollActive: boolean;
  receiver: ReceiverDisplaySettings;
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
const reconnectDelayMs = 1200;
const clientId = `${Date.now().toString(36)}-${Math.random().toString(36).slice(2)}`;

let controllerConnection: ReturnType<typeof connectRemoteDisplay> | null = null;
let pendingControllerSongId = '';
let pendingControllerMessage: RemoteDisplayMessage | null = null;
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
  updateControllerSnapshot({
    url: getRemoteDisplayUrl(),
    lastSongId: payload.song.id,
    lastReceiverMode: payload.receiver.displayMode,
    lastPublishState: 'queued',
    detail: `Queued receiver update ${payload.song.title || payload.song.id} for ${getRemoteDisplayUrl()}.`
  });
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
  updateControllerSnapshot({
    url: getRemoteDisplayUrl(),
    lastReceiverMode: receiver.displayMode,
    lastPublishState: 'queued',
    detail: `Queued receiver test pattern for ${getRemoteDisplayUrl()}.`
  });
  ensureControllerConnection();
  const sent = controllerConnection?.send(pendingControllerMessage) ?? false;
  updateControllerSnapshot({
    lastReceiverMode: receiver.displayMode,
    lastPublishState: sent ? 'sent' : 'queued',
    detail: sent ? `Sent receiver test pattern to ${getRemoteDisplayUrl()}.` : 'Queued receiver test pattern; controller socket is not open yet.'
  });
  return sent;
}

export function connectRemoteDisplayControllerForDiagnostics() {
  return ensureControllerConnection();
}

export function resetRemoteDisplayController() {
  controllerConnection?.close();
  controllerConnection = null;
  pendingControllerSongId = '';
  pendingControllerMessage = null;
  updateControllerSnapshot({
    status: 'disconnected',
    url: getRemoteDisplayUrl(),
    detail: 'Controller connection reset.',
    lastPublishState: 'none',
    lastReceiverMode: ''
  });
  setControllerStatus('disconnected', 'Controller connection reset.');
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
