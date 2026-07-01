import { useSyncExternalStore } from 'react';

export type PwaUpdateSnapshot = {
  supported: boolean;
  updateWaiting: boolean;
  dismissed: boolean;
  applying: boolean;
  lastCheckedAt: string;
  lastError: string;
  registrationState: string;
  activeState: string;
  waitingState: string;
  installingState: string;
  appVersion: string;
  buildTime: string;
};

type UpdateSWFunction = (reloadPage?: boolean) => Promise<void>;

declare const __APP_VERSION__: string;
declare const __APP_BUILD_TIME__: string;

let updateSW: UpdateSWFunction | null = null;
let registration: ServiceWorkerRegistration | null = null;
let snapshot: PwaUpdateSnapshot = {
  supported: typeof navigator !== 'undefined' && 'serviceWorker' in navigator,
  updateWaiting: false,
  dismissed: false,
  applying: false,
  lastCheckedAt: '',
  lastError: '',
  registrationState: 'unknown',
  activeState: 'none',
  waitingState: 'none',
  installingState: 'none',
  appVersion: typeof __APP_VERSION__ === 'string' ? __APP_VERSION__ : 'unknown',
  buildTime: typeof __APP_BUILD_TIME__ === 'string' ? __APP_BUILD_TIME__ : 'unknown'
};

const listeners = new Set<() => void>();

function emit() {
  listeners.forEach((listener) => listener());
}

function setSnapshot(next: Partial<PwaUpdateSnapshot>) {
  snapshot = { ...snapshot, ...next };
  emit();
}

function stateOf(worker: ServiceWorker | null | undefined) {
  return worker?.state ?? 'none';
}

function updateRegistrationState(nextRegistration: ServiceWorkerRegistration | null = registration) {
  registration = nextRegistration;
  setSnapshot({
    supported: typeof navigator !== 'undefined' && 'serviceWorker' in navigator,
    updateWaiting: Boolean(registration?.waiting),
    registrationState: registration ? 'registered' : snapshot.supported ? 'not-registered' : 'unsupported',
    activeState: stateOf(registration?.active),
    waitingState: stateOf(registration?.waiting),
    installingState: stateOf(registration?.installing)
  });
}

export function configurePwaUpdateService(nextUpdateSW: UpdateSWFunction) {
  updateSW = nextUpdateSW;
}

export function notifyPwaUpdateFound(nextRegistration?: ServiceWorkerRegistration) {
  console.log('PWA_UPDATE_FOUND');
  if (nextRegistration) registration = nextRegistration;
  updateRegistrationState(registration);
}

export function notifyPwaUpdateWaiting(nextRegistration?: ServiceWorkerRegistration) {
  console.log('PWA_UPDATE_WAITING');
  if (nextRegistration) registration = nextRegistration;
  setSnapshot({ dismissed: false });
  updateRegistrationState(registration);
}

export async function refreshPwaUpdateStatus() {
  if (typeof navigator === 'undefined' || !('serviceWorker' in navigator)) {
    updateRegistrationState(null);
    return snapshot;
  }

  try {
    const nextRegistration = await navigator.serviceWorker.getRegistration();
    updateRegistrationState(nextRegistration ?? null);
    return snapshot;
  } catch (error) {
    setSnapshot({ lastError: error instanceof Error ? error.message : String(error) });
    return snapshot;
  }
}

export async function checkForPwaUpdate() {
  const checkedAt = new Date().toISOString();
  setSnapshot({ lastCheckedAt: checkedAt, lastError: '' });

  if (typeof navigator === 'undefined' || !('serviceWorker' in navigator)) {
    updateRegistrationState(null);
    return snapshot;
  }

  try {
    const nextRegistration = registration ?? await navigator.serviceWorker.getRegistration();
    if (!nextRegistration) {
      updateRegistrationState(null);
      return snapshot;
    }

    registration = nextRegistration;
    await nextRegistration.update();
    updateRegistrationState(nextRegistration);
    if (nextRegistration.waiting) notifyPwaUpdateWaiting(nextRegistration);
    return snapshot;
  } catch (error) {
    setSnapshot({ lastError: error instanceof Error ? error.message : String(error) });
    return snapshot;
  }
}

export function dismissPwaUpdate() {
  setSnapshot({ dismissed: true });
}

export async function applyPwaUpdate() {
  console.log('PWA_UPDATE_APPLYING');
  setSnapshot({ applying: true, dismissed: false, lastError: '' });

  try {
    if (typeof navigator !== 'undefined' && 'serviceWorker' in navigator) {
      navigator.serviceWorker.addEventListener('controllerchange', () => {
        console.log('PWA_UPDATE_RELOADING');
      }, { once: true });
    }

    if (updateSW) {
      await updateSW(true);
      return;
    }

    const waitingWorker = registration?.waiting;
    if (!waitingWorker) {
      await checkForPwaUpdate();
      if (!registration?.waiting) throw new Error('No waiting service worker is available.');
    }

    navigator.serviceWorker.addEventListener('controllerchange', () => {
      console.log('PWA_UPDATE_RELOADING');
      window.location.reload();
    }, { once: true });
    registration?.waiting?.postMessage({ type: 'SKIP_WAITING' });
  } catch (error) {
    setSnapshot({
      applying: false,
      lastError: error instanceof Error ? error.message : String(error)
    });
  }
}

export function subscribePwaUpdate(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function getPwaUpdateSnapshot() {
  return snapshot;
}

export function usePwaUpdateSnapshot() {
  return useSyncExternalStore(subscribePwaUpdate, getPwaUpdateSnapshot, getPwaUpdateSnapshot);
}
