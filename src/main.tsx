import React from 'react';
import ReactDOM from 'react-dom/client';
import { registerSW } from 'virtual:pwa-register';
import App from './App';
import './styles.css';
import { installGlobalErrorHandlers } from './services/errors/errorService';
import { getStartupDiagnostics, markStartupError, shouldShowStartupDebug } from './services/startupDiagnostics';

declare global {
  interface Window {
    OpenStageStartup?: {
      checkpoint: (message: string) => void;
      markMounted: () => void;
      showError: (label: string, error: unknown) => void;
      getCheckpoints: () => string[];
    };
    OpenStageReactMounted?: boolean;
  }
}

window.OpenStageStartup?.checkpoint('main script loaded');
installGlobalErrorHandlers();

if (!import.meta.env.DEV && 'serviceWorker' in navigator) {
  registerSW({ immediate: true });
}

class ErrorBoundary extends React.Component<{ children: React.ReactNode }, { error: Error | null }> {
  state: { error: Error | null } = { error: null };

  static getDerivedStateFromError(error: Error) {
    markStartupError(error);
    return { error };
  }

  componentDidCatch(error: Error) {
    markStartupError(error);
  }

  render() {
    if (this.state.error) {
      return (
        <div className="min-h-screen bg-slate-950 p-6 text-slate-100">
          <h1 className="mb-3 text-2xl font-semibold">OpenStage could not start</h1>
          <p className="mb-4 text-slate-300">A startup error was caught instead of showing a blank screen.</p>
          <pre className="mb-6 overflow-auto rounded-md border border-red-500/40 bg-red-950/30 p-4 text-sm text-red-100">{this.state.error.stack || this.state.error.message}</pre>
          <StartupDebugPanel appStarted={false} />
        </div>
      );
    }

    return this.props.children;
  }
}

function StartupDebugPanel({ appStarted }: { appStarted: boolean }) {
  const [, refresh] = React.useState(0);
  React.useEffect(() => {
    if (!shouldShowStartupDebug() && appStarted) return;
    const timers = [window.setTimeout(() => refresh((value) => value + 1), 250), window.setTimeout(() => refresh((value) => value + 1), 1200)];
    return () => timers.forEach(window.clearTimeout);
  }, [appStarted]);

  if (!shouldShowStartupDebug() && appStarted) return null;
  const diagnostics = getStartupDiagnostics(appStarted);
  return (
    <section className="fixed bottom-3 left-3 z-[9999] max-w-[min(34rem,calc(100vw-1.5rem))] rounded-md border border-amber-400/50 bg-slate-950/95 p-3 text-xs text-amber-50 shadow-2xl">
      <div className="mb-2 text-sm font-semibold text-amber-200">OpenStage Startup Debug</div>
      <div>app started: {diagnostics.appStarted ? 'yes' : 'no'}</div>
      <div>user agent: {diagnostics.userAgent}</div>
      <div>IndexedDB available: {diagnostics.indexedDbAvailable ? 'yes' : 'no'}</div>
      <div>localStorage available: {diagnostics.localStorageAvailable ? 'yes' : 'no'}</div>
      <div>service worker supported: {diagnostics.serviceWorkerSupported ? 'yes' : 'no'}</div>
      <div>current route: {diagnostics.route}</div>
      <div>fullscreen API: {diagnostics.fullscreenSupported ? 'yes' : 'no'}</div>
      <div>folder drag/drop API: {diagnostics.dragDropFolderSupported ? 'yes' : 'no'}</div>
      <div>wake lock API: {diagnostics.wakeLockSupported ? 'yes' : 'no'}</div>
      <div>file system API: {diagnostics.fileSystemAccessSupported ? 'yes' : 'no'}</div>
      <div>startup checkpoints:</div>
      <ol className="ml-4 list-decimal">
        {diagnostics.startupCheckpoints.length > 0 ? diagnostics.startupCheckpoints.map((checkpoint) => <li key={checkpoint}>{checkpoint}</li>) : <li>-</li>}
      </ol>
      <div>startup error: {diagnostics.startupError ?? '-'}</div>
    </section>
  );
}

function MountMarker() {
  React.useEffect(() => {
    window.OpenStageReactMounted = true;
    window.OpenStageStartup?.markMounted();
  }, []);

  return null;
}

function CastReceiverTestPage() {
  const params = new URLSearchParams(window.location.search);
  const demo = params.get('demo')?.trim().toLowerCase() || '';
  const demoSongs: Record<string, { title: string; artist: string; chart: string }> = {
    '3am': {
      title: '3AM',
      artist: 'Matchbox 20',
      chart: 'Line1\nLine2',
    },
    takeiteasy: {
      title: 'Take It Easy',
      artist: 'Eagles',
      chart: "Well I'm running down the road\nTrying to loosen my load",
    },
  };
  const demoSong = demoSongs[demo];
  const title = demoSong?.title || params.get('title')?.trim() || 'Take It Easy';
  const artist = demoSong?.artist || params.get('artist')?.trim() || 'Eagles';
  const chart = demoSong?.chart || params.get('chart')?.trim() || "Well I'm running down the road\nTryin' to loosen my load";
  const chartLineCount = chart.split(/\r\n|\r|\n/).length;

  React.useEffect(() => {
    window.OpenStageReactMounted = true;
    window.OpenStageStartup?.markMounted();
  }, []);

  return (
    <main className="flex min-h-screen w-screen items-center justify-center bg-white p-8 text-center text-black">
      <section className="grid max-w-4xl gap-10">
        <div>
          <h1 className="text-6xl font-bold leading-tight">OpenStage Cast Receiver</h1>
          <p className="mt-5 text-4xl font-semibold">Receiver Online</p>
        </div>
        <div className="grid gap-6 text-4xl">
          <div>
            <div className="text-2xl font-semibold uppercase tracking-wide">Current Song:</div>
            <div className="mt-2 text-5xl font-bold">{title}</div>
          </div>
          <div>
            <div className="text-2xl font-semibold uppercase tracking-wide">Artist:</div>
            <div className="mt-2 text-5xl font-bold">{artist}</div>
          </div>
        </div>
        <pre className="whitespace-pre-wrap text-left text-4xl font-semibold leading-relaxed">{chart}</pre>
        <div className="fixed bottom-8 left-0 right-0 grid gap-1 text-xl font-semibold">
          {demoSong ? <p>Demo mode: {demo}</p> : null}
          <p>Chart lines: {chartLineCount}</p>
          <p>Receiver page loaded successfully</p>
        </div>
      </section>
    </main>
  );
}

window.OpenStageStartup?.checkpoint('React render started');
const isCastReceiverRoute = window.location.pathname.replace(/\/+$/, '') === '/cast-receiver';
ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <ErrorBoundary>
      {isCastReceiverRoute ? (
        <CastReceiverTestPage />
      ) : (
        <>
          <MountMarker />
          <App />
          <StartupDebugPanel appStarted />
        </>
      )}
    </ErrorBoundary>
  </React.StrictMode>
);
