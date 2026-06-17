import type { ExternalDisplaySettings, PerformanceState, Song } from '../types';

export type ExternalDisplayPayload = {
  song: Song;
  performance: PerformanceState;
  effectiveCapo: number;
  updatedAt: string;
};

const payloadKey = 'openstage-external-display-payload';

export function supportsPresentationApi() {
  return typeof window !== 'undefined' && 'PresentationRequest' in window;
}

export function supportsExternalWindow() {
  return typeof window !== 'undefined' && typeof window.open === 'function';
}

export function externalPrompterUrl() {
  const url = new URL(window.location.href);
  url.search = '';
  url.hash = '';
  url.searchParams.set('externalDisplay', 'prompter');
  return url.toString();
}

export async function openExternalPrompter() {
  const url = externalPrompterUrl();
  const presentationCtor = (window as unknown as { PresentationRequest?: new (urls: string[]) => { start: () => Promise<unknown> } }).PresentationRequest;

  if (presentationCtor) {
    const request = new presentationCtor([url]);
    await request.start();
    return 'presentation-api' as const;
  }

  const opened = window.open(url, 'openstage-external-prompter', 'popup=yes,width=1280,height=720');
  return opened ? ('window' as const) : ('blocked' as const);
}

export function saveExternalDisplayPayload(payload: ExternalDisplayPayload) {
  try {
    localStorage.setItem(payloadKey, JSON.stringify(payload));
  } catch {
    return;
  }

  try {
    const channel = new BroadcastChannel('openstage-external-display');
    channel.postMessage(payload);
    channel.close();
  } catch {
    return;
  }
}

export function loadExternalDisplayPayload(): ExternalDisplayPayload | null {
  try {
    const raw = localStorage.getItem(payloadKey);
    return raw ? (JSON.parse(raw) as ExternalDisplayPayload) : null;
  } catch {
    return null;
  }
}

export function isExternalPrompterRoute() {
  return new URLSearchParams(window.location.search).get('externalDisplay') === 'prompter';
}

export function externalRotationDegrees(rotation: ExternalDisplaySettings['rotation']) {
  if (rotation === 'cw-90') return 90;
  if (rotation === 'ccw-90') return -90;
  if (rotation === 'rotate-180') return 180;
  return 0;
}

export function externalScale(settings: ExternalDisplaySettings) {
  if (settings.scaleMode === 'manual') return settings.manualZoom;
  if (settings.scaleMode === 'fill') return 1.12;
  return 1;
}
