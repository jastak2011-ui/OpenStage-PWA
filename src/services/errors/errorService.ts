import { useAppStore } from '../../store/useAppStore';

export function reportError(message: string, error: unknown) {
  const detail = error instanceof Error ? error.message : String(error);
  useAppStore.getState().log('error', message, detail);
}

export function installGlobalErrorHandlers() {
  window.addEventListener('error', (event) => {
    reportError('Unexpected application error', event.error ?? event.message);
  });
  window.addEventListener('unhandledrejection', (event) => {
    reportError('Unexpected async error', event.reason);
  });
}
