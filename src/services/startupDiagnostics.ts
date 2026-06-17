export type StartupDiagnostics = {
  appStarted: boolean;
  userAgent: string;
  indexedDbAvailable: boolean;
  localStorageAvailable: boolean;
  serviceWorkerSupported: boolean;
  fullscreenSupported: boolean;
  dragDropFolderSupported: boolean;
  wakeLockSupported: boolean;
  fileSystemAccessSupported: boolean;
  route: string;
  startupCheckpoints: string[];
  startupError?: string;
};

let startupError = '';

export function markStartupError(error: unknown) {
  startupError = error instanceof Error ? `${error.name}: ${error.message}` : String(error);
}

export function getStartupDiagnostics(appStarted: boolean): StartupDiagnostics {
  return {
    appStarted,
    userAgent: safeRead(() => navigator.userAgent, 'unknown'),
    indexedDbAvailable: safeRead(() => typeof indexedDB !== 'undefined', false),
    localStorageAvailable: isLocalStorageAvailable(),
    serviceWorkerSupported: safeRead(() => 'serviceWorker' in navigator, false),
    fullscreenSupported: safeRead(() => Boolean(document.documentElement.requestFullscreen || document.exitFullscreen), false),
    dragDropFolderSupported: safeRead(() => 'DataTransferItem' in window && 'webkitGetAsEntry' in DataTransferItem.prototype, false),
    wakeLockSupported: safeRead(() => 'wakeLock' in navigator, false),
    fileSystemAccessSupported: safeRead(() => 'showOpenFilePicker' in window, false),
    route: safeRead(() => `${location.pathname}${location.search}${location.hash}`, 'unknown'),
    startupCheckpoints: getHtmlStartupCheckpoints(),
    startupError: startupError || undefined
  };
}

export function shouldShowStartupDebug() {
  return safeRead(() => new URLSearchParams(location.search).get('debug') === 'true', false);
}

function isLocalStorageAvailable() {
  return safeRead(() => {
    const key = 'openstage-storage-probe';
    localStorage.setItem(key, '1');
    localStorage.removeItem(key);
    return true;
  }, false);
}

function safeRead<T>(reader: () => T, fallback: T) {
  try {
    return reader();
  } catch {
    return fallback;
  }
}

function getHtmlStartupCheckpoints() {
  return safeRead(() => {
    const text = document.getElementById('openstage-startup-log')?.textContent ?? '';
    return text.split('\n').filter(Boolean);
  }, [] as string[]);
}
