export type RemoteDisplayMessage =
  | { type: 'hello'; role: 'controller' | 'display'; clientId: string }
  | { type: 'song'; songId: string };

export type RemoteDisplayStatus = 'connecting' | 'connected' | 'disconnected' | 'error';

type RemoteDisplayConnectionOptions = {
  role: 'controller' | 'display';
  onMessage?: (message: RemoteDisplayMessage) => void;
  onStatus?: (status: RemoteDisplayStatus) => void;
};

const remoteDisplayUrlStorageKey = 'openstage-remote-display-ws-url-v1';
const reconnectDelayMs = 1200;
const clientId = `${Date.now().toString(36)}-${Math.random().toString(36).slice(2)}`;

let controllerConnection: ReturnType<typeof connectRemoteDisplay> | null = null;
let pendingControllerSongId = '';

export function isDisplayRoute() {
  return window.location.pathname.replace(/\/+$/, '') === '/display';
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
}

export function connectRemoteDisplay({ role, onMessage, onStatus }: RemoteDisplayConnectionOptions) {
  let socket: WebSocket | null = null;
  let reconnectTimer: number | null = null;
  let closedByClient = false;

  const setStatus = (status: RemoteDisplayStatus) => onStatus?.(status);

  const connect = () => {
    if (closedByClient || typeof WebSocket === 'undefined') return;
    setStatus('connecting');

    try {
      socket = new WebSocket(getRemoteDisplayUrl());
    } catch {
      setStatus('error');
      scheduleReconnect();
      return;
    }

    socket.addEventListener('open', () => {
      setStatus('connected');
      send({ type: 'hello', role, clientId });
    });

    socket.addEventListener('message', (event) => {
      const message = parseRemoteDisplayMessage(event.data);
      if (message) onMessage?.(message);
    });

    socket.addEventListener('close', () => {
      socket = null;
      setStatus('disconnected');
      scheduleReconnect();
    });

    socket.addEventListener('error', () => {
      setStatus('error');
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
  if (!controllerConnection) {
    controllerConnection = connectRemoteDisplay({
      role: 'controller',
      onStatus: (status) => {
        if (status !== 'connected' || !pendingControllerSongId) return;
        controllerConnection?.send({ type: 'song', songId: pendingControllerSongId });
      }
    });
  }
  const sent = controllerConnection.send({ type: 'song', songId });
  return sent;
}

export function resetRemoteDisplayController() {
  controllerConnection?.close();
  controllerConnection = null;
  pendingControllerSongId = '';
}

function parseRemoteDisplayMessage(data: unknown): RemoteDisplayMessage | null {
  if (typeof data !== 'string') return null;
  try {
    const parsed = JSON.parse(data) as Partial<RemoteDisplayMessage>;
    if (parsed.type === 'song' && typeof parsed.songId === 'string') return { type: 'song', songId: parsed.songId };
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
