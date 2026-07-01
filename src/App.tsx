import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import {
  AlertTriangle,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  ChevronsDown,
  CheckCircle,
  Cloud,
  Copy,
  Download,
  Expand,
  FileJson,
  Gauge,
  GripVertical,
  HelpCircle,
  Library,
  ListMusic,
  LogIn,
  Lock,
  Menu,
  Mic2,
  Monitor,
  Moon,
  MoreHorizontal,
  Music2,
  Pause,
  Pencil,
  Play,
  Plus,
  RotateCcw,
  Save,
  Search,
  Settings,
  Share2,
  Sparkles,
  Star,
  Sun,
  Trash2,
  Unlock,
  Upload,
  X,
} from 'lucide-react';
import {
  DndContext,
  type DragEndEvent,
  KeyboardSensor,
  PointerSensor,
  closestCenter,
  useSensor,
  useSensors
} from '@dnd-kit/core';
import {
  SortableContext,
  arrayMove,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { db, ensureSeedData } from './data/db';
import { lyricTextHarmonyState, renderLyricTextWithHarmony, type LyricTextWithHarmonyOptions } from './components/LyricTextWithHarmony';
import { useCloud } from './cloud/cloud';
import { parseCsvSongs, parseJsonSongs, songsToCsv, songsToJson } from './lib/importExport';
import { chordOverTextToAnchoredLine, chordTokensToAnchoredLine, inlineChordsToChordOverLyrics, type AnchoredChordLine } from './lib/chordLayout';
import { isChordProFileName, parseChordPro, parseChordProBundle } from './lib/chordpro';
import {
  advanceVirtualScrollTop,
  applyAutoscrollSpeedMultiplier,
  calculateAutoscrollPixelsPerSecond,
  detectAutoscrollHeartbeatStall,
  estimateBpmAutoscrollDurationSeconds
} from './lib/autoscroll';
import {
  adjustAutoscrollSpeedMultiplier,
  autoscrollLongPressMs,
  autoscrollSpeedMax,
  autoscrollSpeedMin,
  autoscrollSpeedQuickPresets,
  autoscrollSpeedStep
} from './lib/autoscrollButton';
import { formatDuration, isValidDurationInput, parseDurationInput } from './lib/format';
import { getStageSwipeDirection } from './lib/stageGestures';
import { findSharedSongDuplicate, sharedDuplicateHasSameSongUuid, type SharedSongDuplicate } from './lib/sharedSongImport';
import { applyStageHarmonyEdit, type StageHarmonyEditOperation } from './lib/stageHarmonyEdit';
import { clampTempoBpm, maxTempoBpm, minTempoBpm, nextTempoBeat, nextTempoCountdownSeconds, normalizeTempoBpm, parseTempoBpmInput, shouldShowTempoMeter, shouldToggleTempoOnPointerEnd, stepTempoBpm, tempoDotTone, tempoIntervalMs } from './lib/tempo';
import { createId, createSongUuid } from './lib/ids';
import { castStateFromSong, publishCastState } from './services/castState';
import { parseWebpageChartText, type WebpageChartImportPreview } from './lib/webpageChartImport';
import {
  connectRemoteDisplay,
  connectRemoteDisplayControllerForDiagnostics,
  createHostedReceiverRoom,
  fetchReceiverRegistration,
  fetchHostedReceiverRoomState,
  getReceiverDisplayName,
  getSavedReceiverSelection,
  getHostedReceiverRoomCode,
  listReceiverRegistrations,
  getRemoteDisplayUrl,
  isDisplayRoute,
  isReceiverRoute,
  publishRemoteDisplaySong,
  publishRemoteReceiverState,
  publishRemoteReceiverTestPattern,
  removeReceiverRegistration,
  resetHostedReceiverRoomCode,
  saveReceiverDisplayName,
  saveReceiverSelection,
  saveRemoteDisplayUrl,
  shouldUseLocalReceiverRelay,
  subscribeHostedReceiverRoom,
  updateReceiverRegistration,
  subscribeRemoteDisplayControllerSnapshot,
  subscribeRemoteDisplayControllerStatus,
  type RemoteDisplayControllerSnapshot,
  type RemoteDisplayStatus,
  type ReceiverRegistration,
  type RemoteReceiverPayload,
  type RemoteReceiverTestPatternPayload
} from './services/remoteDisplay';
import {
  anchoredChordLineLayout,
  boldChordsUpdate,
  chartLineHeightEm,
  chartRowSpacingPx,
  chordFontSizeUpdate,
  chordFontColorOptions,
  chordFontColorUpdate,
  chordHighlightColorUpdate,
  chordHighlightOptions,
  chordVerticalOffsetUpdate,
  documentThemeOptions,
  documentThemeUpdate,
  getDocumentThemePreset,
  getEffectiveBoldChords,
  getEffectiveChordFontColor,
  getEffectiveChordFontSize,
  getEffectiveChordHighlightColor,
  getEffectiveChordVerticalOffset,
  getEffectiveDocumentTheme,
  getEffectiveHeaderFontSize,
  getEffectiveHarmonyIconColor,
  getEffectiveHarmonyIconVisible,
  getEffectiveHarmonyItalic,
  getEffectiveHarmonyTextColor,
  getEffectiveHarmonyUnderline,
  getEffectiveItalicChords,
  getEffectiveLineSpacing,
  getEffectiveLyricFontSize,
  getEffectiveSectionBold,
  getEffectiveSectionFontColor,
  getEffectiveSectionFontSize,
  getEffectiveSectionItalic,
  getEffectiveSectionSpacingAfter,
  getEffectiveSectionSpacingBefore,
  getEffectiveSectionUppercase,
  getEffectiveShowChords,
  getEffectiveShowHarmonyCues,
  getEffectiveSongArtistBold,
  getEffectiveSongArtistColor,
  getEffectiveSongArtistFontSize,
  getEffectiveSongArtistItalic,
  getEffectiveSongTitleBold,
  getEffectiveSongTitleColor,
  getEffectiveSongTitleFontSize,
  getEffectiveSongTitleItalic,
  getEffectiveStageFontFamily,
  getEffectiveUseMonospaceChords,
  headerFontSizeUpdate,
  harmonyColorOptions,
  harmonyIconColorUpdate,
  harmonyIconVisibleUpdate,
  harmonyItalicUpdate,
  harmonyTextColorUpdate,
  harmonyUnderlineUpdate,
  italicChordsUpdate,
  lineSpacingUpdate,
  lyricFontSizeUpdate,
  resolveChordFontColor,
  resolveChordHighlightColor,
  resolveHarmonyColor,
  resolveSectionFontColor,
  resolveStageFontFamily,
  sectionBoldUpdate,
  sectionFontColorOptions,
  sectionFontColorUpdate,
  sectionFontSizeUpdate,
  sectionItalicUpdate,
  sectionSpacingAfterUpdate,
  sectionSpacingBeforeUpdate,
  sectionUppercaseUpdate,
  showHarmonyCuesUpdate,
  showChordsUpdate,
  songArtistBoldUpdate,
  songArtistColorUpdate,
  songArtistFontSizeUpdate,
  songArtistItalicUpdate,
  songDocumentColorOptions,
  songTitleBoldUpdate,
  songTitleColorUpdate,
  songTitleFontSizeUpdate,
  songTitleItalicUpdate,
  stageFontFamilyOptions,
  stageFontFamilyUpdate,
  useMonospaceChordsUpdate
} from './lib/displaySettings';
import { isRangeInsideHarmonyMarkup, markHarmonyRange, removeHarmonyRange, type HarmonyRange } from './lib/harmony';
import { isOnSongArchiveFileName, parseOnSongArchive } from './lib/onsongArchive';
import {
  createPortableBackup,
  createRestorePoint,
  loadRestorePoint,
  pruneExpiredRestorePoint,
  restoreFromRestorePoint,
  restorePortableBackup,
  saveLocalCheckpoint
} from './services/backup/backupService';
import { reportError } from './services/errors/errorService';
import { applyPwaUpdate, checkForPwaUpdate, dismissPwaUpdate, usePwaUpdateSnapshot, type PwaUpdateSnapshot } from './services/pwaUpdate';
import {
  applyEnrichment,
  enrichSongMetadata,
  isMissing,
  type EnrichmentProposal,
  type EnrichmentResult
} from './services/enrichment/metadataEnrichment';
import {
  appleTvPortraitPrompterSettings,
  calculateExternalPrompterLayout,
  isExternalPrompterRoute,
  loadExternalDisplayPayload,
  normalizeExternalDisplaySettings,
  openExternalPrompter,
  saveExternalDisplayPayload,
  supportsExternalWindow,
  supportsPresentationApi,
  type ExternalDisplayPayload
} from './services/externalDisplay';
import { clearRenderCache, getRenderCacheSize, preloadSongs, renderSong, type RenderedLine } from './services/rendering/songRenderer';
import { markStartupError } from './services/startupDiagnostics';
import { syncLibraryOfflineFirst } from './services/sync/syncEngine';
import { getStageTheme, stageThemes } from './services/theme/themeEngine';
import { defaultPedalMappings, defaultPerformanceState, useAppStore } from './store/useAppStore';
import {
  pullSongsFromSupabase,
  pushSongsToSupabase,
  signInWithEmail,
  signOutSupabase,
  supabase
} from './data/supabase';
import type {
  AppLogEntry,
  AutoscrollPreset,
  ReadingPace,
  DeviceProfile,
  PedalAction,
  PedalMappings,
  PerformanceState,
  PerformanceTheme,
  ParsedChordProLine,
  ReceiverDisplayMode,
  ReceiverDisplaySettings,
  RenderDiagnostics,
  SavedSetlist,
  SetlistItem,
  Song,
  StageMode,
  SyncConflict,
  SyncState
} from './types';

type DuplicateStrategy = 'skip' | 'replace' | 'import';

type ImportSummary = {
  fileNames: string[];
  songsFound: number;
  importedCount: number;
  skippedCount: number;
  parseWarnings: string[];
  warningGroups: Array<{ songTitle: string; fileName: string; warnings: string[] }>;
  duplicateWarnings: string[];
};

type ImportCandidate = {
  fileName: string;
  text?: string;
  bytes?: ArrayBuffer;
};

type NavigationContext = 'library' | 'setlist';

type SetlistEntry = {
  item: SetlistItem;
  song: Song | undefined;
};

type WrappedAnchoredLine = {
  lyricLine: string;
  anchors: Array<{ chord: string; index: number }>;
  harmonyRanges: HarmonyRange[];
  sourceRanges?: LyricSourceRange[];
  sourceStart: number;
  sourceEnd: number;
};

type SetlistSortMode = 'manual' | 'title' | 'artist' | 'key' | 'bpm' | 'duration';
type StagePopoverName = 'library' | 'setlists' | 'format' | 'more';
type StageFormatTab = 'document' | 'format' | 'chords' | 'harmony' | 'sections' | 'display' | 'autoscroll' | 'external';
type NewSongAction = 'scratch' | 'ai' | 'receive';
type StageSelectionAction = {
  start: number;
  end: number;
  selectedText: string;
  songId: string;
  rect: { left: number; top: number; width: number; height: number };
  hasHarmony: boolean;
  pendingOperation?: StageHarmonyEditOperation;
};

type ToastState = {
  message: string;
  type: 'success' | 'error' | 'info';
  actionLabel?: string;
  onAction?: () => void;
} | null;

type CloudBackupPhase = 'idle' | 'songs' | 'setlists' | 'complete' | 'failed';

type CloudBackupFailure =
  | { type: 'song'; id: string; title: string; item: Song }
  | { type: 'setlist'; id: string; title: string; item: SavedSetlist };

type CloudBackupProgress = {
  phase: CloudBackupPhase;
  songDone: number;
  songTotal: number;
  setlistDone: number;
  setlistTotal: number;
  failed: CloudBackupFailure[];
  startedAt?: number;
  completedSeconds?: number;
};

type CloudRestoreResult = {
  songCount: number;
  setlistCount: number;
};

type ReceiverScrollMetrics = {
  scrollHeight: number;
  clientHeight: number;
  scrollTop: number;
  progress: number;
};

const receiverDisplayModeOptions: Array<{ value: ReceiverDisplayMode; label: string }> = [
  { value: 'landscape-lyrics', label: 'Landscape Lyrics' },
  { value: 'fit-portrait', label: 'Portrait Fit' },
  { value: 'fill-portrait-crop-safe', label: 'Portrait Fill' },
  { value: 'rotate-90-cw', label: 'Rotate 90° CW' },
  { value: 'rotate-90-ccw', label: 'Rotate 90° CCW' }
];

const defaultReceiverDisplaySettings: ReceiverDisplaySettings = {
  displayMode: 'landscape-lyrics',
  blackBackground: true,
  fontScale: 1,
  showTestPattern: false,
  showDiagnostics: false,
  safeMargin: 4
};

type AutoscrollDebugInfo = {
  targetType: string;
  isRunning: boolean;
  activeRafId: number | null;
  scrollTopBefore: number;
  scrollTopAfter: number;
  currentScrollTop: number;
  previousScrollTop: number;
  scrollHeight: number;
  clientHeight: number;
  viewportHeight: number;
  maxScroll: number;
  durationSeconds?: number;
  pixelsPerSecond: number;
  speedSource: string;
  selectedDurationSeconds?: number;
  basePixelsPerSecond: number;
  scrollSpeedMultiplier: number;
  portraitSpeedFactor: number;
  finalPixelsPerSecond: number;
  elapsedSeconds: number;
  bpm?: number;
  estimatedBeats?: number;
  estimatedDurationSeconds?: number;
  readingPaceMultiplier: number;
  displayMode: string;
  deviceProfile: DeviceProfile;
  orientation: 'portrait' | 'landscape';
  durationSource: string;
  frameStatus: string;
  frameCount: number;
  lastFrameAgeMs: number;
  lastScrollChangeAgeMs: number;
  stopReason: AutoscrollStopReason;
};

type AutoscrollStopReason =
  | 'none'
  | 'reached-end'
  | 'user-paused'
  | 'invalid-duration'
  | 'no-scroll-target'
  | 'no-overflow'
  | 'route-change'
  | 'raf-stalled'
  | 'scroll-not-changing'
  | 'target-changed'
  | 'stale-loop-cancelled';

const mobileModeOptions: Array<{ mode: StageMode; label: string; icon: React.ReactNode }> = [
  { mode: 'library', label: 'Library', icon: <Library size={19} /> },
  { mode: 'import', label: 'Import', icon: <Upload size={19} /> },
  { mode: 'setlist', label: 'Setlist', icon: <ListMusic size={19} /> },
  { mode: 'perform', label: 'Perform', icon: <Mic2 size={19} /> },
  { mode: 'stage', label: 'Stage', icon: <Monitor size={19} /> },
  { mode: 'displays', label: 'Displays', icon: <Monitor size={19} /> },
  { mode: 'pedals', label: 'Pedals', icon: <Settings size={19} /> },
  { mode: 'settings', label: 'Settings', icon: <Settings size={19} /> },
  { mode: 'diagnostics', label: 'Diagnostics', icon: <Gauge size={19} /> },
  { mode: 'help', label: 'Help', icon: <HelpCircle size={19} /> }
];

function modeLabel(mode: StageMode) {
  return mobileModeOptions.find((item) => item.mode === mode)?.label ?? 'Editor';
}

type AutoscrollController = {
  active: boolean;
  loopId: number;
  rafId: number | null;
  target: AutoscrollTarget | null;
  virtualScrollTop: number;
  previousScrollTop: number;
  pixelsPerSecond: number;
  basePixelsPerSecond: number;
  scrollSpeedMultiplier: number;
  portraitSpeedFactor: number;
  finalPixelsPerSecond: number;
  durationSeconds?: number;
  selectedDurationSeconds?: number;
  estimatedBeats?: number;
  estimatedDurationSeconds?: number;
  readingPaceMultiplier: number;
  durationSource: 'manual-duration' | 'bpm-estimate' | 'manual-speed';
  displayMode: string;
  maxScroll: number;
  lastFrameTimestamp: number | null;
  lastFrameAtMs: number | null;
  lastScrollChangeAtMs: number | null;
  lastLayoutCheckAtMs: number | null;
  frameCount: number;
};

type AutoscrollSpeedPlan = {
  pixelsPerSecond: number;
  basePixelsPerSecond: number;
  scrollSpeedMultiplier: number;
  portraitSpeedFactor: number;
  finalPixelsPerSecond: number;
  durationSeconds?: number;
  selectedDurationSeconds?: number;
  estimatedBeats?: number;
  estimatedDurationSeconds?: number;
  readingPaceMultiplier: number;
  durationSource: 'manual-duration' | 'bpm-estimate' | 'manual-speed';
  displayMode: string;
};

const speedPresets: Record<Exclude<AutoscrollPreset, 'custom'>, number> = {
  slow: 0.5,
  medium: 1,
  fast: 2
};

const autoscrollManualBasePixelsPerSecond = 20;
const autoscrollMinimumBasePixelsPerSecond = 12;
const autoscrollMinimumFinalPixelsPerSecond = 12;
const autoscrollMaximumFinalPixelsPerSecond = 180;
const autoscrollPortraitSpeedFactor = 1.25;

const iphoneAutoProfileStorageKey = 'openstage-iphone-profile-auto-applied';

type DisplayProfileSizing = {
  lyricFontSize: number;
  chordFontSize: number;
  titleFontSize: number;
  artistFontSize: number;
  sectionFontSize: number;
  headerFontSize: number;
  lineSpacing: number;
  sectionSpacingBefore: number;
  sectionSpacingAfter: number;
};

const displayProfileOptions: Array<{ value: DeviceProfile; label: string }> = [
  { value: 'desktop', label: 'Desktop' },
  { value: 'ipad-portrait', label: 'iPad Portrait' },
  { value: 'ipad-landscape', label: 'iPad Landscape' },
  { value: 'iphone', label: 'iPhone' },
  { value: 'prompter-display', label: 'Prompter Display' }
];

const displayProfileDefaults: Record<DeviceProfile, DisplayProfileSizing> = {
  desktop: {
    lyricFontSize: 34,
    chordFontSize: 18,
    titleFontSize: 52,
    artistFontSize: 30,
    sectionFontSize: 36,
    headerFontSize: 16,
    lineSpacing: 1,
    sectionSpacingBefore: 28,
    sectionSpacingAfter: 8
  },
  'ipad-portrait': {
    lyricFontSize: 32,
    chordFontSize: 17,
    titleFontSize: 44,
    artistFontSize: 26,
    sectionFontSize: 32,
    headerFontSize: 15,
    lineSpacing: 1,
    sectionSpacingBefore: 24,
    sectionSpacingAfter: 8
  },
  'ipad-landscape': {
    lyricFontSize: 34,
    chordFontSize: 18,
    titleFontSize: 48,
    artistFontSize: 28,
    sectionFontSize: 34,
    headerFontSize: 16,
    lineSpacing: 1,
    sectionSpacingBefore: 26,
    sectionSpacingAfter: 8
  },
  iphone: {
    lyricFontSize: 16,
    chordFontSize: 14,
    titleFontSize: 24,
    artistFontSize: 18,
    sectionFontSize: 18,
    headerFontSize: 12,
    lineSpacing: 1,
    sectionSpacingBefore: 16,
    sectionSpacingAfter: 5
  },
  'prompter-display': {
    lyricFontSize: 38,
    chordFontSize: 22,
    titleFontSize: 58,
    artistFontSize: 34,
    sectionFontSize: 40,
    headerFontSize: 18,
    lineSpacing: 1.1,
    sectionSpacingBefore: 32,
    sectionSpacingAfter: 10
  },
  'stage-device': {
    lyricFontSize: 34,
    chordFontSize: 18,
    titleFontSize: 52,
    artistFontSize: 30,
    sectionFontSize: 36,
    headerFontSize: 16,
    lineSpacing: 1,
    sectionSpacingBefore: 28,
    sectionSpacingAfter: 8
  },
  tablet: {
    lyricFontSize: 34,
    chordFontSize: 18,
    titleFontSize: 52,
    artistFontSize: 30,
    sectionFontSize: 36,
    headerFontSize: 16,
    lineSpacing: 1,
    sectionSpacingBefore: 28,
    sectionSpacingAfter: 8
  },
  'portrait-prompter': {
    lyricFontSize: 34,
    chordFontSize: 18,
    titleFontSize: 52,
    artistFontSize: 30,
    sectionFontSize: 36,
    headerFontSize: 16,
    lineSpacing: 1,
    sectionSpacingBefore: 28,
    sectionSpacingAfter: 8
  }
};

const emptySong = (): Song => ({
  id: createId('song'),
  songUuid: createSongUuid(),
  version: 1,
  title: 'New Song',
  artist: '',
  key: 'C',
  capo: 0,
  bpm: 96,
  timeSignature: '4/4',
  tags: [],
  genre: '',
  vibe: '',
  crowdScore: undefined,
  danceability: undefined,
  energy: undefined,
  vocalRange: '',
  vocalDifficulty: '',
  openerCandidate: false,
  closerCandidate: false,
  difficulty: '',
  tuning: 'Standard',
  originalKey: 'C',
  performanceKey: 'C',
  durationSeconds: undefined,
  year: undefined,
  bandNotes: '',
  rehearsalNotes: [],
  notes: '',
  referenceAudioUrl: '',
  chart: '[C]Start writing your [F]chart here\n[Am]Use inline chords like [G]this',
  favorite: false,
  displayPreference: 'inline',
  rawChordPro: '[C]Start writing your [F]chart here\n[Am]Use inline chords like [G]this',
  parsedChordPro: undefined,
  updatedAt: new Date().toISOString()
});

const openStageApiBaseUrl = 'https://openstage-api.onrender.com';

type AiImportedSong = {
  songUuid?: string;
  version?: number | null;
  title?: string;
  artist?: string;
  key?: string;
  capo?: number | null;
  bpm?: number | null;
  chart?: string;
};

type PublishedSongResult = {
  title: string;
  artist: string;
  shareId: string;
  shareUrl: string;
};

type SharedSongImportState =
  | { status: 'loading'; song: null; error: '' }
  | { status: 'ready'; song: Song; error: '' }
  | { status: 'error'; song: null; error: string };

type SongVersionComparison = 'incoming-newer' | 'same-version' | 'local-newer';

function buildPublishSongPayload(song: Song) {
  return {
    songUuid: song.songUuid || createSongUuid(),
    version: normalizeSongVersion(song.version),
    title: song.title,
    subtitle: song.subtitle,
    artist: song.artist,
    album: song.album,
    key: song.key,
    capo: song.capo,
    bpm: song.bpm,
    timeSignature: song.timeSignature,
    tags: song.tags,
    notes: song.notes,
    bandNotes: song.bandNotes,
    rehearsalNotes: song.rehearsalNotes,
    referenceAudioUrl: song.referenceAudioUrl,
    lastSharedAt: song.lastSharedAt,
    favorite: song.favorite,
    chart: song.chart,
    rawChordPro: song.rawChordPro,
    displayPreference: song.displayPreference,
    genre: song.genre,
    difficulty: song.difficulty,
    tuning: song.tuning,
    originalKey: song.originalKey,
    performanceKey: song.performanceKey,
    durationSeconds: song.durationSeconds,
    year: song.year,
    vocalRange: song.vocalRange,
    vocalDifficulty: song.vocalDifficulty,
    crowdScore: song.crowdScore,
    energy: song.energy,
    danceability: song.danceability
  };
}

async function publishSongToOpenStageApi(song: Song) {
  const response = await fetch(`${openStageApiBaseUrl}/api/share-song`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      song: buildPublishSongPayload(song)
    })
  });
  const body = await response.json().catch(() => null);

  if (!response.ok || !body?.ok || typeof body.shareUrl !== 'string') {
    throw new Error(body?.error || 'Could not share song.');
  }

  return {
    shareId: String(body.shareId || ''),
    shareUrl: body.shareUrl
  };
}

async function backupSongToOpenStageApi(song: Song, userId: string) {
  const response = await fetch(`${openStageApiBaseUrl}/api/sync/song`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      userId,
      song
    })
  });
  const body = await response.json().catch(() => null);

  if (!response.ok || !body?.ok) {
    throw new Error(body?.error || `Song backup failed with HTTP ${response.status}`);
  }

  return body;
}

async function backupSetlistToOpenStageApi(setlist: SavedSetlist, userId: string) {
  const setlistPayload = {
    ...setlist,
    setlistUuid: (setlist as SavedSetlist & { setlistUuid?: string }).setlistUuid || setlist.id
  };
  const response = await fetch(`${openStageApiBaseUrl}/api/sync/setlist`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      userId,
      setlist: setlistPayload
    })
  });
  const body = await response.json().catch(() => null);

  if (!response.ok || !body?.ok) {
    throw new Error(body?.error || `Setlist backup failed with HTTP ${response.status}`);
  }

  return body;
}

function getSharedImportIdFromPath() {
  if (typeof window === 'undefined') return '';
  const match = window.location.pathname.match(/^\/import-song\/([^/?#]+)/);
  return match ? decodeURIComponent(match[1]) : '';
}

function getPendingImportShareIdFromSearch() {
  if (typeof window === 'undefined') return '';
  return new URLSearchParams(window.location.search).get('pendingImportShareId')?.trim() ?? '';
}

function isIosBrowserContext() {
  if (typeof navigator === 'undefined') return false;
  const userAgent = navigator.userAgent || '';
  const platform = navigator.platform || '';
  const maxTouchPoints = navigator.maxTouchPoints || 0;
  return /iPad|iPhone|iPod/.test(userAgent) || (platform === 'MacIntel' && maxTouchPoints > 1);
}

function isStandalonePwaContext() {
  if (typeof window === 'undefined') return false;
  const navigatorWithStandalone = navigator as Navigator & { standalone?: boolean };
  return Boolean(navigatorWithStandalone.standalone || window.matchMedia?.('(display-mode: standalone)').matches);
}

function songFromSharedSong(shared: Partial<Song>, shareId: string): Song {
  const chart = typeof shared.chart === 'string' ? shared.chart : '';
  const key = typeof shared.key === 'string' ? shared.key : '';
  const capo = Math.max(0, Math.round(Number(shared.capo ?? 0) || 0));
  const bpm = Number.isFinite(Number(shared.bpm)) && Number(shared.bpm) > 0 ? Math.round(Number(shared.bpm)) : 0;
  const importedAt = new Date().toISOString();

  return {
    ...emptySong(),
    ...shared,
    id: createId('song'),
    songUuid: typeof shared.songUuid === 'string' && shared.songUuid.trim() ? shared.songUuid.trim() : createSongUuid(),
    version: normalizeSongVersion(shared.version),
    title: typeof shared.title === 'string' && shared.title.trim() ? shared.title.trim() : 'Shared Song',
    artist: typeof shared.artist === 'string' ? shared.artist.trim() : '',
    key,
    capo,
    bpm,
    tags: Array.isArray(shared.tags) ? shared.tags : [],
    notes: typeof shared.notes === 'string' ? shared.notes : '',
    referenceAudioUrl: typeof shared.referenceAudioUrl === 'string' ? shared.referenceAudioUrl.trim() : '',
    favorite: Boolean(shared.favorite),
    chart,
    rawChordPro: typeof shared.rawChordPro === 'string' ? shared.rawChordPro : chart,
    parsedChordPro: parseChordPro(chart),
    importedFromShareId: shareId,
    sourceShareId: shareId,
    importedAt,
    sharedSource: 'OpenStage Share',
    updatedAt: new Date().toISOString()
  };
}

async function fetchSharedSong(shareId: string) {
  const response = await fetch(`${openStageApiBaseUrl}/api/shared-song/${encodeURIComponent(shareId)}`);
  const body = await response.json().catch(() => null);

  if (!response.ok || !body?.ok || !body.song) {
    throw new Error(body?.error || 'Shared song not found or expired.');
  }

  return songFromSharedSong(body.song, shareId);
}

function songFromAiImport(imported: AiImportedSong): Song {
  const title = imported.title?.trim() || 'AI Imported Song';
  const artist = imported.artist?.trim() || 'Unknown artist';
  const key = imported.key?.trim() || '';
  const capo = Math.max(0, Math.round(Number(imported.capo ?? 0) || 0));
  const bpm = Number.isFinite(Number(imported.bpm)) && Number(imported.bpm) > 0 ? Math.round(Number(imported.bpm)) : 0;
  const chart = imported.chart || '';

  return {
    ...emptySong(),
    songUuid: imported.songUuid?.trim() || createSongUuid(),
    version: normalizeSongVersion(imported.version),
    title,
    artist,
    key,
    originalKey: key,
    performanceKey: key,
    capo,
    bpm,
    chart,
    rawChordPro: chart,
    displayPreference: 'chords-over',
    parsedChordPro: parseChordPro(chart),
    updatedAt: new Date().toISOString()
  };
}

function withSongDefaults(song: Song): Song {
  return {
    ...song,
    songUuid: song.songUuid?.trim() || createSongUuid(),
    version: normalizeSongVersion(song.version),
    favorite: Boolean(song.favorite),
    referenceAudioUrl: song.referenceAudioUrl || ''
  };
}

type RestoreSongCandidate = {
  song: Song;
  sourceIndex: number;
  sourceUpdatedAt: string;
};

function normalizeCloudRestoreSong(item: { song?: unknown; revision?: unknown; updatedAt?: unknown }, index: number): RestoreSongCandidate {
  const raw = item?.song;
  if (!raw || typeof raw !== 'object') {
    const details = {
      songUuid: '',
      title: '',
      artist: '',
      error: 'Cloud song row does not contain a song object.',
      validationReason: 'missing-song-object',
      sourceIndex: index + 1
    };
    console.error('RESTORE_SONG_INSERT_FAILED', details);
    throw new Error(`Cloud song ${index + 1} is invalid.`);
  }

  const rawSong = raw as Partial<Song> & { body?: unknown; content?: unknown; revision?: unknown };
  const chart = typeof rawSong.chart === 'string'
    ? rawSong.chart
    : typeof rawSong.rawChordPro === 'string'
      ? rawSong.rawChordPro
      : typeof rawSong.content === 'string'
        ? rawSong.content
        : typeof rawSong.body === 'string'
          ? rawSong.body
          : '';
  const title = typeof rawSong.title === 'string' && rawSong.title.trim() ? rawSong.title.trim() : 'Untitled Song';
  const artist = typeof rawSong.artist === 'string' ? rawSong.artist.trim() : '';
  const songUuid = typeof rawSong.songUuid === 'string' && rawSong.songUuid.trim() ? rawSong.songUuid.trim() : createSongUuid();
  const id = typeof rawSong.id === 'string' && rawSong.id.trim() ? rawSong.id.trim() : songUuid || createId('restore-song');
  const version = normalizeSongVersion(rawSong.version ?? rawSong.revision ?? item.revision);

  const song: Song = {
    ...emptySong(),
    ...rawSong,
    id,
    songUuid,
    version,
    title,
    artist,
    key: typeof rawSong.key === 'string' ? rawSong.key : '',
    capo: Number.isFinite(Number(rawSong.capo)) ? Math.max(0, Math.round(Number(rawSong.capo))) : 0,
    bpm: Number.isFinite(Number(rawSong.bpm)) ? Math.max(0, Math.round(Number(rawSong.bpm))) : 0,
    timeSignature: typeof rawSong.timeSignature === 'string' && rawSong.timeSignature.trim() ? rawSong.timeSignature : '4/4',
    tags: Array.isArray(rawSong.tags) ? rawSong.tags : [],
    notes: typeof rawSong.notes === 'string' ? rawSong.notes : '',
    chart,
    favorite: Boolean(rawSong.favorite),
    referenceAudioUrl: typeof rawSong.referenceAudioUrl === 'string' ? rawSong.referenceAudioUrl : '',
    rawChordPro: typeof rawSong.rawChordPro === 'string' ? rawSong.rawChordPro : chart,
    parsedChordPro: rawSong.parsedChordPro ?? parseChordPro(chart),
    updatedAt: typeof rawSong.updatedAt === 'string' && rawSong.updatedAt ? rawSong.updatedAt : typeof item.updatedAt === 'string' ? item.updatedAt : new Date().toISOString()
  };

  return {
    song,
    sourceIndex: index,
    sourceUpdatedAt: typeof item.updatedAt === 'string' ? item.updatedAt : song.updatedAt
  };
}

function isNewerRestoreCandidate(next: RestoreSongCandidate, current: RestoreSongCandidate) {
  const nextVersion = normalizeSongVersion(next.song.version);
  const currentVersion = normalizeSongVersion(current.song.version);
  if (nextVersion !== currentVersion) return nextVersion > currentVersion;
  return Date.parse(next.sourceUpdatedAt || next.song.updatedAt || '') > Date.parse(current.sourceUpdatedAt || current.song.updatedAt || '');
}

function makeUniqueRestoreSongIds(candidates: RestoreSongCandidate[]) {
  const usedIds = new Set<string>();

  return candidates.map((candidate) => {
    const originalId = candidate.song.id;
    if (originalId && !usedIds.has(originalId)) {
      usedIds.add(originalId);
      return candidate.song;
    }

    let nextId = candidate.song.songUuid && !usedIds.has(candidate.song.songUuid)
      ? candidate.song.songUuid
      : createId('restore-song');
    while (usedIds.has(nextId)) {
      nextId = createId('restore-song');
    }
    usedIds.add(nextId);

    console.warn('RESTORE_DUPLICATE_SONG_ID', {
      originalId,
      reassignedId: nextId,
      songUuid: candidate.song.songUuid,
      title: candidate.song.title,
      artist: candidate.song.artist,
      revision: normalizeSongVersion(candidate.song.version),
      updatedAt: candidate.sourceUpdatedAt
    });

    return {
      ...candidate.song,
      id: nextId
    };
  });
}

export default function App() {
  if (isExternalPrompterRoute()) return <ExternalPrompterApp />;
  if (isReceiverRoute()) return <RemoteReceiverApp />;
  if (isDisplayRoute()) return <RemoteDisplayApp />;

  const cloud = useCloud();
  const sharedImportId = getSharedImportIdFromPath();
  const pendingImportShareId = getPendingImportShareIdFromSearch();
  const [songs, setSongs] = useState<Song[]>([]);
  const [setlist, setSetlist] = useState<SetlistItem[]>([]);
  const [savedSetlists, setSavedSetlists] = useState<SavedSetlist[]>([]);
  const [editingSetlistId, setEditingSetlistId] = useState<string | null>(null);
  const [activeSetlistId, setActiveSetlistId] = useState<string | null>(null);
  const [setlistName, setSetlistName] = useState('New Setlist');
  const [setlistNotes, setSetlistNotes] = useState('');
  const [setlistDirty, setSetlistDirty] = useState(false);
  const [allowSetlistDuplicates, setAllowSetlistDuplicates] = useState(false);
  const [selectedSongId, setSelectedSongId] = useState('');
  const [activeMode, setActiveMode] = useState<StageMode>('library');
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const [sharedImportLandingBypassed, setSharedImportLandingBypassed] = useState(false);
  const [newSongMenuOpen, setNewSongMenuOpen] = useState(false);
  const [aiImportOpen, setAiImportOpen] = useState(false);
  const [receiveSongOpen, setReceiveSongOpen] = useState(false);
  const [editorHasUnsavedChanges, setEditorHasUnsavedChanges] = useState(false);
  const [query, setQuery] = useState('');
  const [smartFilter, setSmartFilter] = useState('all');
  const [quickEdit, setQuickEdit] = useState(false);
  const [countdownRemaining, setCountdownRemaining] = useState(0);
  const [navigationContext, setNavigationContext] = useState<NavigationContext>('library');
  const [editorReturnMode, setEditorReturnMode] = useState<StageMode>('library');
  const [toast, setToast] = useState<ToastState>(null);
  const [cloudBackupProgress, setCloudBackupProgress] = useState<CloudBackupProgress>({
    phase: 'idle',
    songDone: 0,
    songTotal: 0,
    setlistDone: 0,
    setlistTotal: 0,
    failed: []
  });
  const pwaUpdate = usePwaUpdateSnapshot();
  const [storageError, setStorageError] = useState('');
  const [isTransitioningSong, setIsTransitioningSong] = useState(false);
  const [autoscrollDebug, setAutoscrollDebug] = useState<AutoscrollDebugInfo>({
    targetType: 'none',
    isRunning: false,
    activeRafId: null,
    scrollTopBefore: 0,
    scrollTopAfter: 0,
    currentScrollTop: 0,
    previousScrollTop: 0,
    scrollHeight: 0,
    clientHeight: 0,
    viewportHeight: 0,
    maxScroll: 0,
    durationSeconds: undefined,
    pixelsPerSecond: 0,
    speedSource: 'manual-speed',
    selectedDurationSeconds: undefined,
    basePixelsPerSecond: 0,
    scrollSpeedMultiplier: 1,
    portraitSpeedFactor: 1,
    finalPixelsPerSecond: 0,
    elapsedSeconds: 0,
    bpm: undefined,
    estimatedBeats: undefined,
    estimatedDurationSeconds: undefined,
    readingPaceMultiplier: 1,
    displayMode: 'landscape',
    deviceProfile: 'desktop',
    orientation: 'landscape',
    durationSource: 'manual-speed',
    frameStatus: 'idle',
    frameCount: 0,
    lastFrameAgeMs: 0,
    lastScrollChangeAgeMs: 0,
    stopReason: 'none'
  });
  const performanceState = useAppStore((state) => state.performance);
  const performanceStateRef = useRef(performanceState);
  const updateStorePerformance = useAppStore((state) => state.updatePerformance);
  const appLogs = useAppStore((state) => state.logs);
  const clearLogs = useAppStore((state) => state.clearLogs);
  const diagnostics = useAppStore((state) => state.diagnostics);
  const updateDiagnostics = useAppStore((state) => state.updateDiagnostics);
  const syncStatus = useAppStore((state) => state.syncStatus);
  const setStoreSyncStatus = useAppStore((state) => state.setSyncStatus);
  const conflicts = useAppStore((state) => state.conflicts);
  const setConflicts = useAppStore((state) => state.setConflicts);
  const [isAutoscrolling, setIsAutoscrolling] = useState(false);
  const [syncState, setSyncState] = useState<SyncState>(supabase ? 'idle' : 'disabled');
  const [syncEmail, setSyncEmail] = useState<string | null>(null);
  const stageRef = useRef<HTMLDivElement>(null);
  const autoscrollControllerRef = useRef<AutoscrollController>({
    active: false,
    loopId: 0,
    rafId: null,
    target: null,
    virtualScrollTop: 0,
    previousScrollTop: 0,
    pixelsPerSecond: 0,
    basePixelsPerSecond: 0,
    scrollSpeedMultiplier: 1,
    portraitSpeedFactor: 1,
    finalPixelsPerSecond: 0,
    durationSeconds: undefined,
    selectedDurationSeconds: undefined,
    estimatedBeats: undefined,
    estimatedDurationSeconds: undefined,
    readingPaceMultiplier: 1,
    durationSource: 'manual-speed',
    displayMode: 'landscape',
    maxScroll: 0,
    lastFrameTimestamp: null,
    lastFrameAtMs: null,
    lastScrollChangeAtMs: null,
    lastLayoutCheckAtMs: null,
    frameCount: 0
  });
  const scrollSpeedMultiplierRef = useRef(1);
  const basePixelsPerSecondRef = useRef(0);
  const finalPixelsPerSecondRef = useRef(0);
  const scrollSaveFrameRef = useRef<number | null>(null);
  const scrollSaveTimeoutRef = useRef<number | null>(null);
  const receiverPublishTimeoutRef = useRef<number | null>(null);
  const lastReceiverAutoscrollPublishRef = useRef(0);
  const pendingScrollPositionRef = useRef<{ songId: string; scrollTop: number } | null>(null);
  const restoredScrollSongRef = useRef('');
  const isUserScrollingRef = useRef(false);
  const lastUserScrollTopRef = useRef(0);
  const autoscrollStartScrollTopRef = useRef(0);
  const autoscrollStartTimeRef = useRef(0);
  const lastProgrammaticScrollTopRef = useRef<number | null>(null);
  const userScrollResumeTimerRef = useRef<number | null>(null);

  const songMap = useMemo(() => new Map(songs.map((song) => [song.id, song])), [songs]);
  const selectedSong = songMap.get(selectedSongId) ?? songs[0];
  const orderedSetlist = useMemo(
    () =>
      [...setlist]
        .sort((a, b) => a.order - b.order)
        .map((item) => ({ item, song: songs.find((song) => song.id === item.songId) }))
        .filter((entry): entry is SetlistEntry => Boolean(entry.song)),
    [setlist, songs]
  );
  const activeSavedSetlist = activeSetlistId ? savedSetlists.find((saved) => saved.id === activeSetlistId) : undefined;
  const activeSetlistEntries = useMemo(
    () => (activeSavedSetlist ? buildSetlistEntries(activeSavedSetlist.songIds, songs) : orderedSetlist),
    [activeSavedSetlist, orderedSetlist, songs]
  );

  const filteredSongs = songs.filter((song) => {
    const haystack = [
      song.title,
      song.artist,
      song.key,
      song.performanceKey,
      song.originalKey,
      song.genre,
      song.vibe,
      song.vocalRange,
      song.vocalDifficulty,
      song.difficulty,
      song.tuning,
      song.crowdScore,
      song.danceability,
      song.energy,
      song.tags.join(' '),
      song.chart,
      song.notes,
      song.bandNotes
    ]
      .join(' ')
      .toLowerCase();
    return haystack.includes(query.toLowerCase()) && matchesSmartFilter(song, smartFilter);
  });

  const totalSetDuration = orderedSetlist.reduce((total, entry) => total + (entry.song?.durationSeconds ?? 0), 0);

  const currentSetlistIndex = activeSetlistEntries.findIndex(({ song }) => song?.id === selectedSong?.id);
  const currentLibraryIndex = selectedSong ? songs.findIndex((song) => song.id === selectedSong.id) : -1;
  const activeNavigationContext: NavigationContext = navigationContext === 'setlist' && currentSetlistIndex >= 0 ? 'setlist' : 'library';
  const activeNavigationSongs = activeNavigationContext === 'setlist' ? activeSetlistEntries.map((entry) => entry.song).filter((song): song is Song => Boolean(song)) : songs;
  const activeNavigationIndex = activeNavigationContext === 'setlist' ? currentSetlistIndex : currentLibraryIndex;
  const nextNavigationSong = activeNavigationIndex >= 0 ? activeNavigationSongs[activeNavigationIndex + 1] : undefined;
  const previousNavigationSong = activeNavigationIndex >= 0 ? activeNavigationSongs[activeNavigationIndex - 1] : undefined;
  const activeStageSetlistName = activeSetlistId
    ? activeSavedSetlist?.name ?? 'Setlist'
    : navigationContext === 'setlist'
      ? setlistName
      : '';
  const isStageSurface = activeMode === 'perform' || activeMode === 'stage';
  const isCloudBackupRunning = cloudBackupProgress.phase === 'songs' || cloudBackupProgress.phase === 'setlists';
  const isPwaUpdateBusy = isCloudBackupRunning || activeMode === 'settings' || activeMode === 'import' || aiImportOpen || receiveSongOpen || Boolean(pendingImportShareId || sharedImportId) || (activeMode === 'editor' && editorHasUnsavedChanges);
  const shouldShowPwaUpdateBanner = pwaUpdate.updateWaiting && !pwaUpdate.dismissed && !pwaUpdate.applying && !isPwaUpdateBusy;
  const selectedEffectiveCapo = selectedSong ? getEffectiveCapo(selectedSong, performanceState) : 0;
  const receiverSettings = normalizeReceiverDisplaySettings(performanceState.receiverDisplay);

  useEffect(() => {
    void checkForPwaUpdate();
  }, []);

  useEffect(() => {
    clearRenderCache();
  }, [selectedSong?.id]);

  const setTopLevelMode = useCallback((mode: StageMode) => {
    if ((mode === 'perform' || mode === 'stage') && !selectedSongId && songs[0]) {
      setSelectedSongId(songs[0].id);
      setNavigationContext('library');
    }
    setActiveMode(mode);
    setMobileNavOpen(false);
  }, [selectedSongId, songs]);

  useEffect(() => {
    performanceStateRef.current = performanceState;
    updateLiveAutoscrollSpeedMultiplier(performanceState.autoscrollSpeed);
  }, [performanceState]);

  useEffect(() => {
    void ensureSeedData()
      .then(loadData)
      .catch((error) => {
        const message = error instanceof Error ? error.message : String(error);
        markStartupError(error);
        setStorageError(message);
        reportError('Storage startup failed', error);
      });
  }, []);

  useEffect(() => {
    if (!isIPhoneViewport()) return;
    if (performanceState.activeProfile !== 'desktop') return;
    try {
      if (window.localStorage.getItem(iphoneAutoProfileStorageKey)) return;
      window.localStorage.setItem(iphoneAutoProfileStorageKey, 'true');
    } catch {
      // Continue without persistence if Safari private mode blocks localStorage.
    }
    updateStorePerformance(applyDisplayProfilePatch(performanceState, 'iphone'));
  }, [performanceState.activeProfile, updateStorePerformance]);

  useEffect(() => {
    if (isStageSurface && !performanceState.recoverToStageMode) {
      updateStorePerformance({ recoverToStageMode: true });
    }
  }, [isStageSurface, performanceState.recoverToStageMode, updateStorePerformance]);

  useEffect(() => {
    if (!supabase) return;

    void supabase.auth.getSession().then(({ data }) => {
      setSyncEmail(data.session?.user.email ?? null);
    });

    const { data } = supabase.auth.onAuthStateChange((_event, session) => {
      setSyncEmail(session?.user.email ?? null);
    });

    return () => data.subscription.unsubscribe();
  }, []);

  useEffect(() => {
    const runBackup = () => {
      void saveLocalCheckpoint(performanceState).catch((error) => reportError('Automatic local backup failed', error));
    };
    const timer = window.setInterval(runBackup, 5 * 60 * 1000);
    runBackup();
    return () => window.clearInterval(timer);
  }, [performanceState]);

  useEffect(() => {
    void pruneExpiredRestorePoint().catch((error) => reportError('Restore point cleanup failed', error));
  }, []);

  useEffect(() => {
    if (songs.length === 0 || selectedSongId) return;
    const recoveredSong = performanceState.lastSongId && songMap.has(performanceState.lastSongId) ? performanceState.lastSongId : songs[0].id;
    setSelectedSongId(recoveredSong);
    if (performanceState.recoverToStageMode) setActiveMode('stage');
  }, [performanceState.lastSongId, performanceState.recoverToStageMode, selectedSongId, songMap, songs]);

  useEffect(() => {
    if (selectedSongId) {
      updateStorePerformance({ lastSongId: selectedSongId });
      if (isAutoscrolling) stopAutoscroll('route-change');
    }
  }, [selectedSongId]);

  useEffect(() => {
    if (!isStageSurface || !selectedSong) return;
    publishRemoteDisplaySong(selectedSong.id);
    scheduleReceiverPublish(80);
  }, [
    isStageSurface,
    selectedSong?.id,
    selectedSong?.title,
    selectedSong?.artist,
    selectedSong?.chart,
    selectedSong?.rawChordPro,
    selectedSong?.displayPreference,
    performanceState.transpose,
    performanceState.fontSize,
    performanceState.fontSizesByProfile,
    performanceState.chordFontSize,
    performanceState.chordFontSizesByProfile,
    performanceState.sectionFontSize,
    performanceState.sectionFontSizesByProfile,
    performanceState.headerFontSize,
    performanceState.headerFontSizesByProfile,
    performanceState.songTitleFontSize,
    performanceState.songTitleFontSizesByProfile,
    performanceState.songArtistFontSize,
    performanceState.songArtistFontSizesByProfile,
    performanceState.lineSpacing,
    performanceState.lineSpacingsByProfile,
    performanceState.showChords,
    performanceState.showChordsByProfile,
    performanceState.showHarmonyCues,
    performanceState.showHarmonyCuesByProfile,
    performanceState.showNashvilleNumbers,
    performanceState.activeProfile,
    performanceState.stageTheme,
    performanceState.theme,
    performanceState.documentTheme,
    performanceState.documentThemesByProfile,
    performanceState.chordFontColor,
    performanceState.chordFontColorsByProfile,
    performanceState.chordHighlightColor,
    performanceState.chordHighlightColorsByProfile,
    performanceState.sectionFontColor,
    performanceState.sectionFontColorsByProfile,
    performanceState.sectionBold,
    performanceState.sectionBoldByProfile,
    performanceState.sectionItalic,
    performanceState.sectionItalicByProfile,
    performanceState.sectionUppercase,
    performanceState.sectionUppercaseByProfile,
    performanceState.harmonyTextColor,
    performanceState.harmonyTextColorsByProfile,
    performanceState.harmonyIconColor,
    performanceState.harmonyIconColorsByProfile,
    performanceState.receiverDisplay,
    isAutoscrolling
  ]);

  useEffect(() => {
    if (!isStageSurface || !selectedSong || !performanceState.castReceiverEnabled) return;
    const updatedAt = new Date().toISOString();
    const published = publishCastState(castStateFromSong(selectedSong, updatedAt));
    if (published) updateStorePerformance({ castReceiverLastSync: updatedAt });
  }, [
    isStageSurface,
    performanceState.castReceiverEnabled,
    selectedSong?.id,
    selectedSong?.title,
    selectedSong?.artist,
    selectedSong?.subtitle,
    selectedSong?.chart,
    selectedSong?.rawChordPro,
    updateStorePerformance
  ]);

  useEffect(() => {
    const element = stageRef.current;
    if (!element || !selectedSong?.id) return;
    if (restoredScrollSongRef.current === selectedSong.id) return;
    restoredScrollSongRef.current = selectedSong.id;
    element.scrollTop = performanceState.scrollPositions[selectedSong.id] ?? 0;
  }, [performanceState.scrollPositions, selectedSong?.id]);

  useEffect(() => {
    if (!selectedSong) return;
    const adjacent = [previousNavigationSong, selectedSong, nextNavigationSong].filter((song): song is Song => Boolean(song));
    const parseMs = preloadSongs(adjacent, {
      transpose: performanceState.transpose,
      capo: selectedEffectiveCapo,
      showNashvilleNumbers: performanceState.showNashvilleNumbers,
      songKey: selectedSong.performanceKey || selectedSong.key,
      activeProfile: performanceState.activeProfile,
      lyricFontSize: getEffectiveLyricFontSize(performanceState),
      lineSpacing: getEffectiveLineSpacing(performanceState),
      chordFontSize: getEffectiveChordFontSize(performanceState),
      headerFontSize: getEffectiveHeaderFontSize(performanceState),
      songTitleFontSize: getEffectiveSongTitleFontSize(performanceState),
      songArtistFontSize: getEffectiveSongArtistFontSize(performanceState),
      sectionFontSize: getEffectiveSectionFontSize(performanceState),
      sectionSpacingBefore: getEffectiveSectionSpacingBefore(performanceState),
      sectionSpacingAfter: getEffectiveSectionSpacingAfter(performanceState),
      viewportWidth: window.innerWidth,
      displayMode: getDisplayModeLabel(performanceState)
    });
    updateDiagnostics({ lastParseMs: Number(parseMs.toFixed(2)), renderCacheSize: getRenderCacheSize() });
  }, [
    nextNavigationSong,
    performanceState.activeProfile,
    performanceState.chordFontSize,
    performanceState.chordFontSizesByProfile,
    performanceState.fontSize,
    performanceState.fontSizesByProfile,
    performanceState.headerFontSize,
    performanceState.headerFontSizesByProfile,
    performanceState.lineSpacing,
    performanceState.lineSpacingsByProfile,
    performanceState.mirroredMode,
    performanceState.portraitMode,
    performanceState.sectionFontSize,
    performanceState.sectionFontSizesByProfile,
    performanceState.sectionSpacingAfter,
    performanceState.sectionSpacingAfterByProfile,
    performanceState.sectionSpacingBefore,
    performanceState.sectionSpacingBeforeByProfile,
    performanceState.showNashvilleNumbers,
    performanceState.songArtistFontSize,
    performanceState.songArtistFontSizesByProfile,
    performanceState.songTitleFontSize,
    performanceState.songTitleFontSizesByProfile,
    performanceState.splitScreen,
    performanceState.transpose,
    previousNavigationSong,
    selectedEffectiveCapo,
    selectedSong,
    updateDiagnostics
  ]);

  useEffect(() => {
    if (!isAutoscrolling) return;
    const heartbeat = window.setInterval(() => {
      const controller = autoscrollControllerRef.current;
      const now = performance.now();
      if (detectAutoscrollHeartbeatStall(controller.active, now, controller.lastFrameAtMs)) {
        stopAutoscroll('raf-stalled', 'Autoscroll stopped unexpectedly');
      } else if (performanceStateRef.current.showAutoscrollDebug) {
        updateAutoscrollDebugFromController('heartbeat');
      }
    }, 250);
    return () => window.clearInterval(heartbeat);
  }, [isAutoscrolling]);

  useEffect(() => {
    return () => {
      clearUserScrollResumeTimer();
    };
  }, []);

  useEffect(() => {
    if (!toast) return;
    const timer = window.setTimeout(() => setToast(null), 2600);
    return () => window.clearTimeout(timer);
  }, [toast]);

  useEffect(() => {
    if (countdownRemaining <= 0) return;
    const timer = window.setInterval(() => {
      setCountdownRemaining((value) => Math.max(0, value - 1));
    }, 1000);
    return () => window.clearInterval(timer);
  }, [countdownRemaining]);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (isPedalTestModeActive()) {
        event.preventDefault();
        event.stopPropagation();
        event.stopImmediatePropagation();
        return;
      }
      const target = event.target as HTMLElement | null;
      if (target?.matches('input, textarea, select')) return;
      const mappings = performanceState.pedalMappings;
      const runMappedAction = (action: PedalAction, callback: () => void) => {
        if (!matchesPedal(event, mappings[action] ?? [])) return false;
        event.preventDefault();
        callback();
        return true;
      };

      if (runMappedAction('toggleAutoscroll', toggleAutoscroll)) return;
      if (runMappedAction('toggleTempoGuide', dispatchTempoGuideToggle)) return;
      if (runMappedAction('scrollFaster', () => updateAutoscrollSpeed(adjustAutoscrollSpeedMultiplier(performanceState.autoscrollSpeed, autoscrollSpeedStep)))) return;
      if (runMappedAction('scrollSlower', () => updateAutoscrollSpeed(adjustAutoscrollSpeedMultiplier(performanceState.autoscrollSpeed, -autoscrollSpeedStep)))) return;
      if (runMappedAction('scrollDown', () => scrollAutoscrollTargetBy(stageRef.current, Math.max(80, performanceState.fontSize * 4)))) return;
      if (runMappedAction('scrollUp', () => scrollAutoscrollTargetBy(stageRef.current, -Math.max(80, performanceState.fontSize * 4)))) return;
      if (runMappedAction('nextSong', () => moveSelectedSong(1))) return;
      if (runMappedAction('previousSong', () => moveSelectedSong(-1))) return;
      if (runMappedAction('toggleChords', () => updatePerformanceState(showChordsUpdate(performanceState, !getEffectiveShowChords(performanceState))))) return;
      if (runMappedAction('toggleHarmonyCues', () => updatePerformanceState(showHarmonyCuesUpdate(performanceState, !getEffectiveShowHarmonyCues(performanceState))))) return;
      if (runMappedAction('increaseFontSize', () => updatePerformanceState(lyricFontSizeUpdate(performanceState, Math.min(76, getEffectiveLyricFontSize(performanceState) + 2))))) return;
      if (runMappedAction('decreaseFontSize', () => updatePerformanceState(lyricFontSizeUpdate(performanceState, Math.max(16, getEffectiveLyricFontSize(performanceState) - 2))))) return;
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [orderedSetlist, performanceState, selectedSongId]);

  async function loadData() {
    const [storedSongs, storedSetlist, storedSavedSetlists] = await Promise.all([
      db.songs.orderBy('title').toArray(),
      db.setlist.orderBy('order').toArray(),
      db.setlists.orderBy('updatedAt').reverse().toArray()
    ]);
    const normalizedSongs = storedSongs.map(withSongDefaults);
    const songsNeedingIdentityMigration = normalizedSongs.filter((song, index) =>
      !storedSongs[index]?.songUuid?.trim() || !isValidSongVersion(storedSongs[index]?.version)
    );
    if (songsNeedingIdentityMigration.length > 0) await db.songs.bulkPut(songsNeedingIdentityMigration);
    setSongs(normalizedSongs);
    setSetlist(storedSetlist);
    if (storedSavedSetlists.length === 0 && storedSetlist.length > 0) {
      const migrated = createSavedSetlistFromItems('Current Setlist', storedSetlist);
      await db.setlists.put(migrated);
      setSavedSetlists([migrated]);
      setEditingSetlistId(migrated.id);
      setSetlistName(migrated.name);
      setSetlistNotes(migrated.notes ?? '');
      return;
    }
    setSavedSetlists(storedSavedSetlists);
    if (!editingSetlistId && storedSavedSetlists.length > 0) {
      setEditingSetlistId(storedSavedSetlists[0].id);
      setSetlistName(storedSavedSetlists[0].name);
      setSetlistNotes(storedSavedSetlists[0].notes ?? '');
      setSetlist(storedSavedSetlists[0].songIds.map((songId, order) => ({ id: `${storedSavedSetlists[0].id}-${order}-${songId}`, songId, order })));
    }
  }

  async function saveSong(song: Song, options: { clearCapoOverride?: boolean } = {}) {
    try {
      const previousCapo = Number(songMap.get(song.id)?.capo ?? 0);
      const previousSong = songMap.get(song.id);
      const nextCapo = Math.max(0, Math.min(12, Number(song.capo ?? 0) || 0));
      const nextSong = {
        ...song,
        songUuid: song.songUuid?.trim() || createSongUuid(),
        favorite: Boolean(song.favorite),
        referenceAudioUrl: song.referenceAudioUrl?.trim() ?? '',
        capo: nextCapo,
        bpm: Number(song.bpm ?? 0) || 0,
        rawChordPro: song.chart,
        parsedChordPro: parseChordPro(song.chart),
        updatedAt: new Date().toISOString()
      };
      nextSong.version = nextSongVersion(previousSong, nextSong);
      clearRenderCache();
      await db.songs.put(nextSong);
      if ((options.clearCapoOverride || nextCapo !== previousCapo) && performanceState.capoOverrides?.[nextSong.id] !== undefined) {
        const capoOverrides = { ...performanceState.capoOverrides };
        delete capoOverrides[nextSong.id];
        updateStorePerformance({ capoOverrides });
      }
      await loadData();
      setSelectedSongId(nextSong.id);
      setToast({ message: 'Song Saved', type: 'success' });
    } catch (error) {
      setToast({ message: 'Save failed', type: 'error' });
      reportError('Song save failed', error);
    }
  }

  async function createSongFromScratch(returnMode: StageMode = activeMode) {
    const song = emptySong();
    setNewSongMenuOpen(false);
    setAiImportOpen(false);
    await saveSong(song);
    setSelectedSongId(song.id);
    setEditorReturnMode(returnMode);
    setActiveMode('editor');
  }

  function openAiImport() {
    setNewSongMenuOpen(false);
    setAiImportOpen(true);
  }

  function openReceiveSong() {
    setNewSongMenuOpen(false);
    setReceiveSongOpen(true);
  }

  function openSharedSongCode(shareId: string) {
    setReceiveSongOpen(false);
    window.history.replaceState({}, '', `/?pendingImportShareId=${encodeURIComponent(shareId.trim())}`);
    window.location.reload();
  }

  async function importAiSong(song: Song) {
    await saveSong(song);
    setSelectedSongId(song.id);
    setEditorReturnMode(activeMode);
    setActiveMode('editor');
    setAiImportOpen(false);
    setToast({ message: 'AI song imported', type: 'success' });
  }

  async function markSongShared(songId: string) {
    const song = songMap.get(songId);
    if (!song) return;
    const sharedAt = new Date().toISOString();
    const nextSong = {
      ...song,
      lastSharedAt: sharedAt,
      updatedAt: song.updatedAt
    };
    await db.songs.put(nextSong);
    setSongs((current) => current.map((item) => (item.id === songId ? nextSong : item)));
    if (selectedSongId === songId) setSelectedSongId(songId);
  }

  function openSongAfterSharedImport(songId: string) {
    setSelectedSongId(songId);
    setEditorReturnMode('library');
    setActiveMode('editor');
    window.history.replaceState({}, '', '/');
  }

  async function importSharedSongAsCopy(song: Song) {
    const sourceShareId = song.importedFromShareId || song.sourceShareId;
    const nextSong = {
      ...song,
      id: createId('song'),
      songUuid: createSongUuid(),
      version: 1,
      importedFromShareId: undefined,
      sourceShareId: undefined,
      copiedFromShareId: sourceShareId,
      sharedSource: sourceShareId ? 'OpenStage Share Copy' : song.sharedSource,
      title: songs.some((existing) => existing.title === song.title && existing.artist === song.artist)
        ? `${song.title} Copy`
        : song.title,
      importedAt: new Date().toISOString()
    };
    await saveSong(nextSong);
    openSongAfterSharedImport(nextSong.id);
    setToast({ message: 'Song imported successfully.', type: 'success' });
  }

  async function replaceSharedSong(existing: Song, shared: Song) {
    const nextSong = {
      ...shared,
      id: existing.id,
      songUuid: existing.songUuid?.trim() || shared.songUuid?.trim() || createSongUuid(),
      version: shared.version ? normalizeSongVersion(shared.version) : normalizeSongVersion(existing.version) + 1,
      favorite: existing.favorite,
      displayPreference: existing.displayPreference ?? shared.displayPreference,
      importedAt: new Date().toISOString()
    };
    await saveSong(nextSong);
    openSongAfterSharedImport(existing.id);
    setToast({ message: 'Song imported successfully.', type: 'success' });
  }

  function keepExistingSharedSong(existing: Song) {
    openSongAfterSharedImport(existing.id);
    setToast({ message: 'Opened existing song', type: 'info' });
  }

  async function updateStageHarmony(songId: string, start: number, end: number, operation: StageHarmonyEditOperation) {
    const song = songMap.get(songId);
    if (!song) return;
    const previousChart = song.chart;
    const nextChart = applyStageHarmonyEdit(previousChart, start, end, operation);
    if (nextChart === previousChart) {
      setToast({ message: 'Select lyric text first', type: 'info' });
      return;
    }
    try {
      const nextSong = {
        ...song,
        version: normalizeSongVersion(song.version) + 1,
        chart: nextChart,
        rawChordPro: nextChart,
        parsedChordPro: parseChordPro(nextChart),
        updatedAt: new Date().toISOString()
      };
      clearRenderCache();
      await db.songs.put(nextSong);
      await loadData();
      setSelectedSongId(songId);
      setToast({
        message: operation === 'mark' ? 'Harmony marked' : 'Harmony removed',
        type: 'success',
        actionLabel: 'Undo',
        onAction: () => {
          void updateStageHarmonyChart(song, previousChart);
        }
      });
    } catch (error) {
      setToast({ message: 'Harmony save failed', type: 'error' });
      reportError('Harmony save failed', error);
    }
  }

  async function updateStageHarmonyChart(song: Song, chart: string) {
    try {
      const restoredSong = {
        ...song,
        version: normalizeSongVersion(song.version) + 1,
        chart,
        rawChordPro: chart,
        parsedChordPro: parseChordPro(chart),
        updatedAt: new Date().toISOString()
      };
      clearRenderCache();
      await db.songs.put(restoredSong);
      await loadData();
      setSelectedSongId(song.id);
      setToast({ message: 'Harmony edit undone', type: 'info' });
    } catch (error) {
      setToast({ message: 'Undo failed', type: 'error' });
      reportError('Harmony undo failed', error);
    }
  }

  async function toggleSongFavorite(songId: string) {
    const song = songMap.get(songId);
    if (!song) return;
    const nextSong = {
      ...song,
      favorite: !Boolean(song.favorite),
      updatedAt: new Date().toISOString()
    };
    await db.songs.put(nextSong);
    setSongs((current) => current.map((item) => (item.id === songId ? nextSong : item)));
    if (selectedSongId === songId) setSelectedSongId(songId);
  }

  async function updateSongCapo(songId: string, capo: number) {
    const song = songMap.get(songId);
    if (!song) return;
    const nextCapo = Math.max(0, Math.min(12, Number(capo) || 0));
    const nextSong = {
      ...song,
      version: normalizeSongVersion(song.version) + 1,
      capo: nextCapo,
      parsedChordPro: parseChordPro(song.chart),
      updatedAt: new Date().toISOString()
    };
    await db.songs.put(nextSong);
    setSongs((current) => current.map((item) => (item.id === songId ? nextSong : item)));
    if (performanceState.capoOverrides?.[songId] !== undefined) {
      const capoOverrides = { ...performanceState.capoOverrides };
      delete capoOverrides[songId];
      updateStorePerformance({ capoOverrides });
    }
  }

  async function updateSongBpm(songId: string, bpm: number) {
    const song = songMap.get(songId);
    if (!song) return;
    const nextBpm = clampTempoBpm(bpm, song.bpm || 120);
    const nextSong = {
      ...song,
      version: normalizeSongVersion(song.version) + 1,
      bpm: nextBpm,
      updatedAt: new Date().toISOString()
    };
    await db.songs.put(nextSong);
    setSongs((current) => current.map((item) => (item.id === songId ? nextSong : item)));
    if (selectedSongId === songId) setSelectedSongId(songId);
  }

  async function deleteSong(id: string) {
    await db.transaction('rw', db.songs, db.setlist, db.setlists, async () => {
      await db.songs.delete(id);
      await db.setlist.where('songId').equals(id).delete();
    });
    await loadData();
  }

  async function addToSetlist(songId: string) {
    if (!allowSetlistDuplicates && setlist.some((item) => item.songId === songId)) {
      setToast({ message: 'Song already in setlist', type: 'info' });
      return;
    }
    setSetlist((items) => [...items, { id: createId('setlist-item'), songId, order: items.length }]);
    setSetlistDirty(true);
  }

  function updateSetlist(items: SetlistItem[]) {
    setSetlist(items.map((item, order) => ({ ...item, order })));
    setSetlistDirty(true);
  }

  function removeFromSetlist(itemId: string) {
    updateSetlist(setlist.filter((item) => item.id !== itemId));
  }

  function moveSetlistItem(itemId: string, direction: 1 | -1) {
    const index = setlist.findIndex((item) => item.id === itemId);
    const nextIndex = index + direction;
    if (index < 0 || nextIndex < 0 || nextIndex >= setlist.length) return;
    updateSetlist(arrayMove(setlist, index, nextIndex));
  }

  function newSetlistDraft() {
    setEditingSetlistId(null);
    setSetlistName('New Setlist');
    setSetlistNotes('');
    setSetlist([]);
    setSetlistDirty(false);
  }

  function openSavedSetlist(saved: SavedSetlist) {
    setEditingSetlistId(saved.id);
    setSetlistName(saved.name);
    setSetlistNotes(saved.notes ?? '');
    setSetlist(saved.songIds.map((songId, order) => ({ id: `${saved.id}-${order}-${songId}`, songId, order })));
    setSetlistDirty(false);
  }

  async function saveCurrentSetlist(asNew = false) {
    const now = new Date().toISOString();
    const existing = !asNew && editingSetlistId ? savedSetlists.find((saved) => saved.id === editingSetlistId) : undefined;
    const saved: SavedSetlist = {
      id: existing?.id ?? createId('setlist'),
      name: setlistName.trim() || 'Untitled Setlist',
      songIds: [...setlist].sort((a, b) => a.order - b.order).map((item) => item.songId),
      createdAt: existing?.createdAt ?? now,
      updatedAt: now,
      notes: setlistNotes.trim()
    };
    await db.setlists.put(saved);
    await db.setlist.clear();
    if (saved.songIds.length > 0) {
      await db.setlist.bulkPut(saved.songIds.map((songId, order) => ({ id: `${saved.id}-${order}-${songId}`, songId, order })));
    }
    setSavedSetlists((current) => [saved, ...current.filter((item) => item.id !== saved.id)]);
    openSavedSetlist(saved);
    setToast({ message: 'Setlist Saved', type: 'success' });
  }

  async function deleteSavedSetlist(id: string) {
    await db.setlists.delete(id);
    setSavedSetlists((current) => current.filter((saved) => saved.id !== id));
    if (editingSetlistId === id) newSetlistDraft();
    if (activeSetlistId === id) {
      setActiveSetlistId(null);
      setNavigationContext('library');
    }
  }

  async function duplicateSavedSetlist(saved: SavedSetlist) {
    const now = new Date().toISOString();
    const copy: SavedSetlist = {
      ...saved,
      id: createId('setlist'),
      name: `${saved.name} Copy`,
      createdAt: now,
      updatedAt: now
    };
    await db.setlists.put(copy);
    setSavedSetlists((current) => [copy, ...current]);
  }

  function sortCurrentSetlist(sortBy: SetlistSortMode) {
    if (sortBy === 'manual') return;
    if (setlist.length > 1 && !window.confirm('Replace the current manual order with this sort?')) return;
    const sorted = [...setlist].sort((a, b) => compareSetlistItems(a, b, sortBy, songMap));
    updateSetlist(sorted);
  }

  function runSavedSetlist(saved: SavedSetlist) {
    const firstSong = saved.songIds.map((id) => songMap.get(id)).find((song): song is Song => Boolean(song));
    if (!firstSong) {
      setToast({ message: 'Setlist has no available songs', type: 'error' });
      return;
    }
    setActiveSetlistId(saved.id);
    setNavigationContext('setlist');
    setSelectedSongId(firstSong.id);
    setActiveMode('stage');
    updatePerformanceState({ recoverToStageMode: true });
  }

  function selectStageLibrarySong(songId: string, source: NavigationContext = 'library') {
    setNavigationContext(source);
    setSelectedSongId(songId);
    setActiveMode('stage');
    restoredScrollSongRef.current = '';
    updatePerformanceState({ recoverToStageMode: true });
    const target = resolveAutoscrollTarget(stageRef.current);
    if (target) setAutoscrollScrollTop(target, 0);
  }

  function moveSelectedSong(direction: 1 | -1) {
    const navigationSongs = activeNavigationSongs;
    if (navigationSongs.length === 0) {
      setToast({ message: 'No songs available', type: 'info' });
      return;
    }

    const currentIndex = Math.max(0, navigationSongs.findIndex((song) => song.id === selectedSongId));
    const nextIndex = currentIndex + direction;
    if (nextIndex < 0) {
      setToast({ message: 'First song', type: 'info' });
      return;
    }
    if (nextIndex >= navigationSongs.length) {
      setToast({ message: 'Last song', type: 'info' });
      return;
    }

    setIsTransitioningSong(true);
    window.setTimeout(() => setIsTransitioningSong(false), 300);
    setSelectedSongId(navigationSongs[nextIndex].id);
    setActiveMode((mode) => (mode === 'stage' ? 'stage' : 'perform'));
    setCountdownRemaining(performanceState.countdownSeconds);
    restoredScrollSongRef.current = '';
    const target = resolveAutoscrollTarget(stageRef.current);
    if (target) setAutoscrollScrollTop(target, 0);
  }

  function updatePerformanceState(next: Partial<PerformanceState>) {
    updateStorePerformance(next);
  }

  function updateAutoscrollPreset(preset: AutoscrollPreset) {
    const multiplier = preset === 'custom' ? performanceState.autoscrollSpeed : speedPresets[preset];
    updateLiveAutoscrollSpeedMultiplier(multiplier);
    updateStorePerformance({
      autoscrollPreset: preset,
      autoscrollSpeed: normalizeAutoscrollSpeedMultiplier(multiplier)
    });
  }

  function updateAutoscrollSpeed(speed: number) {
    const multiplier = normalizeAutoscrollSpeedMultiplier(speed);
    updateLiveAutoscrollSpeedMultiplier(multiplier);
    updateStorePerformance({ autoscrollPreset: 'custom', autoscrollSpeed: multiplier });
  }

  function updateLiveAutoscrollSpeedMultiplier(multiplier: number) {
    const nextMultiplier = normalizeAutoscrollSpeedMultiplier(multiplier);
    scrollSpeedMultiplierRef.current = nextMultiplier;
    const finalPixelsPerSecond = applyAutoscrollSpeedMultiplier(basePixelsPerSecondRef.current, nextMultiplier);
    const clampedPixelsPerSecond = clampAutoscrollFinalPixelsPerSecond(finalPixelsPerSecond);
    finalPixelsPerSecondRef.current = clampedPixelsPerSecond;
    const controller = autoscrollControllerRef.current;
    controller.scrollSpeedMultiplier = nextMultiplier;
    controller.finalPixelsPerSecond = clampedPixelsPerSecond;
    controller.pixelsPerSecond = clampedPixelsPerSecond;
  }

  async function calculateAndSaveDurationFromBpm() {
    if (!selectedSong) return;
    const target = resolveAutoscrollTarget(stageRef.current);
    const metrics = target ? getAutoscrollMetrics(target) : estimateMetricsFromViewport();
    const estimate = getBpmDurationEstimate(selectedSong, metrics, performanceState);
    if (!estimate) {
      setToast({ message: 'BPM is required to calculate duration', type: 'error' });
      return;
    }
    await saveSong({ ...selectedSong, durationSeconds: Math.round(estimate.durationSeconds) });
  }

  function buildReceiverPayload(performanceOverride?: PerformanceState): RemoteReceiverPayload | null {
    if (!selectedSong) return null;
    const target = resolveAutoscrollTarget(stageRef.current);
    const pendingScroll = pendingScrollPositionRef.current?.songId === selectedSong.id ? pendingScrollPositionRef.current.scrollTop : undefined;
    const savedScroll = performanceStateRef.current.scrollPositions[selectedSong.id] ?? 0;
    const metrics = target ? getAutoscrollMetrics(target) : null;
    const scrollTop = Math.round(pendingScroll ?? metrics?.scrollTopAfter ?? savedScroll);
    const maxScroll = Math.max(0, metrics?.maxScroll ?? 0);
    const scrollProgress = maxScroll > 0 ? clampNumber(scrollTop / maxScroll, 0, 1) : 0;
    const performance = performanceOverride ?? performanceStateRef.current;
    const activeReceiverSettings = normalizeReceiverDisplaySettings(performance.receiverDisplay);
    const typography = {
      lyricFontSize: getEffectiveLyricFontSize(performance),
      chordFontSize: getEffectiveChordFontSize(performance),
      sectionFontSize: getEffectiveSectionFontSize(performance),
      headerFontSize: getEffectiveHeaderFontSize(performance),
      songTitleFontSize: getEffectiveSongTitleFontSize(performance),
      songArtistFontSize: getEffectiveSongArtistFontSize(performance),
      lineSpacing: getEffectiveLineSpacing(performance)
    };
    const receiverPerformance: PerformanceState = {
      ...performance,
      activeProfile: 'prompter-display',
      portraitMode: activeReceiverSettings.displayMode !== 'landscape-lyrics',
      receiverDisplay: activeReceiverSettings
    };
    const visual = getReceiverVisualTheme(receiverPerformance, activeReceiverSettings);
    return {
      song: selectedSong,
      performance: receiverPerformance,
      effectiveCapo: getEffectiveCapo(selectedSong, performance),
      scrollTop,
      scrollProgress,
      autoscrollActive: autoscrollControllerRef.current.active || isAutoscrolling,
      receiver: activeReceiverSettings,
      visualTheme: {
        stageTheme: receiverPerformance.stageTheme,
        theme: receiverPerformance.theme,
        ...visual
      },
      typography,
      updatedAt: new Date().toISOString()
    };
  }

  function sendReceiverNow() {
    const payload = buildReceiverPayload();
    if (!payload) return false;
    return publishRemoteReceiverState(payload);
  }

  function sendReceiverWithState(nextPerformance: PerformanceState) {
    const payload = buildReceiverPayload(nextPerformance);
    if (!payload) return false;
    return publishRemoteReceiverState(payload);
  }

  function scheduleReceiverPublish(delayMs = 180) {
    if (!isStageSurface || !selectedSong) return;
    if (receiverPublishTimeoutRef.current !== null) window.clearTimeout(receiverPublishTimeoutRef.current);
    receiverPublishTimeoutRef.current = window.setTimeout(() => {
      receiverPublishTimeoutRef.current = null;
      sendReceiverNow();
    }, delayMs);
  }

  function saveStageScroll(songId: string, scrollTop: number) {
    handleManualAutoscrollScroll(scrollTop);
    pendingScrollPositionRef.current = { songId, scrollTop };
    scheduleReceiverPublish(120);
    if (autoscrollControllerRef.current.active) return;
    scheduleStageScrollSave();
  }

  function scheduleStageScrollSave() {
    if (scrollSaveTimeoutRef.current !== null) return;
    scrollSaveTimeoutRef.current = window.setTimeout(() => {
      scrollSaveTimeoutRef.current = null;
      flushStageScrollSave();
    }, 1000);
  }

  function flushStageScrollSave() {
    const pending = pendingScrollPositionRef.current;
    if (!pending) return;
    pendingScrollPositionRef.current = null;
    if (scrollSaveFrameRef.current) cancelAnimationFrame(scrollSaveFrameRef.current);
    scrollSaveFrameRef.current = requestAnimationFrame(() => {
      const currentPositions = performanceStateRef.current.scrollPositions;
      updateStorePerformance({
        scrollPositions: {
          ...currentPositions,
          [pending.songId]: Math.round(pending.scrollTop)
        }
      });
    });
  }

  function clearUserScrollResumeTimer() {
    if (userScrollResumeTimerRef.current !== null) {
      window.clearTimeout(userScrollResumeTimerRef.current);
      userScrollResumeTimerRef.current = null;
    }
  }

  function resumeAutoscrollFromCurrentPosition() {
    const controller = autoscrollControllerRef.current;
    const target = controller.target ?? resolveAutoscrollTarget(stageRef.current);
    if (!controller.active || !target) {
      isUserScrollingRef.current = false;
      return;
    }
    const metrics = getAutoscrollMetrics(target);
    controller.virtualScrollTop = metrics.scrollTopAfter;
    controller.previousScrollTop = metrics.scrollTopAfter;
    controller.maxScroll = metrics.maxScroll;
    controller.lastFrameTimestamp = null;
    controller.lastFrameAtMs = performance.now();
    controller.lastScrollChangeAtMs = performance.now();
    autoscrollStartScrollTopRef.current = metrics.scrollTopAfter;
    autoscrollStartTimeRef.current = performance.now();
    lastUserScrollTopRef.current = metrics.scrollTopAfter;
    isUserScrollingRef.current = false;
  }

  function handleManualAutoscrollScroll(scrollTop: number) {
    const controller = autoscrollControllerRef.current;
    if (!controller.active) return;
    const lastProgrammaticScrollTop = lastProgrammaticScrollTopRef.current;
    if (lastProgrammaticScrollTop !== null && Math.abs(scrollTop - lastProgrammaticScrollTop) < 0.75) return;

    isUserScrollingRef.current = true;
    lastUserScrollTopRef.current = scrollTop;
    controller.virtualScrollTop = scrollTop;
    controller.previousScrollTop = scrollTop;
    controller.lastScrollChangeAtMs = performance.now();
    autoscrollStartScrollTopRef.current = scrollTop;
    autoscrollStartTimeRef.current = performance.now();

    clearUserScrollResumeTimer();
    userScrollResumeTimerRef.current = window.setTimeout(() => {
      userScrollResumeTimerRef.current = null;
      resumeAutoscrollFromCurrentPosition();
    }, 400);
  }

  function updateAutoscrollDebugFromController(frameStatus: string, reason: AutoscrollStopReason = 'none') {
    const controller = autoscrollControllerRef.current;
    const now = performance.now();
    const target = controller.target ?? resolveAutoscrollTarget(stageRef.current);
    const metrics = target ? getAutoscrollMetrics(target) : emptyAutoscrollMetrics();
    setAutoscrollDebug({
      ...metrics,
      isRunning: controller.active && controller.rafId !== null,
      activeRafId: controller.rafId,
      scrollTopBefore: controller.previousScrollTop,
      scrollTopAfter: metrics.scrollTopAfter,
      currentScrollTop: metrics.scrollTopAfter,
      previousScrollTop: controller.previousScrollTop,
      durationSeconds: controller.durationSeconds,
      selectedDurationSeconds: controller.selectedDurationSeconds,
      bpm: selectedSong?.bpm,
      estimatedBeats: controller.estimatedBeats,
      estimatedDurationSeconds: controller.estimatedDurationSeconds,
      readingPaceMultiplier: controller.readingPaceMultiplier,
      durationSource: controller.durationSource,
      displayMode: controller.displayMode,
      deviceProfile: performanceStateRef.current.activeProfile,
      orientation: getAutoscrollOrientation(performanceStateRef.current),
      pixelsPerSecond: controller.pixelsPerSecond,
      speedSource: controller.durationSource,
      basePixelsPerSecond: controller.basePixelsPerSecond,
      scrollSpeedMultiplier: controller.scrollSpeedMultiplier,
      portraitSpeedFactor: controller.portraitSpeedFactor,
      finalPixelsPerSecond: controller.finalPixelsPerSecond,
      elapsedSeconds: controller.lastFrameTimestamp === null || controller.lastFrameAtMs === null ? 0 : Math.max(0, (now - controller.lastFrameAtMs) / 1000),
      frameStatus,
      frameCount: controller.frameCount,
      lastFrameAgeMs: controller.lastFrameAtMs === null ? 0 : Math.max(0, now - controller.lastFrameAtMs),
      lastScrollChangeAgeMs: controller.lastScrollChangeAtMs === null ? 0 : Math.max(0, now - controller.lastScrollChangeAtMs),
      stopReason: reason
    });
  }

  function stopAutoscroll(reason: AutoscrollStopReason, message?: string) {
    const controller = autoscrollControllerRef.current;
    if (controller.rafId !== null) cancelAnimationFrame(controller.rafId);
    controller.active = false;
    controller.loopId += 1;
    controller.rafId = null;
    controller.lastFrameTimestamp = null;
    controller.lastLayoutCheckAtMs = null;
    clearUserScrollResumeTimer();
    isUserScrollingRef.current = false;
    lastProgrammaticScrollTopRef.current = null;
    setIsAutoscrolling(false);
    updateAutoscrollDebugFromController(reason === 'user-paused' ? 'paused' : 'stopped', reason);
    flushStageScrollSave();
  }

  function applyAutoscrollSpeedPlan(controller: AutoscrollController, plan: AutoscrollSpeedPlan) {
    controller.pixelsPerSecond = plan.pixelsPerSecond;
    controller.basePixelsPerSecond = plan.basePixelsPerSecond;
    controller.scrollSpeedMultiplier = plan.scrollSpeedMultiplier;
    controller.portraitSpeedFactor = plan.portraitSpeedFactor;
    controller.finalPixelsPerSecond = plan.finalPixelsPerSecond;
    basePixelsPerSecondRef.current = plan.basePixelsPerSecond;
    scrollSpeedMultiplierRef.current = plan.scrollSpeedMultiplier;
    finalPixelsPerSecondRef.current = plan.finalPixelsPerSecond;
    controller.durationSeconds = plan.durationSeconds;
    controller.selectedDurationSeconds = plan.selectedDurationSeconds;
    controller.estimatedBeats = plan.estimatedBeats;
    controller.estimatedDurationSeconds = plan.estimatedDurationSeconds;
    controller.readingPaceMultiplier = plan.readingPaceMultiplier;
    controller.durationSource = plan.durationSource;
    controller.displayMode = plan.displayMode;
  }

  function toggleAutoscroll() {
    if (autoscrollControllerRef.current.active || isAutoscrolling) {
      stopAutoscroll('user-paused');
      return;
    }
    startAutoscroll();
  }

  function startAutoscroll() {
    const controller = autoscrollControllerRef.current;
    if (controller.rafId !== null) {
      cancelAnimationFrame(controller.rafId);
      controller.rafId = null;
      updateAutoscrollDebugFromController('stale loop cancelled', 'stale-loop-cancelled');
    }
    controller.active = false;
    controller.loopId += 1;
    beginAutoscrollLoop(controller);
    /*
    if (before.maxScroll <= 0) {
      setToast({ message: 'Song fits on screen — nothing to scroll', type: 'info' });
      setAutoscrollDebug({ ...before, scrollTopAfter: before.scrollTopAfter, pixelsPerSecond, frameStatus: 'no overflow', frameCount: 0, stopReason: 'no-overflow' });
      return;
    }

    const probeDelta = Math.max(1, Math.min(4, pixelsPerSecond / 8));
    setAutoscrollScrollTop(target, Math.min(before.maxScroll, before.scrollTopAfter + probeDelta));
    const after = getAutoscrollMetrics(target);
    setAutoscrollDebug({ ...after, scrollTopBefore: before.scrollTopAfter, pixelsPerSecond, frameStatus: 'verified start', frameCount: 0, stopReason: 'none' });

    if (after.scrollTopAfter <= before.scrollTopAfter) {
      setToast({ message: 'Autoscroll could not move the song', type: 'error' });
      setAutoscrollDebug({ ...after, scrollTopBefore: before.scrollTopAfter, pixelsPerSecond, frameStatus: 'stopped', frameCount: 0, stopReason: 'no-overflow' });
      return;
    }

    autoscrollFrameCountRef.current = 0;
    lastAutoscrollFrameRef.current = null;
    setIsAutoscrolling(true);
    */
  }

  function beginAutoscrollLoop(controller: AutoscrollController) {
    const target = resolveAutoscrollTarget(stageRef.current);
    if (!target) {
      controller.target = null;
      updateAutoscrollDebugFromController('no target', 'no-scroll-target');
      return;
    }

    const before = getAutoscrollMetrics(target);
    const speedPlan = getAutoscrollSpeedPlan(selectedSong, before, performanceState);
    if (speedPlan.durationSource === 'manual-duration' && speedPlan.pixelsPerSecond <= 0) {
      controller.target = target;
      applyAutoscrollSpeedPlan(controller, speedPlan);
      updateAutoscrollDebugFromController('invalid duration', 'invalid-duration');
      return;
    }

    if (before.maxScroll <= 0) {
      controller.target = target;
      controller.maxScroll = before.maxScroll;
      applyAutoscrollSpeedPlan(controller, speedPlan);
      stopAutoscroll('no-overflow');
      return;
    }

    const loopId = controller.loopId;
    const now = performance.now();
    controller.active = true;
    controller.target = target;
    controller.virtualScrollTop = before.scrollTopAfter;
    controller.previousScrollTop = before.scrollTopAfter;
    autoscrollStartScrollTopRef.current = before.scrollTopAfter;
    autoscrollStartTimeRef.current = now;
    lastUserScrollTopRef.current = before.scrollTopAfter;
    isUserScrollingRef.current = false;
    lastProgrammaticScrollTopRef.current = before.scrollTopAfter;
    applyAutoscrollSpeedPlan(controller, speedPlan);
    controller.maxScroll = before.maxScroll;
    controller.lastFrameTimestamp = null;
    controller.lastFrameAtMs = now;
    controller.lastScrollChangeAtMs = now;
    controller.lastLayoutCheckAtMs = now;
    controller.frameCount = 0;
    setIsAutoscrolling(true);
    updateAutoscrollDebugFromController('starting');

    const tick = (timestamp: number) => {
      const activeController = autoscrollControllerRef.current;
      if (!activeController.active || activeController.loopId !== loopId) {
        if (activeController.rafId !== null) cancelAnimationFrame(activeController.rafId);
        activeController.rafId = null;
        updateAutoscrollDebugFromController('stale loop cancelled', 'stale-loop-cancelled');
        return;
      }

      activeController.rafId = null;
      const frameNow = performance.now();
      activeController.lastFrameAtMs = frameNow;
      const currentTarget = activeController.target;
      if (!currentTarget) {
        stopAutoscroll('no-scroll-target', 'Autoscroll stopped unexpectedly');
        return;
      }
      if (!isAutoscrollTargetConnected(currentTarget)) {
        stopAutoscroll('target-changed', 'Autoscroll stopped unexpectedly');
        return;
      }

      if (activeController.lastLayoutCheckAtMs === null || frameNow - activeController.lastLayoutCheckAtMs > 1000) {
        const metrics = getAutoscrollMetrics(currentTarget);
        activeController.lastLayoutCheckAtMs = frameNow;
        if (metrics.maxScroll <= 0) {
          stopAutoscroll('no-overflow', 'Song fits on screen - nothing to scroll');
          return;
        }
        if (Math.abs(metrics.maxScroll - activeController.maxScroll) > 1) {
          applyAutoscrollSpeedPlan(activeController, getAutoscrollSpeedPlan(selectedSong, metrics, performanceStateRef.current));
          activeController.maxScroll = metrics.maxScroll;
        }
      }

      if (isUserScrollingRef.current) {
        const metrics = getAutoscrollMetrics(currentTarget);
        activeController.virtualScrollTop = metrics.scrollTopAfter;
        activeController.previousScrollTop = metrics.scrollTopAfter;
        activeController.lastFrameTimestamp = timestamp;
        activeController.lastFrameAtMs = frameNow;
        activeController.lastScrollChangeAtMs = frameNow;
        activeController.rafId = requestAnimationFrame(tick);
        return;
      }

      const elapsedSeconds =
        activeController.lastFrameTimestamp === null ? 0 : Math.min((timestamp - activeController.lastFrameTimestamp) / 1000, 0.12);
      activeController.lastFrameTimestamp = timestamp;
      const previousScrollTop = activeController.virtualScrollTop;
      const livePixelsPerSecond = finalPixelsPerSecondRef.current;
      activeController.pixelsPerSecond = livePixelsPerSecond;
      activeController.finalPixelsPerSecond = livePixelsPerSecond;
      activeController.scrollSpeedMultiplier = scrollSpeedMultiplierRef.current;
      const next = advanceVirtualScrollTop(activeController.virtualScrollTop, elapsedSeconds, livePixelsPerSecond, activeController.maxScroll);
      activeController.virtualScrollTop = next.nextScrollTop;
      activeController.previousScrollTop = previousScrollTop;
      setAutoscrollScrollTop(currentTarget, activeController.virtualScrollTop);
      lastProgrammaticScrollTopRef.current = activeController.virtualScrollTop;
      activeController.frameCount += 1;
      if (Math.abs(activeController.virtualScrollTop - previousScrollTop) > 0.01) {
        activeController.lastScrollChangeAtMs = performance.now();
      }
      if (frameNow - lastReceiverAutoscrollPublishRef.current > 120) {
        lastReceiverAutoscrollPublishRef.current = frameNow;
        sendReceiverNow();
      }

      if (!next.reachedEnd && activeController.lastScrollChangeAtMs !== null && performance.now() - activeController.lastScrollChangeAtMs > 1500) {
        stopAutoscroll('scroll-not-changing', 'Autoscroll stopped unexpectedly');
        return;
      }

      if (performanceStateRef.current.showAutoscrollDebug) {
        const after = getAutoscrollMetrics(currentTarget);
        setAutoscrollDebug({
          ...after,
          isRunning: true,
          activeRafId: null,
          scrollTopBefore: previousScrollTop,
          scrollTopAfter: after.scrollTopAfter,
          currentScrollTop: after.scrollTopAfter,
          previousScrollTop,
          durationSeconds: activeController.durationSeconds,
          selectedDurationSeconds: activeController.selectedDurationSeconds,
          bpm: selectedSong?.bpm,
          estimatedBeats: activeController.estimatedBeats,
          estimatedDurationSeconds: activeController.estimatedDurationSeconds,
          readingPaceMultiplier: activeController.readingPaceMultiplier,
          durationSource: activeController.durationSource,
          displayMode: activeController.displayMode,
          deviceProfile: performanceStateRef.current.activeProfile,
          orientation: getAutoscrollOrientation(performanceStateRef.current),
          pixelsPerSecond: activeController.pixelsPerSecond,
          speedSource: activeController.durationSource,
          basePixelsPerSecond: basePixelsPerSecondRef.current,
          scrollSpeedMultiplier: scrollSpeedMultiplierRef.current,
          portraitSpeedFactor: activeController.portraitSpeedFactor,
          finalPixelsPerSecond: livePixelsPerSecond,
          elapsedSeconds,
          frameStatus: 'firing',
          frameCount: activeController.frameCount,
          lastFrameAgeMs: 0,
          lastScrollChangeAgeMs:
            activeController.lastScrollChangeAtMs === null ? 0 : Math.max(0, performance.now() - activeController.lastScrollChangeAtMs),
          stopReason: 'none'
        });
      }

      if (next.reachedEnd) {
        stopAutoscroll('reached-end', 'End of song');
        return;
      }

      activeController.rafId = requestAnimationFrame(tick);
      if (performanceStateRef.current.showAutoscrollDebug) {
        setAutoscrollDebug((current) => ({ ...current, activeRafId: activeController.rafId }));
      }
    };

    controller.rafId = requestAnimationFrame(tick);
    if (performanceStateRef.current.showAutoscrollDebug) {
      setAutoscrollDebug((current) => ({ ...current, activeRafId: controller.rafId, isRunning: true }));
    }
  }

  async function exportSongs(format: 'json' | 'csv') {
    const content = format === 'json' ? songsToJson(songs) : songsToCsv(songs);
    downloadText(content, `openstage-songs.${format}`, format === 'json' ? 'application/json' : 'text/csv');
  }

  async function importSongs(file: File) {
    const text = await file.text();
    const imported = file.name.toLowerCase().endsWith('.csv') ? parseCsvSongs(text) : parseJsonSongs(text);
    await db.songs.bulkPut(imported);
    await loadData();
  }

  async function exportBackup() {
    const backup = await createPortableBackup(performanceState);
    downloadText(JSON.stringify(backup, null, 2), `openstage-backup-${new Date().toISOString().slice(0, 10)}.json`, 'application/json');
  }

  async function restoreBackup(file: File) {
    const backup = JSON.parse(await file.text());
    await restorePortableBackup(backup);
    if (backup.performanceState) updateStorePerformance({ ...defaultPerformanceState, ...backup.performanceState });
    await loadData();
  }

  async function backupLibraryToCloud(userId: string, retryFailuresOnly = false) {
    if (!userId) {
      throw new Error('Sign in to enable cloud backup.');
    }

    const startedAt = performance.now();
    const retryItems = retryFailuresOnly ? cloudBackupProgress.failed : [];
    const songsToBackup = retryFailuresOnly
      ? retryItems.filter((failure): failure is Extract<CloudBackupFailure, { type: 'song' }> => failure.type === 'song').map((failure) => failure.item)
      : songs;
    const setlistsToBackup = retryFailuresOnly
      ? retryItems.filter((failure): failure is Extract<CloudBackupFailure, { type: 'setlist' }> => failure.type === 'setlist').map((failure) => failure.item)
      : savedSetlists;
    const failed: CloudBackupFailure[] = [];

    setCloudBackupProgress({
      phase: 'songs',
      songDone: 0,
      songTotal: songsToBackup.length,
      setlistDone: 0,
      setlistTotal: setlistsToBackup.length,
      failed: [],
      startedAt
    });

    for (let index = 0; index < songsToBackup.length; index += 1) {
      const song = songsToBackup[index];
      try {
        await backupSongToOpenStageApi(song, userId);
      } catch (error) {
        failed.push({ type: 'song', id: song.id, title: song.title || 'Untitled Song', item: song });
        reportError('Cloud song backup failed', error);
      }
      setCloudBackupProgress((current) => ({
        ...current,
        phase: 'songs',
        songDone: index + 1,
        failed: [...failed]
      }));
    }

    setCloudBackupProgress((current) => ({
      ...current,
      phase: 'setlists',
      setlistDone: 0,
      setlistTotal: setlistsToBackup.length,
      failed: [...failed]
    }));

    for (let index = 0; index < setlistsToBackup.length; index += 1) {
      const setlist = setlistsToBackup[index];
      try {
        await backupSetlistToOpenStageApi(setlist, userId);
      } catch (error) {
        failed.push({ type: 'setlist', id: setlist.id, title: setlist.name || 'Untitled Setlist', item: setlist });
        reportError('Cloud setlist backup failed', error);
      }
      setCloudBackupProgress((current) => ({
        ...current,
        phase: 'setlists',
        setlistDone: index + 1,
        failed: [...failed]
      }));
    }

    const completedSeconds = Math.max(0.1, (performance.now() - startedAt) / 1000);
    const completedAt = new Date().toISOString();
    const phase: CloudBackupPhase = failed.length ? 'failed' : 'complete';
    setCloudBackupProgress((current) => ({
      ...current,
      phase,
      songDone: songsToBackup.length,
      setlistDone: setlistsToBackup.length,
      failed: [...failed],
      completedSeconds
    }));

    updatePerformanceState({ lastBackupTime: completedAt });
  }

  async function restoreLibraryFromCloud(userId: string): Promise<CloudRestoreResult> {
    if (!userId) throw new Error('Sign in to restore your cloud library.');
    let restorePoint: Awaited<ReturnType<typeof createRestorePoint>> | null = null;

    try {
      console.log('RESTORE_PHASE: creating local restore point');
      restorePoint = await createRestorePoint(performanceState);
      const restoreUrl = `${openStageApiBaseUrl}/api/sync/library?userId=${encodeURIComponent(userId)}&includeFull=true`;
      console.log('RESTORE_PHASE: downloading cloud library', restoreUrl);
      const response = await fetch(restoreUrl);
      const body = await response.json().catch(() => null);

      if (!response.ok || !body?.ok) {
        throw new Error(body?.error || `Cloud library restore failed with HTTP ${response.status}`);
      }

      console.log('RESTORE_PHASE: validating cloud data');
      if (!Array.isArray(body.songs) || !Array.isArray(body.setlists)) {
        throw new Error('Cloud library response is invalid.');
      }

      const downloadedSongCount = body.songs.length;
      const downloadedSetlistCount = body.setlists.length;
      const candidatesByUuid = new Map<string, RestoreSongCandidate>();
      body.songs.forEach((item: { song?: unknown; revision?: unknown; updatedAt?: unknown }, index: number) => {
        const candidate = normalizeCloudRestoreSong(item, index);
        const existing = candidatesByUuid.get(candidate.song.songUuid || candidate.song.id);
        if (existing) {
          console.warn('RESTORE_DUPLICATE_SONG_UUID', {
            songUuid: candidate.song.songUuid,
            keptTitle: existing.song.title,
            duplicateTitle: candidate.song.title,
            keptRevision: normalizeSongVersion(existing.song.version),
            duplicateRevision: normalizeSongVersion(candidate.song.version),
            keptUpdatedAt: existing.sourceUpdatedAt,
            duplicateUpdatedAt: candidate.sourceUpdatedAt
          });
          if (isNewerRestoreCandidate(candidate, existing)) {
            candidatesByUuid.set(candidate.song.songUuid || candidate.song.id, candidate);
          }
          return;
        }
        candidatesByUuid.set(candidate.song.songUuid || candidate.song.id, candidate);
      });

      const cloudSongs = makeUniqueRestoreSongIds(Array.from(candidatesByUuid.values()));
      console.log('RESTORE_NORMALIZED_SONG_COUNT', cloudSongs.length);
      const cloudSetlists = body.setlists.map((item: { setlist?: unknown }, index: number) => {
        const setlist = item?.setlist;
        if (!setlist || typeof setlist !== 'object' || typeof (setlist as SavedSetlist).id !== 'string' || !Array.isArray((setlist as SavedSetlist).songIds)) {
          throw new Error(`Cloud setlist ${index + 1} is invalid.`);
        }
        return setlist as SavedSetlist;
      });

      if (cloudSetlists.length !== downloadedSetlistCount) {
        throw new Error('Cloud library restore count validation failed before import.');
      }

      console.log('RESTORE_PHASE: clearing local library');
      await db.transaction('rw', db.songs, db.setlist, db.setlists, async () => {
        await db.songs.clear();
        await db.setlist.clear();
        await db.setlists.clear();
        console.log('RESTORE_PHASE: restoring songs');
        const songInsertFailures: Array<{ song: Song; error: unknown; validationReason: string }> = [];
        for (const song of cloudSongs) {
          try {
            await db.songs.put(song);
          } catch (error) {
            songInsertFailures.push({ song, error, validationReason: 'indexeddb-put-failed' });
            console.error('RESTORE_SONG_INSERT_FAILED', {
              songUuid: song.songUuid || '',
              title: song.title || '',
              artist: song.artist || '',
              error: error instanceof Error ? error.message : String(error),
              validationReason: 'indexeddb-put-failed'
            });
          }
        }
        if (songInsertFailures.length > 0) {
          throw new Error(`${songInsertFailures.length} cloud song(s) failed to insert.`);
        }
        console.log('RESTORE_PHASE: restoring setlists');
        await db.setlists.bulkPut(cloudSetlists);
      });

      console.log('RESTORE_PHASE: verifying restore');
      const [insertedSongCount, insertedSetlistCount] = await Promise.all([
        db.songs.count(),
        db.setlists.count()
      ]);

      console.log('Cloud Songs:', downloadedSongCount);
      console.log('Inserted Songs:', insertedSongCount);
      console.log('Cloud Setlists:', downloadedSetlistCount);
      console.log('Inserted Setlists:', insertedSetlistCount);
      console.log('RESTORE_INSERTED_SONG_COUNT', insertedSongCount);

      if (insertedSongCount !== cloudSongs.length || insertedSetlistCount !== downloadedSetlistCount) {
        console.error('Verification FAILED', {
          songs: {
            expected: cloudSongs.length,
            actual: insertedSongCount
          },
          setlists: {
            expected: downloadedSetlistCount,
            actual: insertedSetlistCount
          }
        });
        throw new Error(`Restore count mismatch. Expected ${cloudSongs.length} normalized unique songs and ${downloadedSetlistCount} setlists, inserted ${insertedSongCount} songs and ${insertedSetlistCount} setlists.`);
      }

      console.log('Verification PASSED');
      updateStorePerformance({ lastRestoreTime: new Date().toISOString() });
      await loadData();
      console.log('RESTORE_PHASE: restore complete');
      return {
        songCount: insertedSongCount,
        setlistCount: insertedSetlistCount
      };
    } catch (error) {
      reportError('Cloud restore failed; restoring local restore point', error);
      if (restorePoint) {
        await restoreFromRestorePoint(restorePoint);
        updateStorePerformance(restorePoint.settings);
        await loadData();
      }
      throw error;
    }
  }

  async function undoLastRestore() {
    const restorePoint = await loadRestorePoint();
    if (!restorePoint) throw new Error('No restore point is available.');
    await restoreFromRestorePoint(restorePoint);
    updateStorePerformance({ ...restorePoint.settings, lastRestoreTime: new Date().toISOString() });
    await loadData();
  }

  async function importChordProCandidates(candidates: ImportCandidate[], strategy: DuplicateStrategy) {
    const existingByFingerprint = new Map<string, Song>();
    songs.forEach((song) => {
      songDuplicateKeys(song).forEach((key) => {
        if (!existingByFingerprint.has(key)) existingByFingerprint.set(key, song);
      });
    });
    const importedSongs: Song[] = [];
    const summary: ImportSummary = {
      fileNames: [],
      songsFound: 0,
      importedCount: 0,
      skippedCount: 0,
      parseWarnings: [],
      warningGroups: [],
      duplicateWarnings: []
    };

    for (const candidate of candidates) {
      summary.fileNames.push(candidate.fileName);
      if (isOnSongArchiveFileName(candidate.fileName)) {
        try {
          if (!candidate.bytes) throw new Error('Missing archive bytes.');
          const archive = parseOnSongArchive(candidate.bytes, candidate.fileName);
          summary.songsFound += archive.songsFound;
          archive.warnings.forEach((warning) => summary.parseWarnings.push(`${candidate.fileName}: ${warning}`));

          for (const parsed of archive.songs) {
            const duplicateKeys = songDuplicateKeys(parsed.song);
            const existing = duplicateKeys.map((key) => existingByFingerprint.get(key)).find(Boolean);

            if (parsed.warnings.length > 0) {
              summary.warningGroups.push({
                songTitle: parsed.song.title,
                fileName: parsed.fileName,
                warnings: parsed.warnings
              });
              summary.parseWarnings.push(`${parsed.song.title}: ${parsed.warnings.length} parser warning(s).`);
            }

            if (existing && strategy === 'skip') {
              summary.skippedCount += 1;
              summary.duplicateWarnings.push(`${parsed.song.title}: skipped duplicate of "${existing.title}".`);
              continue;
            }

            const songToStore = existing && strategy === 'replace'
              ? { ...parsed.song, id: existing.id, songUuid: existing.songUuid?.trim() || parsed.song.songUuid?.trim() || createSongUuid() }
              : parsed.song;
            if (existing) {
              summary.duplicateWarnings.push(
                `${parsed.song.title}: ${strategy === 'replace' ? 'replaced' : 'imported another copy of'} "${existing.title}".`
              );
            }

            importedSongs.push(songToStore);
            songDuplicateKeys(songToStore).forEach((key) => existingByFingerprint.set(key, songToStore));
            summary.importedCount += 1;
          }
        } catch (error) {
          summary.skippedCount += 1;
          summary.warningGroups.push({
            songTitle: candidate.fileName,
            fileName: candidate.fileName,
            warnings: [error instanceof Error ? error.message : 'This does not appear to be a supported OnSong archive.']
          });
          summary.parseWarnings.push(`${candidate.fileName}: This does not appear to be a supported OnSong archive.`);
        }
        continue;
      }

      if (!isChordProFileName(candidate.fileName)) {
        summary.skippedCount += 1;
        summary.parseWarnings.push(`${candidate.fileName}: unsupported file extension.`);
        continue;
      }

      const bundle = parseChordProBundle(candidate.text ?? '', candidate.fileName);
      summary.songsFound += bundle.songsFound;

      for (const parsed of bundle.songs) {
        const duplicateKeys = songDuplicateKeys(parsed.song);
        const existing = duplicateKeys.map((key) => existingByFingerprint.get(key)).find(Boolean);

        if (parsed.warnings.length > 0) {
          summary.warningGroups.push({
            songTitle: parsed.song.title,
            fileName: parsed.fileName,
            warnings: parsed.warnings
          });
          summary.parseWarnings.push(`${parsed.song.title}: ${parsed.warnings.length} parser warning(s).`);
        }

        if (existing && strategy === 'skip') {
          summary.skippedCount += 1;
          summary.duplicateWarnings.push(`${parsed.song.title}: skipped duplicate of "${existing.title}".`);
          continue;
        }

        const songToStore = existing && strategy === 'replace'
          ? { ...parsed.song, id: existing.id, songUuid: existing.songUuid?.trim() || parsed.song.songUuid?.trim() || createSongUuid() }
          : parsed.song;
        if (existing) {
          summary.duplicateWarnings.push(
            `${parsed.song.title}: ${strategy === 'replace' ? 'replaced' : 'imported another copy of'} "${existing.title}".`
          );
        }

        importedSongs.push(songToStore);
        songDuplicateKeys(songToStore).forEach((key) => existingByFingerprint.set(key, songToStore));
        summary.importedCount += 1;
      }
    }

    if (importedSongs.length > 0) {
      await db.songs.bulkPut(importedSongs);
      setSelectedSongId(importedSongs[0].id);
    }

    return summary;
  }

  async function syncPush() {
    setSyncState('syncing');
    setStoreSyncStatus('syncing');
    try {
      await pushSongsToSupabase(songs);
      setSyncState('idle');
      setStoreSyncStatus('idle');
    } catch {
      setSyncState('error');
      setStoreSyncStatus('error');
    }
  }

  async function syncPull() {
    setSyncState('syncing');
    setStoreSyncStatus('syncing');
    try {
      const remoteSongs = await pullSongsFromSupabase();
      await db.songs.bulkPut(remoteSongs);
      await loadData();
      setSyncState('idle');
      setStoreSyncStatus('idle');
    } catch {
      setSyncState('error');
      setStoreSyncStatus('error');
    }
  }

  async function syncNow() {
    setStoreSyncStatus('syncing');
    try {
      const result = await syncLibraryOfflineFirst();
      setConflicts(result.conflicts);
      await loadData();
    } catch (error) {
      setStoreSyncStatus('error');
      reportError('Library sync failed', error);
    }
  }

  async function handleSupabaseAuth() {
    if (!supabase) return;
    if (syncEmail) {
      await signOutSupabase();
      return;
    }

    const email = window.prompt('Email for Supabase magic link');
    if (email) await signInWithEmail(email);
  }

  const activeSharedImportId = pendingImportShareId || sharedImportId;
  const shouldShowSharedImportLanding = Boolean(
    sharedImportId &&
    !pendingImportShareId &&
    isIosBrowserContext() &&
    !isStandalonePwaContext() &&
    !sharedImportLandingBypassed
  );

  if (activeSharedImportId) {
    return (
      <div className="min-h-screen bg-slate-100 text-slate-950">
        {storageError ? (
          <StorageErrorView message={storageError} />
        ) : shouldShowSharedImportLanding ? (
          <SharedSongImportLanding
            shareId={sharedImportId}
            onImportHere={() => setSharedImportLandingBypassed(true)}
            onCancel={() => {
              window.history.replaceState({}, '', '/');
              setActiveMode('library');
            }}
          />
        ) : (
          <SharedSongImportView
            shareId={activeSharedImportId}
            songs={songs}
            onKeepExisting={keepExistingSharedSong}
            onReplaceExisting={replaceSharedSong}
            onImportCopy={importSharedSongAsCopy}
            onCancel={() => {
              window.history.replaceState({}, '', '/');
              setActiveMode('library');
            }}
          />
        )}
        {toast && <Toast toast={toast} />}
      </div>
    );
  }

  return (
    <div className={`min-h-screen ${isStageSurface ? getStageTheme(performanceState.stageTheme).className : 'bg-slate-100 text-slate-950'}`}>
      <header className={`${isStageSurface ? 'hidden' : 'sticky'} top-0 z-30 border-b border-slate-300 bg-slate-950 text-white`}>
        <div className="app-desktop-header flex min-h-16 flex-wrap items-center gap-3 px-4 py-3">
          <div className="flex items-center gap-3 pr-3">
            <img src="/openstage-icon.svg" className="h-10 w-10" alt="" />
            <div>
              <h1 className="text-lg font-semibold leading-tight">OpenStage</h1>
              <p className="text-xs text-slate-300">Offline-first stage charts</p>
            </div>
          </div>
          <nav className="flex rounded-md border border-slate-700 bg-slate-900 p-1">
            <ModeButton icon={<Library size={17} />} label="Library" mode="library" active={activeMode} setActive={setActiveMode} />
            <ModeButton icon={<Upload size={17} />} label="Import" mode="import" active={activeMode} setActive={setActiveMode} />
            <ModeButton icon={<ListMusic size={17} />} label="Setlist" mode="setlist" active={activeMode} setActive={setActiveMode} />
            <ModeButton icon={<Mic2 size={17} />} label="Perform" mode="perform" active={activeMode} setActive={setActiveMode} />
            <ModeButton icon={<Monitor size={17} />} label="Stage" mode="stage" active={activeMode} setActive={setActiveMode} />
            <ModeButton icon={<Monitor size={17} />} label="Displays" mode="displays" active={activeMode} setActive={setActiveMode} />
            <ModeButton icon={<Settings size={17} />} label="Pedals" mode="pedals" active={activeMode} setActive={setActiveMode} />
            <ModeButton icon={<Settings size={17} />} label="Settings" mode="settings" active={activeMode} setActive={setActiveMode} />
            <ModeButton icon={<Gauge size={17} />} label="Diagnostics" mode="diagnostics" active={activeMode} setActive={setActiveMode} />
            <ModeButton icon={<HelpCircle size={17} />} label="Help" mode="help" active={activeMode} setActive={setActiveMode} />
          </nav>
          <div className="ml-auto flex flex-wrap items-center gap-2">
            <div className="relative">
              <button className="icon-button" title="New song" onClick={() => setNewSongMenuOpen((open) => !open)}>
                <Plus size={18} />
              </button>
              {newSongMenuOpen && (
                <NewSongMenu
                  align="right"
                  onSelect={(action) => {
                    if (action === 'scratch') void createSongFromScratch('library');
                    if (action === 'ai') openAiImport();
                    if (action === 'receive') openReceiveSong();
                  }}
                />
              )}
            </div>
            <button className="icon-button" title="Import songs" onClick={() => setActiveMode('import')}>
              <Upload size={18} />
            </button>
            <button className="icon-button" title="Export JSON" onClick={() => exportSongs('json')}>
              <FileJson size={18} />
            </button>
            <button className="icon-button" title="Export CSV" onClick={() => exportSongs('csv')}>
              <Download size={18} />
            </button>
            <button
              className="inline-flex h-10 items-center gap-2 rounded-md border border-slate-700 px-3 text-sm text-slate-100 disabled:opacity-40"
              disabled={!supabase || !syncEmail || syncState === 'syncing'}
              onClick={syncPush}
            >
              <LogIn size={16} />
              Push
            </button>
            <button
              className="inline-flex h-10 items-center gap-2 rounded-md border border-slate-700 px-3 text-sm text-slate-100 disabled:opacity-40"
              disabled={!supabase || !syncEmail || syncState === 'syncing'}
              onClick={syncPull}
            >
              <ChevronDown size={16} />
              Pull
            </button>
            <button
              className="inline-flex h-10 items-center gap-2 rounded-md border border-slate-700 px-3 text-sm text-slate-100 disabled:opacity-40"
              disabled={!supabase}
              onClick={handleSupabaseAuth}
            >
              <LogIn size={16} />
              {syncEmail ? 'Sign out' : 'Sign in'}
            </button>
          </div>
        </div>
        <div className="app-mobile-header hidden min-h-14 items-center gap-3 px-3 py-2">
          <img src="/openstage-icon.svg" className="h-9 w-9 shrink-0" alt="" />
          <div className="min-w-0 flex-1">
            <h1 className="truncate text-base font-semibold leading-tight">OpenStage</h1>
            <p className="truncate text-xs text-slate-300">{modeLabel(activeMode)}</p>
          </div>
          <button
            className="icon-button"
            type="button"
            aria-label="Open navigation"
            aria-expanded={mobileNavOpen}
            onClick={() => setMobileNavOpen(true)}
          >
            <Menu size={20} />
          </button>
        </div>
        {mobileNavOpen && (
          <div className="app-mobile-nav fixed inset-0 z-50 bg-slate-950 text-white">
            <div className="flex items-center gap-3 border-b border-slate-800 px-4 pb-3 pt-[max(0.85rem,env(safe-area-inset-top))]">
              <img src="/openstage-icon.svg" className="h-10 w-10" alt="" />
              <div className="min-w-0 flex-1">
                <div className="truncate text-lg font-semibold">OpenStage</div>
                <div className="truncate text-sm text-slate-300">{modeLabel(activeMode)}</div>
              </div>
              <button className="icon-button" type="button" aria-label="Close navigation" onClick={() => setMobileNavOpen(false)}>
                <X size={20} />
              </button>
            </div>
            <div className="max-h-[calc(100svh-5rem)] overflow-y-auto px-4 pb-[max(1rem,env(safe-area-inset-bottom))] pt-4">
              <div className="grid gap-2">
                {mobileModeOptions.map((item) => (
                  <button
                    key={item.mode}
                    className={`flex min-h-12 items-center gap-3 rounded-md border px-3 text-left text-sm font-semibold ${activeMode === item.mode ? 'border-teal-300 bg-teal-500/15 text-teal-100' : 'border-slate-800 bg-slate-900 text-slate-100'}`}
                    type="button"
                    onClick={() => setTopLevelMode(item.mode)}
                  >
                    {item.icon}
                    <span>{item.label}</span>
                  </button>
                ))}
              </div>
              <div className="mt-5 border-t border-slate-800 pt-4">
                <div className="mb-2 text-xs font-semibold uppercase tracking-normal text-slate-400">Quick Actions</div>
                <div className="grid gap-2">
                  <button className="stage-menu-button justify-start" type="button" onClick={() => { setMobileNavOpen(false); void createSongFromScratch('library'); }}>
                    <Plus size={18} /> Create From Scratch
                  </button>
                  <button className="stage-menu-button justify-start" type="button" onClick={() => { setMobileNavOpen(false); openAiImport(); }}>
                    <Sparkles size={18} /> AI Import
                  </button>
                  <button className="stage-menu-button justify-start" type="button" onClick={() => setTopLevelMode('import')}>
                    <Upload size={18} /> Import
                  </button>
                  <button className="stage-menu-button justify-start" type="button" onClick={() => { void exportSongs('json'); setMobileNavOpen(false); }}>
                    <FileJson size={18} /> Export Backup
                  </button>
                  <button className="stage-menu-button justify-start" type="button" disabled={!supabase} onClick={() => { void handleSupabaseAuth(); setMobileNavOpen(false); }}>
                    <LogIn size={18} /> {syncEmail ? 'Sign out' : 'Sign in / Sync'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </header>

      {shouldShowPwaUpdateBanner && (
        <PwaUpdateBanner
          stageSurface={isStageSurface}
          onUpdate={() => void applyPwaUpdate()}
          onLater={dismissPwaUpdate}
        />
      )}

      {activeMode === 'library' && (
        storageError ? (
          <StorageErrorView message={storageError} />
        ) : (
          <LibraryView
          songs={filteredSongs}
          query={query}
          setQuery={setQuery}
          smartFilter={smartFilter}
          setSmartFilter={setSmartFilter}
          onNewSongAction={(action) => {
            if (action === 'scratch') void createSongFromScratch('library');
            if (action === 'ai') openAiImport();
            if (action === 'receive') openReceiveSong();
          }}
          onSelect={(id) => {
            setNavigationContext('library');
            setSelectedSongId(id);
            setEditorReturnMode('library');
            setActiveMode('editor');
          }}
          onToggleFavorite={toggleSongFavorite}
        />
        )
      )}

      {activeMode === 'editor' && selectedSong && (
        <SongEditorView
          song={selectedSong}
          songs={songs}
          onSave={async (song) => {
            await saveSong(song, { clearCapoOverride: true });
            setActiveMode(editorReturnMode);
          }}
          onCancel={() => setActiveMode(editorReturnMode)}
          onDelete={async (id) => {
            await deleteSong(id);
            setActiveMode('library');
            setEditorReturnMode('library');
          }}
          onAddToSetlist={addToSetlist}
          performanceState={performanceState}
          setPerformanceState={updatePerformanceState}
          onDirtyChange={setEditorHasUnsavedChanges}
        />
      )}

      {activeMode === 'import' && (
        <ImportSongsView
          songs={songs}
          onImport={async (files, strategy) => {
            const summary = await importChordProCandidates(files, strategy);
            await loadData();
            return summary;
          }}
          onJsonCsvImport={importSongs}
          onWebpageChartImport={async (song) => {
            await saveSong(song);
            setToast({ message: 'Webpage chart imported', type: 'success' });
          }}
          onSharedSongCodeImport={(shareId) => {
            openSharedSongCode(shareId);
          }}
        />
      )}

      {activeMode === 'setlist' && (
        <SetlistView
          entries={activeSetlistEntries}
          songs={songs}
          savedSetlists={savedSetlists}
          currentSetlistId={editingSetlistId}
          setlistName={setlistName}
          setSetlistName={(name) => {
            setSetlistName(name);
            setSetlistDirty(true);
          }}
          setlistNotes={setlistNotes}
          setSetlistNotes={(notes) => {
            setSetlistNotes(notes);
            setSetlistDirty(true);
          }}
          unsavedChanges={setlistDirty}
          allowDuplicates={allowSetlistDuplicates}
          setAllowDuplicates={setAllowSetlistDuplicates}
          totalDuration={totalSetDuration}
          onSelect={(id) => {
            setSelectedSongId(id);
            setEditorReturnMode('setlist');
            setActiveMode('editor');
          }}
          onAdd={addToSetlist}
          onReorder={updateSetlist}
          onRemove={removeFromSetlist}
          onMove={moveSetlistItem}
          onSort={sortCurrentSetlist}
          onSave={() => saveCurrentSetlist(false)}
          onSaveAsNew={() => saveCurrentSetlist(true)}
          onNew={newSetlistDraft}
          onOpen={openSavedSetlist}
          onRun={runSavedSetlist}
          onDuplicate={duplicateSavedSetlist}
          onDelete={deleteSavedSetlist}
        />
      )}

      {activeMode === 'pedals' && (
        <PedalConfigView
          mappings={performanceState.pedalMappings}
          onChange={(pedalMappings) => updatePerformanceState({ pedalMappings })}
          onReset={() => updatePerformanceState({ pedalMappings: defaultPedalMappings })}
        />
      )}

      {activeMode === 'displays' && (
        <DisplaysManagerView
          currentSong={selectedSong}
          state={performanceState}
          setState={updatePerformanceState}
          onSendReceiver={sendReceiverNow}
          onSendReceiverWithState={sendReceiverWithState}
          onSendReceiverTestPattern={() => publishRemoteReceiverTestPattern(receiverSettings)}
        />
      )}

      {activeMode === 'settings' && (
        <SettingsView
          state={performanceState}
          setState={updatePerformanceState}
          setPreset={updateAutoscrollPreset}
          setAutoscrollSpeed={updateAutoscrollSpeed}
          onExportBackup={exportBackup}
          onRestoreBackup={restoreBackup}
          onSyncNow={syncNow}
          onBackupLibrary={() => backupLibraryToCloud(cloud.user?.id ?? '', false)}
          onRetryFailedBackup={() => backupLibraryToCloud(cloud.user?.id ?? '', true)}
          onRestoreLibrary={(userId) => restoreLibraryFromCloud(userId)}
          onUndoLastRestore={undoLastRestore}
          cloudBackupProgress={cloudBackupProgress}
          onPedals={() => setActiveMode('pedals')}
          onImport={() => setActiveMode('import')}
          syncStatus={syncStatus}
          conflicts={conflicts}
        />
      )}

      {activeMode === 'diagnostics' && (
        <DiagnosticsView
          diagnostics={diagnostics}
          logs={appLogs}
          syncStatus={syncStatus}
          conflicts={conflicts}
          onClearLogs={clearLogs}
          pwaUpdate={pwaUpdate}
          onCheckPwaUpdate={() => void checkForPwaUpdate()}
        />
      )}

      {activeMode === 'help' && <HelpView />}

      {activeMode === 'perform' && selectedSong && (
        <PerformanceView
          song={selectedSong}
          songs={songs}
          savedSetlists={savedSetlists}
          entries={activeSetlistEntries}
          stageRef={stageRef}
          nextSong={nextNavigationSong}
          previousSong={previousNavigationSong}
          navigationLabel={activeNavigationContext === 'setlist' ? `Setlist: ${activeSavedSetlist?.name ?? 'Setlist'}` : 'Library Mode'}
          navigationPosition={activeNavigationContext === 'setlist' ? `${activeNavigationIndex + 1} of ${activeNavigationSongs.length}` : `${activeNavigationIndex + 1}/${activeNavigationSongs.length}`}
          activeSetlistName={activeStageSetlistName}
          isTransitioningSong={isTransitioningSong}
          state={performanceState}
          setState={updatePerformanceState}
          setPreset={updateAutoscrollPreset}
          setAutoscrollSpeed={updateAutoscrollSpeed}
          onCalculateDuration={calculateAndSaveDurationFromBpm}
          isAutoscrolling={isAutoscrolling}
          setIsAutoscrolling={setIsAutoscrolling}
          onToggleAutoscroll={toggleAutoscroll}
          autoscrollDebug={autoscrollDebug}
          onPrevious={() => moveSelectedSong(-1)}
          onNext={() => moveSelectedSong(1)}
          onEdit={() => {
            if (isAutoscrolling) stopAutoscroll('route-change');
            setEditorReturnMode('perform');
            setActiveMode('editor');
          }}
          onStageMode={() => {
            updatePerformanceState({ recoverToStageMode: true });
            setActiveMode('stage');
            requestFullscreenSafe();
          }}
          onSettings={() => setActiveMode('settings')}
          onDisplays={() => setActiveMode('displays')}
          onSelectStageSong={selectStageLibrarySong}
          onNewSongAction={(action) => {
            if (action === 'scratch') void createSongFromScratch('perform');
            if (action === 'ai') openAiImport();
            if (action === 'receive') openReceiveSong();
          }}
          onToggleFavorite={toggleSongFavorite}
          onRunStageSetlist={runSavedSetlist}
          onDiagnostics={() => setActiveMode('diagnostics')}
          onPedals={() => setActiveMode('pedals')}
          onImportExport={() => setActiveMode('import')}
          onSync={() => setActiveMode('settings')}
          onExit={() => setActiveMode('library')}
          onChangeSongCapo={(capo) => updateSongCapo(selectedSong.id, capo)}
          onChangeSongBpm={(bpm) => updateSongBpm(selectedSong.id, bpm)}
          onToggleDisplayPreference={() =>
            saveSong({
              ...selectedSong,
              displayPreference: selectedSong.displayPreference === 'chords-over' ? 'inline' : 'chords-over'
            })
          }
          onLiveHarmonyEdit={(operation, start, end) => updateStageHarmony(selectedSong.id, start, end, operation)}
          onSongShared={markSongShared}
          onScroll={(scrollTop) => saveStageScroll(selectedSong.id, scrollTop)}
          onSendReceiver={sendReceiverNow}
          onSendReceiverTestPattern={() => publishRemoteReceiverTestPattern(receiverSettings)}
          countdownRemaining={countdownRemaining}
        />
      )}

      {activeMode === 'stage' && selectedSong && (
        <PerformanceView
          song={selectedSong}
          songs={songs}
          savedSetlists={savedSetlists}
          entries={activeSetlistEntries}
          stageRef={stageRef}
          nextSong={nextNavigationSong}
          previousSong={previousNavigationSong}
          navigationLabel={activeNavigationContext === 'setlist' ? `Setlist: ${activeSavedSetlist?.name ?? 'Setlist'}` : 'Library Mode'}
          navigationPosition={activeNavigationContext === 'setlist' ? `${activeNavigationIndex + 1} of ${activeNavigationSongs.length}` : `${activeNavigationIndex + 1}/${activeNavigationSongs.length}`}
          activeSetlistName={activeStageSetlistName}
          isTransitioningSong={isTransitioningSong}
          state={{ ...performanceState, stageLocked: true, recoverToStageMode: true }}
          setState={updatePerformanceState}
          setPreset={updateAutoscrollPreset}
          setAutoscrollSpeed={updateAutoscrollSpeed}
          onCalculateDuration={calculateAndSaveDurationFromBpm}
          isAutoscrolling={isAutoscrolling}
          setIsAutoscrolling={setIsAutoscrolling}
          onToggleAutoscroll={toggleAutoscroll}
          autoscrollDebug={autoscrollDebug}
          onPrevious={() => moveSelectedSong(-1)}
          onNext={() => moveSelectedSong(1)}
          onEdit={() => {
            if (isAutoscrolling) stopAutoscroll('route-change');
            setEditorReturnMode('stage');
            setActiveMode('editor');
          }}
          onStageMode={requestFullscreenSafe}
          onSettings={() => setActiveMode('settings')}
          onDisplays={() => {
            updatePerformanceState({ recoverToStageMode: false });
            setActiveMode('displays');
            exitFullscreenSafe();
          }}
          onSelectStageSong={selectStageLibrarySong}
          onNewSongAction={(action) => {
            if (action === 'scratch') void createSongFromScratch('stage');
            if (action === 'ai') openAiImport();
            if (action === 'receive') openReceiveSong();
          }}
          onToggleFavorite={toggleSongFavorite}
          onRunStageSetlist={runSavedSetlist}
          onDiagnostics={() => {
            updatePerformanceState({ recoverToStageMode: false });
            setActiveMode('diagnostics');
            exitFullscreenSafe();
          }}
          onPedals={() => {
            updatePerformanceState({ recoverToStageMode: false });
            setActiveMode('pedals');
            exitFullscreenSafe();
          }}
          onImportExport={() => {
            updatePerformanceState({ recoverToStageMode: false });
            setActiveMode('import');
            exitFullscreenSafe();
          }}
          onSync={() => {
            updatePerformanceState({ recoverToStageMode: false });
            setActiveMode('settings');
            exitFullscreenSafe();
          }}
          onExit={() => {
            updatePerformanceState({ recoverToStageMode: false });
            setActiveMode('library');
            exitFullscreenSafe();
          }}
          onChangeSongCapo={(capo) => updateSongCapo(selectedSong.id, capo)}
          onChangeSongBpm={(bpm) => updateSongBpm(selectedSong.id, bpm)}
          onToggleDisplayPreference={() =>
            saveSong({
              ...selectedSong,
              displayPreference: selectedSong.displayPreference === 'chords-over' ? 'inline' : 'chords-over'
            })
          }
          onLiveHarmonyEdit={(operation, start, end) => updateStageHarmony(selectedSong.id, start, end, operation)}
          onSongShared={markSongShared}
          onScroll={(scrollTop) => saveStageScroll(selectedSong.id, scrollTop)}
          onSendReceiver={sendReceiverNow}
          onSendReceiverTestPattern={() => publishRemoteReceiverTestPattern(receiverSettings)}
          countdownRemaining={countdownRemaining}
          stageSetlistMode
        />
      )}

      {!isStageSurface && <footer className="border-t border-slate-300 bg-white px-4 py-2 text-xs text-slate-600">
        IndexedDB offline storage active. Supabase sync: {syncState}
        {syncEmail ? ` as ${syncEmail}` : supabase ? ', signed out' : ''}.
      </footer>}
      {aiImportOpen && (
        <AiImportSongModal
          onClose={() => setAiImportOpen(false)}
          onImport={importAiSong}
        />
      )}
      {receiveSongOpen && (
        <ReceiveSongModal
          onClose={() => setReceiveSongOpen(false)}
          onReceive={openSharedSongCode}
        />
      )}
      {toast && <Toast toast={toast} />}
    </div>
  );
}

function ModeButton({
  icon,
  label,
  mode,
  active,
  setActive
}: {
  icon: React.ReactNode;
  label: string;
  mode: StageMode;
  active: StageMode;
  setActive: (mode: StageMode) => void;
}) {
  return (
    <button
      className={`inline-flex h-9 items-center gap-2 rounded px-3 text-sm ${
        active === mode ? 'bg-teal-600 text-white' : 'text-slate-300 hover:bg-slate-800'
      }`}
      onClick={() => setActive(mode)}
    >
      {icon}
      <span>{label}</span>
    </button>
  );
}

function Toast({ toast }: { toast: Exclude<ToastState, null> }) {
  const tone =
    toast.type === 'success'
      ? 'border-teal-300 bg-teal-700 text-white'
      : toast.type === 'error'
        ? 'border-red-300 bg-red-700 text-white'
        : 'border-slate-300 bg-slate-800 text-white';

  return (
    <div className={`fixed bottom-5 left-1/2 z-[70] flex -translate-x-1/2 items-center gap-3 rounded-md border px-4 py-3 text-sm font-semibold shadow-xl ${tone}`}>
      {toast.message}
      {toast.actionLabel && toast.onAction && (
        <button
          className="rounded border border-white/40 px-2 py-1 text-xs uppercase tracking-normal hover:bg-white/15"
          type="button"
          onClick={toast.onAction}
        >
          {toast.actionLabel}
        </button>
      )}
    </div>
  );
}

function SharedSongImportLanding({
  shareId,
  onImportHere,
  onCancel
}: {
  shareId: string;
  onImportHere: () => void;
  onCancel: () => void;
}) {
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    let cancelled = false;
    async function autoCopy() {
      try {
        await navigator.clipboard?.writeText(shareId);
        if (!cancelled) setCopied(true);
      } catch {
        // Clipboard writes often require a user gesture on iOS Safari.
      }
    }
    void autoCopy();
    return () => {
      cancelled = true;
    };
  }, [shareId]);

  async function copyImportCode() {
    try {
      await navigator.clipboard?.writeText(shareId);
      setCopied(true);
    } catch {
      window.prompt('Copy this OpenStage import code:', shareId);
    }
  }

  return (
    <main className="min-h-screen bg-slate-100 px-4 py-8 text-slate-950 sm:px-6">
      <section className="mx-auto grid max-w-2xl gap-5 rounded-xl border border-slate-300 bg-white p-5 shadow-xl sm:p-7">
        <div>
          <p className="text-sm font-semibold uppercase tracking-normal text-teal-700">OpenStage shared song</p>
          <h1 className="mt-1 text-3xl font-semibold">Receive Song</h1>
          <p className="mt-3 text-sm leading-6 text-slate-600">
            iOS keeps Safari storage separate from the installed Home Screen app. Use this code to receive the song inside the OpenStage app you actually perform from.
          </p>
        </div>
        <div className="rounded-xl border border-teal-200 bg-teal-50 p-5 text-center">
          <div className="text-xs font-semibold uppercase tracking-normal text-teal-800">Share Code</div>
          <div className="mt-2 break-all font-mono text-4xl font-bold tracking-[0.18em] text-slate-950">{shareId}</div>
          {copied && <div className="mt-3 rounded-full bg-teal-700 px-3 py-1 text-sm font-semibold text-white">Share code copied</div>}
        </div>
        <div className="rounded-md border border-slate-200 bg-slate-50 p-4">
          <div className="font-semibold text-slate-950">Using the installed OpenStage app?</div>
          <ol className="mt-3 list-decimal space-y-1 pl-5 text-sm leading-6 text-slate-700">
            <li>Tap Copy Code</li>
            <li>Open OpenStage from your Home Screen</li>
            <li>Tap + New Song</li>
            <li>Choose Receive Song</li>
            <li>Paste the code</li>
          </ol>
        </div>
        <div className="grid gap-2 sm:grid-cols-2">
          <button className="primary-button" type="button" onClick={copyImportCode}>
            {copied ? 'Copy Code Again' : 'Copy Code'}
          </button>
          <button className="secondary-button" type="button" onClick={onImportHere}>
            Import Here in Browser
          </button>
          <button className="secondary-button sm:col-span-2" type="button" onClick={onCancel}>
            Cancel
          </button>
        </div>
        <p className="text-sm leading-6 text-slate-600">
          Import Here in Browser saves only to this browser context. If this page opened in Safari, the installed OpenStage Home Screen app will not see that import.
        </p>
      </section>
    </main>
  );
}

function SharedSongImportView({
  shareId,
  songs,
  onKeepExisting,
  onReplaceExisting,
  onImportCopy,
  onCancel
}: {
  shareId: string;
  songs: Song[];
  onKeepExisting: (song: Song) => void;
  onReplaceExisting: (existing: Song, shared: Song) => Promise<void>;
  onImportCopy: (song: Song) => Promise<void>;
  onCancel: () => void;
}) {
  const [state, setState] = useState<SharedSongImportState>({ status: 'loading', song: null, error: '' });
  const [importing, setImporting] = useState(false);
  const [message, setMessage] = useState('');
  const [duplicate, setDuplicate] = useState<SharedSongDuplicate | null>(null);
  const [comparisonDuplicate, setComparisonDuplicate] = useState<SharedSongDuplicate | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function loadSharedSong() {
      setState({ status: 'loading', song: null, error: '' });
      try {
        const song = await fetchSharedSong(shareId);
        if (!cancelled) setState({ status: 'ready', song, error: '' });
      } catch {
        if (!cancelled) setState({ status: 'error', song: null, error: 'Shared song not found or expired.' });
      }
    }

    void loadSharedSong();

    return () => {
      cancelled = true;
    };
  }, [shareId]);

  async function importSong() {
    if (state.status !== 'ready' || importing) return;
    const match = findSharedSongDuplicate(songs, state.song);
    if (match) {
      setDuplicate(match);
      return;
    }
    await importCopy();
  }

  async function importCopy() {
    if (state.status !== 'ready' || importing) return;
    setImporting(true);
    setMessage('');
    try {
      await onImportCopy(state.song);
      setMessage('Song imported successfully.');
    } catch {
      setMessage('Import failed. Try again.');
      setImporting(false);
    }
  }

  async function replaceExisting() {
    if (state.status !== 'ready' || !duplicate || importing) return;
    setImporting(true);
    setMessage('');
    try {
      await onReplaceExisting(duplicate.existing, state.song);
      setMessage('Song imported successfully.');
    } catch {
      setMessage('Import failed. Try again.');
      setImporting(false);
    }
  }

  return (
    <main className="min-h-screen bg-slate-100 px-4 py-8 text-slate-950 sm:px-6">
      <section className="mx-auto grid max-w-4xl gap-5 rounded-xl border border-slate-300 bg-white p-5 shadow-xl sm:p-7">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-sm font-semibold uppercase tracking-normal text-teal-700">OpenStage shared song</p>
            <h1 className="mt-1 text-3xl font-semibold">Import Song</h1>
          </div>
          <button className="secondary-button" type="button" onClick={onCancel}>
            Cancel
          </button>
        </div>

        {state.status === 'loading' && (
          <div className="rounded-md border border-slate-300 bg-slate-50 p-5 text-sm font-semibold text-slate-700">
            Loading shared song...
          </div>
        )}

        {state.status === 'error' && (
          <div className="rounded-md border border-amber-300 bg-amber-50 p-5 text-amber-900">
            <div className="flex items-center gap-2 font-semibold">
              <AlertTriangle size={20} />
              Shared song not found or expired.
            </div>
            <p className="mt-2 text-sm">Ask the sender to share the song again if this link has expired.</p>
          </div>
        )}

        {state.status === 'ready' && (
          <>
            {duplicate && (
              <div className="fixed inset-0 z-[80] flex items-center justify-center bg-black/40 px-4 py-6 backdrop-blur-sm">
                <section className="w-full max-w-lg rounded-xl border border-slate-300 bg-white p-5 shadow-2xl">
                  {sharedDuplicateHasSameSongUuid(duplicate) ? (
                    <VersionAwareSharedSongDialog
                      duplicate={duplicate}
                      importing={importing}
                      onUpdateMine={() => void replaceExisting()}
                      onCompareVersions={() => setComparisonDuplicate(duplicate)}
                      onKeepCurrent={() => onKeepExisting(duplicate.existing)}
                      onImportCopy={() => { setDuplicate(null); void importCopy(); }}
                      onCancel={() => setDuplicate(null)}
                    />
                  ) : (
                    <GenericSharedSongDuplicateDialog
                      duplicate={duplicate}
                      importing={importing}
                      onKeepCurrent={() => onKeepExisting(duplicate.existing)}
                      onReplaceExisting={() => void replaceExisting()}
                      onImportCopy={() => { setDuplicate(null); void importCopy(); }}
                      onCancel={() => setDuplicate(null)}
                    />
                  )}
                </section>
              </div>
            )}

            {comparisonDuplicate && (
              <SharedSongComparisonScreen
                duplicate={comparisonDuplicate}
                onClose={() => setComparisonDuplicate(null)}
                onUpdateMine={() => void replaceExisting()}
                importing={importing}
              />
            )}

            <div className="grid gap-3 rounded-md border border-slate-200 bg-slate-50 p-4 sm:grid-cols-2">
              <div>
                <div className="text-xs font-semibold uppercase tracking-normal text-slate-500">Song title</div>
                <div className="mt-1 text-xl font-semibold">{state.song.title}</div>
              </div>
              <div>
                <div className="text-xs font-semibold uppercase tracking-normal text-slate-500">Artist</div>
                <div className="mt-1 text-xl font-semibold">{state.song.artist || 'Unknown artist'}</div>
              </div>
              <div>
                <div className="text-xs font-semibold uppercase tracking-normal text-slate-500">Key</div>
                <div className="mt-1 font-semibold">{state.song.key || '-'}</div>
              </div>
              <div>
                <div className="text-xs font-semibold uppercase tracking-normal text-slate-500">Capo</div>
                <div className="mt-1 font-semibold">{state.song.capo ?? 0}</div>
              </div>
              {state.song.bpm ? (
                <div>
                  <div className="text-xs font-semibold uppercase tracking-normal text-slate-500">BPM</div>
                  <div className="mt-1 font-semibold">{state.song.bpm}</div>
                </div>
              ) : null}
            </div>

            <div>
              <div className="mb-2 text-sm font-semibold text-slate-700">Chart preview</div>
              <pre className="max-h-[45vh] overflow-auto rounded-md border border-slate-300 bg-slate-950 p-4 font-mono text-sm leading-relaxed text-slate-50 whitespace-pre-wrap">
                {state.song.chart || 'No chart text included.'}
              </pre>
            </div>

            {message && (
              <div className={`rounded-md border px-3 py-2 text-sm font-semibold ${message.includes('successfully') ? 'border-teal-300 bg-teal-50 text-teal-800' : 'border-amber-300 bg-amber-50 text-amber-900'}`}>
                {message}
              </div>
            )}

            <div className="flex flex-wrap justify-end gap-2">
              <button className="secondary-button" type="button" onClick={onCancel} disabled={importing}>
                Cancel
              </button>
              <button className="primary-button" type="button" onClick={() => void importSong()} disabled={importing}>
                {importing ? 'Importing...' : 'Import to Library'}
              </button>
            </div>
          </>
        )}
      </section>
    </main>
  );
}

function VersionAwareSharedSongDialog({
  duplicate,
  importing,
  onUpdateMine,
  onCompareVersions,
  onKeepCurrent,
  onImportCopy,
  onCancel
}: {
  duplicate: SharedSongDuplicate;
  importing: boolean;
  onUpdateMine: () => void;
  onCompareVersions: () => void;
  onKeepCurrent: () => void;
  onImportCopy: () => void;
  onCancel: () => void;
}) {
  const comparison = compareSongVersions(duplicate.existing, duplicate.incoming);
  const localVersion = normalizeSongVersion(duplicate.existing.version);
  const incomingVersion = normalizeSongVersion(duplicate.incoming.version);

  if (comparison === 'incoming-newer') {
    return (
      <>
        <h2 className="text-xl font-semibold text-slate-950">Update Available</h2>
        <div className="mt-4 grid gap-2 rounded-md border border-teal-200 bg-teal-50 p-4 text-sm text-teal-950">
          <div className="text-lg font-semibold">{duplicate.incoming.title}</div>
          <div>Your Version: {localVersion}</div>
          <div>Incoming Version: {incomingVersion}</div>
          <p>A newer version of this song is available.</p>
        </div>
        <div className="mt-5 grid gap-2 sm:grid-cols-2">
          <button className="primary-button" type="button" disabled={importing} onClick={onUpdateMine}>
            Update Mine
          </button>
          <button className="secondary-button" type="button" disabled={importing} onClick={onCompareVersions}>
            Compare Versions
          </button>
          <button className="secondary-button" type="button" disabled={importing} onClick={onKeepCurrent}>
            Keep Current
          </button>
          <button className="secondary-button" type="button" disabled={importing} onClick={onImportCopy}>
            Import as Copy
          </button>
          <button className="secondary-button sm:col-span-2" type="button" disabled={importing} onClick={onCancel}>
            Cancel
          </button>
        </div>
      </>
    );
  }

  if (comparison === 'same-version') {
    return (
      <>
        <h2 className="text-xl font-semibold text-slate-950">You already have this version.</h2>
        <SharedSongVersionSummary duplicate={duplicate} />
        <div className="mt-5 grid gap-2 sm:grid-cols-3">
          <button className="primary-button" type="button" disabled={importing} onClick={onKeepCurrent}>
            Open Existing
          </button>
          <button className="secondary-button" type="button" disabled={importing} onClick={onImportCopy}>
            Import as Copy
          </button>
          <button className="secondary-button" type="button" disabled={importing} onClick={onCancel}>
            Cancel
          </button>
        </div>
      </>
    );
  }

  return (
    <>
      <h2 className="text-xl font-semibold text-slate-950">Your copy is newer than the shared version.</h2>
      <SharedSongVersionSummary duplicate={duplicate} />
      <div className="mt-5 grid gap-2 sm:grid-cols-3">
        <button className="primary-button" type="button" disabled={importing} onClick={onKeepCurrent}>
          Keep Mine
        </button>
        <button className="secondary-button" type="button" disabled={importing} onClick={onImportCopy}>
          Import as Copy
        </button>
        <button className="secondary-button" type="button" disabled={importing} onClick={onCancel}>
          Cancel
        </button>
      </div>
    </>
  );
}

function SharedSongVersionSummary({ duplicate }: { duplicate: SharedSongDuplicate }) {
  return (
    <div className="mt-4 grid gap-3 rounded-md border border-slate-200 bg-slate-50 p-3 text-sm">
      <div>
        <div className="text-xs font-semibold uppercase tracking-normal text-slate-500">Current song</div>
        <div className="font-semibold text-slate-950">{duplicate.existing.title}</div>
        <div className="text-slate-600">{duplicate.existing.artist || 'Unknown artist'}</div>
        <div className="mt-1 text-xs text-slate-500">Version {normalizeSongVersion(duplicate.existing.version)}</div>
      </div>
      <div>
        <div className="text-xs font-semibold uppercase tracking-normal text-slate-500">Incoming song</div>
        <div className="font-semibold text-slate-950">{duplicate.incoming.title}</div>
        <div className="text-slate-600">{duplicate.incoming.artist || 'Unknown artist'}</div>
        <div className="mt-1 text-xs text-slate-500">Version {normalizeSongVersion(duplicate.incoming.version)}</div>
      </div>
    </div>
  );
}

function GenericSharedSongDuplicateDialog({
  duplicate,
  importing,
  onKeepCurrent,
  onReplaceExisting,
  onImportCopy,
  onCancel
}: {
  duplicate: SharedSongDuplicate;
  importing: boolean;
  onKeepCurrent: () => void;
  onReplaceExisting: () => void;
  onImportCopy: () => void;
  onCancel: () => void;
}) {
  return (
    <>
      <h2 className="text-xl font-semibold text-slate-950">This song already exists in your library.</h2>
      <div className="mt-4 grid gap-3 rounded-md border border-slate-200 bg-slate-50 p-3 text-sm">
        <div>
          <div className="text-xs font-semibold uppercase tracking-normal text-slate-500">Existing song</div>
          <div className="font-semibold text-slate-950">{duplicate.existing.title}</div>
          <div className="text-slate-600">{duplicate.existing.artist || 'Unknown artist'}</div>
        </div>
        <div>
          <div className="text-xs font-semibold uppercase tracking-normal text-slate-500">Shared song</div>
          <div className="font-semibold text-slate-950">{duplicate.incoming.title}</div>
          <div className="text-slate-600">{duplicate.incoming.artist || 'Unknown artist'}</div>
        </div>
        <div className="text-xs text-slate-500">
          Match: {duplicate.matchType === 'shareId' ? 'same shared song link' : 'matching title and artist'}
        </div>
      </div>
      <div className="mt-5 grid gap-2 sm:grid-cols-2">
        <button className="primary-button" type="button" disabled={importing} onClick={onKeepCurrent}>
          Keep Current
        </button>
        <button className="secondary-button" type="button" disabled={importing} onClick={onReplaceExisting}>
          Replace Existing
        </button>
        <button className="secondary-button" type="button" disabled={importing} onClick={onImportCopy}>
          Import as Copy
        </button>
        <button className="secondary-button" type="button" disabled={importing} onClick={onCancel}>
          Cancel
        </button>
      </div>
    </>
  );
}

function SharedSongComparisonScreen({
  duplicate,
  onClose,
  onUpdateMine,
  importing
}: {
  duplicate: SharedSongDuplicate;
  onClose: () => void;
  onUpdateMine: () => void;
  importing: boolean;
}) {
  return (
    <div className="fixed inset-0 z-[90] overflow-auto bg-slate-100 px-4 py-6 text-slate-950 sm:px-6">
      <section className="mx-auto grid max-w-6xl gap-4 rounded-xl border border-slate-300 bg-white p-5 shadow-2xl">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="text-sm font-semibold uppercase tracking-normal text-teal-700">Compare Versions</p>
            <h2 className="mt-1 text-2xl font-semibold">{duplicate.incoming.title}</h2>
          </div>
          <div className="flex flex-wrap gap-2">
            <button className="secondary-button" type="button" onClick={onClose}>
              Back
            </button>
            <button className="primary-button" type="button" disabled={importing} onClick={onUpdateMine}>
              Update Mine
            </button>
          </div>
        </div>
        <div className="grid gap-4 lg:grid-cols-2">
          <SongVersionPanel label="Current song" song={duplicate.existing} />
          <SongVersionPanel label="Incoming song" song={duplicate.incoming} />
        </div>
      </section>
    </div>
  );
}

function SongVersionPanel({ label, song }: { label: string; song: Song }) {
  return (
    <section className="grid gap-3 rounded-lg border border-slate-200 bg-slate-50 p-4">
      <div>
        <div className="text-xs font-semibold uppercase tracking-normal text-slate-500">{label}</div>
        <div className="mt-1 text-lg font-semibold text-slate-950">Version {normalizeSongVersion(song.version)}</div>
      </div>
      <SongCompareField label="Title" value={song.title} />
      <SongCompareField label="Artist" value={song.artist || 'Unknown artist'} />
      <div className="grid grid-cols-3 gap-2">
        <SongCompareField label="Key" value={song.key || '-'} />
        <SongCompareField label="Capo" value={String(song.capo ?? 0)} />
        <SongCompareField label="BPM" value={song.bpm ? String(song.bpm) : '-'} />
      </div>
      <div>
        <div className="mb-1 text-xs font-semibold uppercase tracking-normal text-slate-500">Chart</div>
        <pre className="max-h-[55vh] overflow-auto rounded-md border border-slate-300 bg-slate-950 p-3 font-mono text-sm leading-relaxed text-slate-50 whitespace-pre-wrap">
          {song.chart || 'No chart text included.'}
        </pre>
      </div>
    </section>
  );
}

function SongCompareField({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div className="text-xs font-semibold uppercase tracking-normal text-slate-500">{label}</div>
      <div className="mt-1 font-semibold text-slate-950">{value}</div>
    </div>
  );
}

const helpSections = [
  {
    title: 'Getting Started',
    body: 'OpenStage stores songs locally for offline use. Start in Library, import or add songs, then use Stage for live performance.',
    steps: ['Import a few songs or create a new song.', 'Open a song from Library to edit it.', 'Use Stage when you are ready to rehearse or perform.']
  },
  {
    title: 'Importing Songs',
    body: 'Use Import for ChordPro files, OnSong archives, JSON/CSV backups, folders, or pasted webpage charts.',
    steps: ['Open Import.', 'Choose Paste Webpage Chart, Select files, or Select folder.', 'Preview when available, then save or import.']
  },
  {
    title: 'Editing Songs',
    body: 'The Song Editor is chart-first. Song Details stay collapsed so lyrics and chords are easy to reach.',
    steps: ['Click a song in Library.', 'Edit the chart text directly.', 'Use Full Screen Editor for a larger writing area.', 'Save to return to your previous screen.']
  },
  {
    title: 'Stage Mode',
    body: 'Stage Mode is the low-distraction performance view. Library, Setlists, Format, and More open as overlays without leaving Stage.',
    steps: ['Open a song.', 'Choose Stage.', 'Tap the chart to reveal controls.', 'Use Previous/Next, swipe, or a pedal to change songs.']
  },
  {
    title: 'Setlists',
    body: 'Build named setlists, reorder songs, save them, and run them in Stage so navigation stays inside the setlist.',
    steps: ['Open Setlist.', 'Enter a setlist name.', 'Add songs and drag or move them into order.', 'Save Setlist, then Run in Stage.']
  },
  {
    title: 'Autoscroll',
    body: 'Autoscroll can use manual duration, BPM estimates, or manual speed. The floating scroll button starts and pauses scrolling.',
    steps: ['In Stage, tap the scroll button to start or pause.', 'Press and hold the scroll button for quick speed controls.', 'Use Format > Scroll for detailed settings.']
  },
  {
    title: 'Harmony Cues',
    body: 'Harmony cues mark backing vocal words without changing the original chart style.',
    steps: ['In the editor, select lyric text and click Mark Harmony.', 'In Stage, select lyric text and use the Harmony action bar.', 'Use Format > Harmony to change color, underline, icon, and visibility.']
  },
  {
    title: 'Formatting',
    body: 'Stage formatting is device/profile based, so desktop, iPhone, iPad, and prompter screens can have different defaults.',
    steps: ['Open Stage.', 'Tap Format.', 'Choose Document, Format, Chords, Harmony, Sections, Display, Scroll, or External.', 'Apply or save a Display Profile for the current device.']
  },
  {
    title: 'Reference Audio',
    body: 'Each song can store a reference audio URL for rehearsal while editing.',
    steps: ['Open a song in the editor.', 'Expand Reference Audio.', 'Paste a direct MP3, M4A, WAV, OGG, or WebM URL for the mini-player.', 'YouTube or music-service links are saved as external reference links.']
  },
  {
    title: 'Backup / Restore',
    body: 'Use backups before major imports or device changes. Backups include songs, setlists, settings, and reference audio URLs.',
    steps: ['Open Settings.', 'Export a local backup file.', 'Use Restore Backup to load it on another device or after a reset.']
  },
  {
    title: 'Mobile / iPad Tips',
    body: 'On phones, use the hamburger menu for navigation. In Stage, controls auto-hide so the chart has more room.',
    steps: ['Use the iPhone Display Profile for smaller text and wrapping.', 'Use Show Chords off for vocalist-only views.', 'On iPad, Add to Home Screen for a more app-like PWA experience.']
  }
];

const quickHelpTasks = [
  { title: 'Import a song', steps: ['Open Import.', 'Drop files, select files, or paste webpage chart text.', 'Review the summary, then open the song from Library.'] },
  { title: 'Edit lyrics/chords', steps: ['Open Library.', 'Click a song.', 'Edit the chart text.', 'Click Save.'] },
  { title: 'Mark harmony', steps: ['Select lyric text in the editor or Stage.', 'Click Mark Harmony.', 'Confirm the change if prompted.'] },
  { title: 'Build a setlist', steps: ['Open Setlist.', 'Name the setlist.', 'Add songs.', 'Reorder songs.', 'Click Save Setlist.'] },
  { title: 'Start Stage Mode', steps: ['Select a song or run a saved setlist.', 'Open Stage.', 'Tap the chart to show or hide controls.'] },
  { title: 'Adjust scroll speed', steps: ['In Stage, press and hold the floating scroll button.', 'Move the slider or tap a preset.', 'Release and keep performing.'] },
  { title: 'Add reference audio', steps: ['Open a song in the editor.', 'Expand Reference Audio.', 'Paste a direct playable audio URL.', 'Save the song.'] }
];

function HelpView() {
  return (
    <main className="min-h-[calc(100vh-105px)] p-3 sm:p-4">
      <div className="mx-auto grid max-w-6xl gap-5">
        <section className="rounded-md border border-slate-200 bg-white p-4 shadow-sm sm:p-6">
          <div className="flex flex-wrap items-start gap-3">
            <div className="grid h-11 w-11 place-items-center rounded-md bg-teal-700 text-white">
              <HelpCircle size={24} />
            </div>
            <div className="min-w-0 flex-1">
              <h2 className="text-2xl font-semibold text-slate-950">OpenStage Help</h2>
              <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600">
                Simple instructions for importing songs, editing charts, building setlists, and using Stage Mode during rehearsal or live performance.
              </p>
            </div>
          </div>
        </section>

        <section className="grid gap-3 rounded-md border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
          <div>
            <h3 className="text-lg font-semibold text-slate-950">Quick Steps</h3>
            <p className="mt-1 text-sm text-slate-600">Common tasks, kept short.</p>
          </div>
          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
            {quickHelpTasks.map((task) => (
              <article key={task.title} className="rounded-md border border-slate-200 bg-slate-50 p-3">
                <h4 className="font-semibold text-slate-950">{task.title}</h4>
                <ol className="mt-2 list-decimal space-y-1 pl-5 text-sm leading-6 text-slate-700">
                  {task.steps.map((step) => <li key={step}>{step}</li>)}
                </ol>
              </article>
            ))}
          </div>
        </section>

        <section className="grid gap-3 md:grid-cols-2">
          {helpSections.map((section) => (
            <article key={section.title} className="rounded-md border border-slate-200 bg-white p-4 shadow-sm">
              <h3 className="text-lg font-semibold text-slate-950">{section.title}</h3>
              <p className="mt-2 text-sm leading-6 text-slate-600">{section.body}</p>
              <ol className="mt-3 list-decimal space-y-1 pl-5 text-sm leading-6 text-slate-700">
                {section.steps.map((step) => <li key={step}>{step}</li>)}
              </ol>
            </article>
          ))}
        </section>
      </div>
    </main>
  );
}

function RemoteReceiverApp() {
  const [payload, setPayload] = useState<RemoteReceiverPayload | null>(null);
  const [testPattern, setTestPattern] = useState<RemoteReceiverTestPatternPayload | null>(null);
  const [status, setStatus] = useState<RemoteDisplayStatus>('connecting');
  const [relayUrl, setRelayUrl] = useState(() => getRemoteDisplayUrl());
  const [connectionKey, setConnectionKey] = useState(0);
  const [lastMessageAt, setLastMessageAt] = useState('');
  const [viewport, setViewport] = useState(() => ({ width: window.innerWidth, height: window.innerHeight }));
  const [scrollMetrics, setScrollMetrics] = useState<ReceiverScrollMetrics>({ scrollHeight: 0, clientHeight: 0, scrollTop: 0, progress: 0 });
  const [hostedRoomCode, setHostedRoomCode] = useState(() => {
    const storedCode = getHostedReceiverRoomCode();
    return /^[A-Z0-9]{8}$/.test(storedCode) ? storedCode : '';
  });
  const [hostedError, setHostedError] = useState('');
  const [receiverName, setReceiverName] = useState(() => getReceiverDisplayName());
  const [receiverNameDraft, setReceiverNameDraft] = useState(() => getReceiverDisplayName() || 'FireTV Receiver');
  const [renamingReceiver, setRenamingReceiver] = useState(false);
  const [receiverSettingsOpen, setReceiverSettingsOpen] = useState(false);
  const [receiverDiagnosticsVisible, setReceiverDiagnosticsVisible] = useState(false);
  const [wakeLockStatus, setWakeLockStatus] = useState<'active' | 'unsupported' | 'error' | 'released'>('released');
  const receiver = normalizeReceiverDisplaySettings(testPattern?.receiver ?? payload?.receiver);
  const diagnosticsForcedByUrl = new URLSearchParams(window.location.search).get('diagnostics') === '1';
  const useLocalRelay = shouldUseLocalReceiverRelay();
  const showDiagnostics = diagnosticsForcedByUrl || receiver.showDiagnostics || receiverDiagnosticsVisible;

  useEffect(() => {
    const resize = () => setViewport({ width: window.innerWidth, height: window.innerHeight });
    resize();
    window.addEventListener('resize', resize);
    window.addEventListener('orientationchange', resize);
    return () => {
      window.removeEventListener('resize', resize);
      window.removeEventListener('orientationchange', resize);
    };
  }, []);

  useEffect(() => {
    if (!useLocalRelay) return;
    const connection = connectRemoteDisplay({
      role: 'display',
      onStatus: setStatus,
      onMessage: (message) => {
        if (message.type === 'receiver-state') {
          setPayload(message.payload);
          setTestPattern(message.payload.receiver.showTestPattern ? { receiver: message.payload.receiver, updatedAt: message.payload.updatedAt } : null);
          setLastMessageAt(new Date().toLocaleTimeString());
        }
        if (message.type === 'receiver-test-pattern') {
          setTestPattern(message.payload);
          setLastMessageAt(new Date().toLocaleTimeString());
        }
      }
    });
    return () => connection.close();
  }, [connectionKey, useLocalRelay]);

  useEffect(() => {
    if (useLocalRelay || hostedRoomCode) return;
    let cancelled = false;
    const ensurePairingCode = async () => {
      try {
        const room = await createHostedReceiverRoom(receiverName || 'FireTV Receiver');
        if (cancelled) return;
        setHostedRoomCode(room.roomCode);
        setHostedError('');
      } catch (error) {
        if (cancelled) return;
        setHostedError(error instanceof Error ? error.message : String(error));
      }
    };
    void ensurePairingCode();
    return () => {
      cancelled = true;
    };
  }, [hostedRoomCode, receiverName, useLocalRelay]);

  useEffect(() => {
    if (useLocalRelay || !receiverName || !hostedRoomCode) return;
    let cancelled = false;
    let subscription: ReturnType<typeof subscribeHostedReceiverRoom> | null = null;
    let heartbeatId: number | null = null;

    const applyMessage = (message: Awaited<ReturnType<typeof fetchHostedReceiverRoomState>>['message'], lastUpdatedAt: string) => {
      if (!message) return;
      if (message.type === 'receiver-state') {
        setPayload(message.payload);
        setTestPattern(message.payload.receiver.showTestPattern ? { receiver: message.payload.receiver, updatedAt: message.payload.updatedAt } : null);
        setLastMessageAt(lastUpdatedAt || new Date().toLocaleTimeString());
      }
      if (message.type === 'receiver-test-pattern') {
        setTestPattern(message.payload);
        setLastMessageAt(lastUpdatedAt || new Date().toLocaleTimeString());
      }
    };

    const start = async () => {
      try {
        setStatus('connecting');
        const room = await createHostedReceiverRoom(receiverName);
        if (cancelled) return;
        setHostedRoomCode(room.roomCode);
        setHostedError('');
        void updateReceiverRegistration(room.roomCode, receiverName, true);
        heartbeatId = window.setInterval(() => {
          void updateReceiverRegistration(room.roomCode, receiverName, true);
        }, 30000);
        const state = await fetchHostedReceiverRoomState(room.roomCode);
        if (cancelled) return;
        applyMessage(state.message, state.lastUpdatedAt);
        subscription = subscribeHostedReceiverRoom({
          roomCode: room.roomCode,
          role: 'display',
          onStatus: (nextStatus, detail) => {
            setStatus(nextStatus);
            setHostedError(nextStatus === 'error' ? detail || 'Supabase receiver connection failed.' : '');
          },
          onMessage: (message) => {
            applyMessage(message, new Date().toISOString());
          }
        });
      } catch (error) {
        if (cancelled) return;
        setStatus('error');
        setHostedError(error instanceof Error ? error.message : String(error));
      }
    };

    void start();
    return () => {
      cancelled = true;
      if (heartbeatId !== null) window.clearInterval(heartbeatId);
      subscription?.close();
    };
  }, [connectionKey, hostedRoomCode, receiverName, useLocalRelay]);

  useEffect(() => {
    if (useLocalRelay) return;
    const reconnect = () => {
      if (document.visibilityState === 'visible' && navigator.onLine !== false) {
        setConnectionKey((key) => key + 1);
      }
    };
    window.addEventListener('online', reconnect);
    document.addEventListener('visibilitychange', reconnect);
    return () => {
      window.removeEventListener('online', reconnect);
      document.removeEventListener('visibilitychange', reconnect);
    };
  }, [useLocalRelay]);

  useEffect(() => {
    if (useLocalRelay) return;
    let wakeLock: any = null;
    let cancelled = false;

    const requestWakeLock = async () => {
      const wakeLockApi = (navigator as any).wakeLock;
      if (!wakeLockApi?.request) {
        setWakeLockStatus('unsupported');
        return;
      }
      try {
        wakeLock = await wakeLockApi.request('screen');
        if (cancelled) {
          void wakeLock?.release?.();
          return;
        }
        setWakeLockStatus('active');
        wakeLock.addEventListener?.('release', () => {
          if (!cancelled) setWakeLockStatus('released');
        });
      } catch {
        if (!cancelled) setWakeLockStatus('error');
      }
    };

    const handleVisibility = () => {
      if (document.visibilityState === 'visible') void requestWakeLock();
    };

    void requestWakeLock();
    document.addEventListener('visibilitychange', handleVisibility);
    return () => {
      cancelled = true;
      document.removeEventListener('visibilitychange', handleVisibility);
      void wakeLock?.release?.();
    };
  }, [useLocalRelay]);

  function saveReceiverRelayUrl() {
    saveRemoteDisplayUrl(relayUrl.trim());
    setStatus('connecting');
    setConnectionKey((key) => key + 1);
  }

  function resetReceiverPairing() {
    resetHostedReceiverRoomCode();
    setHostedRoomCode('');
    setHostedError('');
    setPayload(null);
    setTestPattern(null);
    setLastMessageAt('');
    setStatus('connecting');
    setReceiverSettingsOpen(false);
    setConnectionKey((key) => key + 1);
  }

  function saveReceiverName() {
    const nextName = saveReceiverDisplayName(receiverNameDraft);
    setReceiverName(nextName);
    setReceiverNameDraft(nextName);
    setRenamingReceiver(false);
    if (hostedRoomCode) {
      void updateReceiverRegistration(hostedRoomCode, nextName, true);
    }
    setConnectionKey((key) => key + 1);
  }

  if (!useLocalRelay && !receiverName) {
    return (
      <main className="grid h-screen w-screen place-items-center overflow-hidden bg-black p-8 text-center text-slate-100">
        <section className="grid w-full max-w-xl gap-5 rounded-md border border-slate-700 bg-slate-900/85 p-6 text-left">
          <div>
            <div className="text-5xl font-bold leading-tight">Name this display</div>
            <div className="mt-3 text-xl text-slate-300">This name will appear on the iPad when choosing a receiver.</div>
          </div>
          <label className="grid gap-2 text-lg font-semibold">
            Display Name
            <input
              className="rounded-md border border-slate-600 bg-black px-4 py-4 text-2xl text-white"
              value={receiverNameDraft}
              placeholder="FireTV Receiver"
              onChange={(event) => setReceiverNameDraft(event.target.value)}
              autoFocus
            />
          </label>
          <button className="rounded-md bg-teal-700 px-5 py-4 text-xl font-semibold text-white" type="button" onClick={saveReceiverName}>
            Save
          </button>
        </section>
      </main>
    );
  }

  if (!payload && !testPattern) {
    return (
      <main className="grid h-screen w-screen place-items-center overflow-hidden bg-black p-8 text-center text-slate-100">
        <section className="grid max-w-2xl gap-5">
          <div>
            <div className="text-6xl font-bold leading-tight">OpenStage Receiver</div>
            <div className="mt-4 text-3xl text-slate-300">Waiting for iPad controller</div>
          </div>
          <div className="grid gap-3 rounded-md border border-slate-700 bg-slate-900/80 p-4 text-left text-xl text-slate-200">
            <div className="flex items-center justify-between gap-3">
              <span>{useLocalRelay ? 'WebSocket' : 'Supabase Realtime'}</span>
              <span className={`rounded-full border px-3 py-1 text-sm font-semibold ${remoteDisplayStatusClass(status)}`}>
                {remoteDisplayStatusLabel(status)}
              </span>
            </div>
            {useLocalRelay && (
              <>
                <label className="grid gap-1 text-sm">
                  <span className="font-semibold text-slate-100">Relay address</span>
                  <input
                    className="rounded-md border border-slate-600 bg-black px-3 py-3 font-mono text-slate-100"
                    value={relayUrl}
                    placeholder="wss://192.168.68.125:8788"
                    onChange={(event) => setRelayUrl(event.target.value)}
                  />
                </label>
                <button className="rounded-md bg-teal-700 px-4 py-3 text-base font-semibold text-white" type="button" onClick={saveReceiverRelayUrl}>
                  Save and Reconnect
                </button>
              </>
            )}
            {!useLocalRelay && (
              <>
                <div className="rounded-md border border-teal-300/30 bg-teal-300/10 p-4 text-center">
                  <div className="text-xl font-semibold text-white">{receiverName}</div>
                  <div className="text-sm font-semibold uppercase tracking-wide text-teal-100">Pairing Code</div>
                  <div className="mt-2 font-mono text-6xl font-bold tracking-[0.18em] text-white">{hostedRoomCode || '...'}</div>
                </div>
                {renamingReceiver ? (
                  <div className="grid gap-2 rounded-md border border-slate-700 bg-black/30 p-3">
                    <label className="grid gap-1 text-sm">
                      Rename Receiver
                      <input className="rounded-md border border-slate-600 bg-black px-3 py-3 text-slate-100" value={receiverNameDraft} onChange={(event) => setReceiverNameDraft(event.target.value)} />
                    </label>
                    <button className="rounded-md bg-teal-700 px-4 py-3 text-base font-semibold text-white" type="button" onClick={saveReceiverName}>
                      Save Name
                    </button>
                  </div>
                ) : (
                  <button className="rounded-md border border-slate-600 bg-slate-800 px-4 py-3 text-base font-semibold text-slate-100" type="button" onClick={() => setRenamingReceiver(true)}>
                    Rename Receiver
                  </button>
                )}
                <button className="rounded-md border border-slate-600 bg-slate-800 px-4 py-3 text-base font-semibold text-slate-100" type="button" onClick={resetReceiverPairing}>
                  Reset Receiver Pairing
                </button>
              </>
            )}
            {hostedError && <div className="rounded-md border border-red-400/40 bg-red-950/40 p-2 text-sm text-red-100">{hostedError}</div>}
            <div className="text-sm text-slate-400">{useLocalRelay ? 'Local relay fallback active.' : 'Enter this code in OpenStage FireTV Receiver settings.'}</div>
          </div>
        </section>
      </main>
    );
  }

  return (
    <main className="relative h-screen w-screen overflow-hidden bg-black text-white">
      <ReceiverCanvas settings={receiver} viewport={viewport} backgroundColor={payload?.visualTheme?.background ?? (payload ? getReceiverVisualTheme(scaleReceiverPerformanceState(payload.performance, receiver, payload.typography), receiver).background : undefined)}>
        {testPattern ? (
          <ReceiverTestPattern settings={receiver} viewport={viewport} status={status} lastMessageAt={lastMessageAt} />
        ) : payload ? (
          <ReceiverSong payload={payload} viewport={viewport} onMetricsChange={setScrollMetrics} />
        ) : null}
      </ReceiverCanvas>
      {showDiagnostics && payload && (
        <ReceiverDiagnosticsOverlay
          payload={payload}
          settings={receiver}
          viewport={viewport}
          status={status}
          relayUrl={useLocalRelay ? (relayUrl || getRemoteDisplayUrl()) : `supabase:${hostedRoomCode || '-'}`}
          metrics={scrollMetrics}
          forcedByUrl={diagnosticsForcedByUrl}
          wakeLockStatus={wakeLockStatus}
        />
      )}
      {!useLocalRelay && (
        <>
          <button
            className="fixed right-2 top-2 z-50 flex h-9 w-9 items-center justify-center rounded-full border border-white/10 bg-black/20 text-white/45 opacity-50 transition hover:bg-black/60 hover:text-white hover:opacity-100"
            type="button"
            aria-label="Receiver settings"
            onClick={() => setReceiverSettingsOpen(true)}
          >
            <Settings size={17} />
          </button>
          {receiverSettingsOpen && (
            <div className="fixed inset-0 z-[90] grid place-items-center bg-black/70 p-4">
              <div className="grid w-full max-w-md gap-3 rounded-md border border-white/15 bg-slate-950 p-4 text-left text-slate-100 shadow-2xl">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="text-lg font-semibold text-white">Receiver Settings</div>
                    <div className="text-sm text-slate-400">Use Silk fullscreen or install OpenStage as an app for the cleanest TV view.</div>
                  </div>
                  <button className="icon-button" type="button" aria-label="Close receiver settings" onClick={() => setReceiverSettingsOpen(false)}>
                    <X size={18} />
                  </button>
                </div>
                <label className="grid gap-1 text-sm font-semibold">
                  Rename Display
                  <input className="rounded-md border border-slate-600 bg-black px-3 py-3 text-slate-100" value={receiverNameDraft} onChange={(event) => setReceiverNameDraft(event.target.value)} />
                </label>
                <div className="flex flex-wrap gap-2">
                  <button className="stage-menu-button" type="button" onClick={saveReceiverName}>Save Name</button>
                  <button className="stage-menu-button" type="button" onClick={() => {
                    setReceiverSettingsOpen(false);
                    resetReceiverPairing();
                  }}>
                    Reset Pairing
                  </button>
                  <button className="stage-menu-button" type="button" onClick={() => setReceiverDiagnosticsVisible((visible) => !visible)}>
                    {showDiagnostics ? 'Hide Diagnostics' : 'Show Diagnostics'}
                  </button>
                  <button className="stage-menu-button" type="button" onClick={() => {
                    setPayload(null);
                    setTestPattern(null);
                    setReceiverSettingsOpen(false);
                  }}>
                    Exit Performance Mode
                  </button>
                </div>
                <div className="rounded-md border border-slate-700 bg-black/30 p-2 text-sm text-slate-300">
                  <div>Diagnostics: {showDiagnostics ? 'On' : 'Off'}</div>
                  <div>Wake Lock: {wakeLockStatus}</div>
                  <div>Pairing Code: <span className="font-mono">{hostedRoomCode || '-'}</span></div>
                </div>
              </div>
            </div>
          )}
        </>
      )}
    </main>
  );
}

function RemoteDisplayApp() {
  const [songs, setSongs] = useState<Song[]>([]);
  const [selectedSongId, setSelectedSongId] = useState('');
  const [receiverPayload, setReceiverPayload] = useState<RemoteReceiverPayload | null>(null);
  const [viewport, setViewport] = useState(() => ({ width: window.innerWidth, height: window.innerHeight }));
  const [missingSongId, setMissingSongId] = useState('');
  const [status, setStatus] = useState<RemoteDisplayStatus>('connecting');
  const [lastMessageAt, setLastMessageAt] = useState('');
  const [startupError, setStartupError] = useState('');
  const [relayUrl, setRelayUrl] = useState(() => getRemoteDisplayUrl());
  const [connectionKey, setConnectionKey] = useState(0);
  const displayState: PerformanceState = {
    ...defaultPerformanceState,
    activeProfile: 'prompter-display',
    portraitMode: true,
    stageTheme: 'standard-dark',
    theme: 'dark',
    documentTheme: 'dark-stage',
    documentThemesByProfile: {
      ...(defaultPerformanceState.documentThemesByProfile ?? {}),
      'prompter-display': 'dark-stage'
    },
    minimalStageMode: true
  };
  const songMap = useMemo(() => new Map(songs.map((song) => [song.id, song])), [songs]);
  const song = selectedSongId ? songMap.get(selectedSongId) : undefined;

  useEffect(() => {
    const resize = () => setViewport({ width: window.innerWidth, height: window.innerHeight });
    window.addEventListener('resize', resize);
    window.addEventListener('orientationchange', resize);
    return () => {
      window.removeEventListener('resize', resize);
      window.removeEventListener('orientationchange', resize);
    };
  }, []);

  useEffect(() => {
    let cancelled = false;
    db.songs
      .toArray()
      .then((storedSongs) => {
        if (!cancelled) setSongs(storedSongs.map(withSongDefaults));
      })
      .catch((error) => {
        const message = error instanceof Error ? error.message : String(error);
        reportError('Remote display song load failed', error);
        if (!cancelled) setStartupError(message);
        if (!cancelled) setStatus('error');
      });
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    const connection = connectRemoteDisplay({
      role: 'display',
      onStatus: setStatus,
      onMessage: (message) => {
        if (message.type === 'receiver-state') {
          setReceiverPayload(message.payload);
          setSelectedSongId(message.payload.song.id);
          setMissingSongId('');
          setLastMessageAt(new Date().toLocaleTimeString());
          return;
        }
        if (message.type !== 'song') return;
        setReceiverPayload(null);
        setSelectedSongId(message.songId);
        setMissingSongId('');
        setLastMessageAt(new Date().toLocaleTimeString());
      }
    });
    return () => connection.close();
  }, [connectionKey]);

  function saveDisplayRelayUrl() {
    saveRemoteDisplayUrl(relayUrl.trim());
    setStatus('connecting');
    setConnectionKey((key) => key + 1);
  }

  useEffect(() => {
    if (!selectedSongId || songMap.has(selectedSongId)) {
      setMissingSongId('');
      return;
    }
    setMissingSongId(selectedSongId);
  }, [selectedSongId, songMap]);

  const diagnostics = (
    <RemoteDisplayStatusStrip
      status={status}
      relayUrl={relayUrl}
      songCount={songs.length}
      selectedSongId={selectedSongId}
      lastMessageAt={lastMessageAt}
      error={startupError}
    />
  );

  if (receiverPayload) {
    const receiver = normalizeReceiverDisplaySettings(receiverPayload.receiver);
    return (
      <main className="relative h-screen w-screen overflow-hidden bg-black text-white">
        {diagnostics}
        <ReceiverCanvas settings={receiver} viewport={viewport} backgroundColor={receiverPayload.visualTheme?.background ?? getReceiverVisualTheme(scaleReceiverPerformanceState(receiverPayload.performance, receiver, receiverPayload.typography), receiver).background}>
          <ReceiverSong payload={receiverPayload} viewport={viewport} onMetricsChange={() => undefined} />
        </ReceiverCanvas>
      </main>
    );
  }

  if (!song) {
    return (
      <main className="grid min-h-screen w-screen place-items-center bg-black p-8 text-center text-slate-100">
        {diagnostics}
        <section className="max-w-2xl">
          <div className="text-5xl font-bold">OpenStage Display</div>
          <div className="mt-5 text-2xl text-slate-300">Waiting for iPad controller</div>
          <div className="mx-auto mt-8 grid max-w-xl gap-3 rounded-md border border-slate-700 bg-slate-900/70 p-4 text-left text-lg text-slate-300">
            <div className="flex items-center justify-between gap-3">
              <span>WebSocket</span>
              <span className={`rounded-full border px-3 py-1 text-sm font-semibold ${remoteDisplayStatusClass(status)}`}>
                {remoteDisplayStatusLabel(status)}
              </span>
            </div>
            <label className="grid gap-1 text-sm">
              <span className="font-semibold text-slate-200">Relay address</span>
              <input
                className="rounded-md border border-slate-600 bg-black px-3 py-2 font-mono text-slate-100"
                value={relayUrl}
                placeholder="wss://192.168.68.125:8788"
                onChange={(event) => setRelayUrl(event.target.value)}
              />
            </label>
            <button className="rounded-md bg-teal-700 px-4 py-2 text-sm font-semibold text-white" type="button" onClick={saveDisplayRelayUrl}>
              Save and Reconnect
            </button>
            {lastMessageAt && <div>Last message: {lastMessageAt}</div>}
            {missingSongId && <div>Song ID not found locally: {missingSongId}</div>}
            <div className="text-sm text-slate-400">Open this page on the Raspberry Pi display: /display</div>
          </div>
        </section>
      </main>
    );
  }

  return <RemoteDisplaySong song={song} state={displayState} diagnostics={diagnostics} />;
}

function RemoteDisplayStatusStrip({
  status,
  relayUrl,
  songCount,
  selectedSongId,
  lastMessageAt,
  error
}: {
  status: RemoteDisplayStatus;
  relayUrl: string;
  songCount: number;
  selectedSongId: string;
  lastMessageAt: string;
  error: string;
}) {
  return (
    <div className="fixed bottom-3 left-3 z-[80] max-w-[calc(100vw-1.5rem)] rounded-md border border-slate-700 bg-black/85 px-3 py-2 text-left text-xs leading-5 text-slate-200 shadow-xl">
      <div className="font-semibold text-white">OpenStage Display Debug</div>
      <div>route: {window.location.pathname}</div>
      <div>relay: {relayUrl || '-'}</div>
      <div>status: {remoteDisplayStatusLabel(status)}</div>
      <div>local songs: {songCount}</div>
      <div>selected song id: {selectedSongId || '-'}</div>
      <div>last message: {lastMessageAt || '-'}</div>
      {error && <div className="text-red-200">error: {error}</div>}
    </div>
  );
}

function RemoteDisplaySong({ song, state, diagnostics }: { song: Song; state: PerformanceState; diagnostics: React.ReactNode }) {
  const effectiveCapo = getEffectiveCapo(song, state);
  const lyricFontSize = getEffectiveLyricFontSize(state);
  const lineSpacing = getEffectiveLineSpacing(state);
  const headerFontSize = getEffectiveHeaderFontSize(state);
  const chordFontSize = getEffectiveChordFontSize(state);
  const documentTheme = getDocumentThemePreset(getEffectiveDocumentTheme(state));
  const stageFontFamily = resolveStageFontFamily(getEffectiveStageFontFamily(state));
  const chordFontFamily = getEffectiveUseMonospaceChords(state) ? 'Consolas, "Courier New", monospace' : stageFontFamily;
  const rendered = renderSong(song, {
    transpose: state.transpose,
    capo: effectiveCapo,
    showNashvilleNumbers: state.showNashvilleNumbers,
    songKey: song.performanceKey || song.key,
    activeProfile: state.activeProfile,
    lyricFontSize,
    lineSpacing,
    chordFontSize,
    headerFontSize,
    songTitleFontSize: getEffectiveSongTitleFontSize(state),
    songArtistFontSize: getEffectiveSongArtistFontSize(state),
    sectionFontSize: getEffectiveSectionFontSize(state),
    sectionSpacingBefore: getEffectiveSectionSpacingBefore(state),
    sectionSpacingAfter: getEffectiveSectionSpacingAfter(state),
    viewportWidth: window.innerWidth,
    displayMode: 'remote-display'
  });
  const songTitleStyle = buildSongDocumentTextStyle({
    size: getEffectiveSongTitleFontSize(state),
    color: getEffectiveSongTitleColor(state),
    bold: getEffectiveSongTitleBold(state),
    italic: getEffectiveSongTitleItalic(state),
    documentTheme,
    fallbackColor: documentTheme.text
  });
  const songArtistStyle = buildSongDocumentTextStyle({
    size: getEffectiveSongArtistFontSize(state),
    color: getEffectiveSongArtistColor(state),
    bold: getEffectiveSongArtistBold(state),
    italic: getEffectiveSongArtistItalic(state),
    documentTheme,
    fallbackColor: documentTheme.muted
  });

  return (
    <main
      className={`${getStageTheme(state.stageTheme).className} h-screen w-screen overflow-hidden`}
      style={{ background: documentTheme.background, color: documentTheme.text, fontFamily: stageFontFamily }}
    >
      {diagnostics}
      <article
        className="stage-chart h-full w-full overflow-hidden whitespace-pre-wrap px-[8vw] py-[6vh]"
        style={{
          fontSize: `${lyricFontSize}px`,
          lineHeight: 1.52,
          color: documentTheme.text,
          fontFamily: stageFontFamily
        }}
      >
        {rendered.lines.map((line, index) => (
          <ChordProDisplayLine
            key={`${line.raw}-${index}`}
            line={line}
            transpose={state.transpose}
            showNashville={state.showNashvilleNumbers}
            songKey={song.performanceKey || song.key}
            boldChords={getEffectiveBoldChords(state)}
            italicChords={getEffectiveItalicChords(state)}
            showChords={getEffectiveShowChords(state)}
            chordFontColor={getEffectiveChordFontColor(state)}
            chordHighlightColor={getEffectiveChordHighlightColor(state)}
            sectionFontSize={getEffectiveSectionFontSize(state)}
            sectionFontColor={getEffectiveSectionFontColor(state)}
            sectionBold={getEffectiveSectionBold(state)}
            sectionItalic={getEffectiveSectionItalic(state)}
            sectionUppercase={getEffectiveSectionUppercase(state)}
            sectionSpacingBefore={getEffectiveSectionSpacingBefore(state)}
            sectionSpacingAfter={getEffectiveSectionSpacingAfter(state)}
            songTitleStyle={songTitleStyle}
            songArtistStyle={songArtistStyle}
            showHarmonyCues={getEffectiveShowHarmonyCues(state)}
            harmonyTextColor={getEffectiveHarmonyTextColor(state)}
            harmonyIconColor={getEffectiveHarmonyIconColor(state)}
            harmonyItalic={getEffectiveHarmonyItalic(state)}
            harmonyUnderline={getEffectiveHarmonyUnderline(state)}
            harmonyIconVisible={getEffectiveHarmonyIconVisible(state)}
            displayPreference={song.displayPreference ?? 'inline'}
            lineIndex={index}
            chordFontSize={chordFontSize}
            chordFontFamily={chordFontFamily}
            lyricFontSize={lyricFontSize}
            lineSpacing={lineSpacing}
            chordVerticalOffset={getEffectiveChordVerticalOffset(state)}
            mobileReflowMode={false}
            showAnchorDebug={false}
            showHarmonyDebug={false}
          />
        ))}
      </article>
    </main>
  );
}

function ReceiverCanvas({
  settings,
  viewport,
  backgroundColor,
  children
}: {
  settings: ReceiverDisplaySettings;
  viewport: { width: number; height: number };
  backgroundColor?: string;
  children: React.ReactNode;
}) {
  const layout = calculateReceiverLayout(settings, viewport.width, viewport.height);
  return (
    <div className="absolute inset-0 h-screen w-screen overflow-hidden" style={{ background: backgroundColor ?? (settings.blackBackground ? '#000' : '#f8fafc') }}>
      <div
        className="absolute left-1/2 top-1/2 overflow-hidden"
        style={{
          width: `${layout.contentWidth}px`,
          height: `${layout.contentHeight}px`,
          transform: `translate(-50%, -50%) rotate(${layout.rotation}deg) scale(${layout.scale})`,
          transformOrigin: 'center center'
        }}
      >
        <div className="h-full w-full overflow-hidden" style={{ padding: `${settings.safeMargin}vmin`, boxSizing: 'border-box' }}>
          {children}
        </div>
      </div>
    </div>
  );
}

function ReceiverSong({
  payload,
  viewport,
  onMetricsChange
}: {
  payload: RemoteReceiverPayload;
  viewport: { width: number; height: number };
  onMetricsChange: (metrics: ReceiverScrollMetrics) => void;
}) {
  const receiver = normalizeReceiverDisplaySettings(payload.receiver);
  const state = scaleReceiverPerformanceState(payload.performance, receiver, payload.typography);
  const viewportRef = useRef<HTMLDivElement | null>(null);
  const contentRef = useRef<HTMLElement | null>(null);
  const [scrollMetrics, setScrollMetrics] = useState<ReceiverScrollMetrics>({ scrollHeight: 0, clientHeight: 0, scrollTop: 0, progress: 0 });
  const lyricFontSize = getEffectiveLyricFontSize(state);
  const lineSpacing = getEffectiveLineSpacing(state);
  const headerFontSize = getEffectiveHeaderFontSize(state);
  const chordFontSize = getEffectiveChordFontSize(state);
  const receiverVisual = payload.visualTheme ?? getReceiverVisualTheme(state, receiver);
  const documentTheme = { background: receiverVisual.background, text: receiverVisual.text, muted: receiverVisual.muted };
  const stageFontFamily = resolveStageFontFamily(getEffectiveStageFontFamily(state));
  const chordFontFamily = getEffectiveUseMonospaceChords(state) ? 'Consolas, "Courier New", monospace' : stageFontFamily;
  const rendered = renderSong(payload.song, {
    transpose: state.transpose,
    capo: payload.effectiveCapo,
    showNashvilleNumbers: state.showNashvilleNumbers,
    songKey: payload.song.performanceKey || payload.song.key,
    activeProfile: state.activeProfile,
    lyricFontSize,
    lineSpacing,
    chordFontSize,
    headerFontSize,
    songTitleFontSize: getEffectiveSongTitleFontSize(state),
    songArtistFontSize: getEffectiveSongArtistFontSize(state),
    sectionFontSize: getEffectiveSectionFontSize(state),
    sectionSpacingBefore: getEffectiveSectionSpacingBefore(state),
    sectionSpacingAfter: getEffectiveSectionSpacingAfter(state),
    viewportWidth: window.innerWidth,
    displayMode: receiver.displayMode
  });
  const songTitleStyle = buildSongDocumentTextStyle({
    size: getEffectiveSongTitleFontSize(state),
    color: getEffectiveSongTitleColor(state),
    bold: getEffectiveSongTitleBold(state),
    italic: getEffectiveSongTitleItalic(state),
    documentTheme,
    fallbackColor: documentTheme.text
  });
  const songArtistStyle = buildSongDocumentTextStyle({
    size: getEffectiveSongArtistFontSize(state),
    color: getEffectiveSongArtistColor(state),
    bold: getEffectiveSongArtistBold(state),
    italic: getEffectiveSongArtistItalic(state),
    documentTheme,
    fallbackColor: documentTheme.muted
  });
  const desiredProgress = clampNumber(payload.scrollProgress ?? 0, 0, 1);

  useLayoutEffect(() => {
    const viewportElement = viewportRef.current;
    const contentElement = contentRef.current;
    if (!viewportElement || !contentElement) return;
    const measureAndScroll = () => {
      const clientHeight = viewportElement.clientHeight;
      const scrollHeight = contentElement.scrollHeight;
      const maxScroll = Math.max(0, scrollHeight - clientHeight);
      const fallbackProgress = maxScroll > 0 ? clampNumber(payload.scrollTop / maxScroll, 0, 1) : 0;
      const progress = Number.isFinite(payload.scrollProgress) ? desiredProgress : fallbackProgress;
      const scrollTop = Math.round(progress * maxScroll);
      const nextMetrics = { scrollHeight, clientHeight, scrollTop, progress };
      setScrollMetrics(nextMetrics);
      onMetricsChange(nextMetrics);
    };
    measureAndScroll();
    const frameId = window.requestAnimationFrame(measureAndScroll);
    return () => window.cancelAnimationFrame(frameId);
  }, [
    desiredProgress,
    payload.scrollProgress,
    payload.scrollTop,
    payload.updatedAt,
    receiver.displayMode,
    receiver.fontScale,
    receiver.safeMargin,
    viewport.width,
    viewport.height,
    lyricFontSize,
    chordFontSize,
    lineSpacing,
    onMetricsChange
  ]);

  return (
    <div ref={viewportRef} className="relative h-full w-full overflow-hidden">
      <article
        ref={contentRef}
        className="font-chart w-full whitespace-pre-wrap"
        style={{
          transform: `translateY(-${Math.max(0, scrollMetrics.scrollTop)}px)`,
          transition: payload.autoscrollActive ? 'transform 140ms linear' : 'transform 90ms ease-out',
          willChange: 'transform',
          color: documentTheme.text,
          fontFamily: stageFontFamily,
          fontSize: `${lyricFontSize}px`,
          lineHeight: 1.52,
          paddingTop: 0,
          paddingBottom: `${Math.max(lyricFontSize * 4, viewport.height * 0.12)}px`
        }}
      >
        {rendered.lines.map((line, index) => (
          <ChordProDisplayLine
            key={`${line.raw}-${index}`}
            line={line}
            transpose={state.transpose}
            showNashville={state.showNashvilleNumbers}
            songKey={payload.song.performanceKey || payload.song.key}
            boldChords={getEffectiveBoldChords(state)}
            italicChords={getEffectiveItalicChords(state)}
            showChords={getEffectiveShowChords(state)}
            chordFontColor={receiverVisual.chordColor}
            chordHighlightColor={getEffectiveChordHighlightColor(state)}
            sectionFontSize={getEffectiveSectionFontSize(state)}
            sectionFontColor={receiverVisual.sectionColor}
            sectionBold={receiverVisual.sectionBold}
            sectionItalic={receiverVisual.sectionItalic}
            sectionUppercase={receiverVisual.sectionUppercase}
            sectionSpacingBefore={getEffectiveSectionSpacingBefore(state)}
            sectionSpacingAfter={getEffectiveSectionSpacingAfter(state)}
            songTitleStyle={songTitleStyle}
            songArtistStyle={songArtistStyle}
            showHarmonyCues={getEffectiveShowHarmonyCues(state)}
            harmonyTextColor={receiverVisual.harmonyTextColor}
            harmonyIconColor={receiverVisual.harmonyIconColor}
            harmonyItalic={getEffectiveHarmonyItalic(state)}
            harmonyUnderline={getEffectiveHarmonyUnderline(state)}
            harmonyIconVisible={getEffectiveHarmonyIconVisible(state)}
            displayPreference={payload.song.displayPreference ?? 'inline'}
            lineIndex={index}
            chordFontSize={chordFontSize}
            chordFontFamily={chordFontFamily}
            lyricFontSize={lyricFontSize}
            lineSpacing={lineSpacing}
            chordVerticalOffset={getEffectiveChordVerticalOffset(state)}
            mobileReflowMode={false}
            showAnchorDebug={false}
            showHarmonyDebug={false}
          />
        ))}
      </article>
    </div>
  );
}

function ReceiverTestPattern({
  settings,
  viewport,
  status,
  lastMessageAt
}: {
  settings: ReceiverDisplaySettings;
  viewport: { width: number; height: number };
  status: RemoteDisplayStatus;
  lastMessageAt: string;
}) {
  return (
    <div className="relative grid h-full w-full place-items-center overflow-hidden bg-black text-amber-100">
      <div className="absolute border-4 border-amber-300" style={{ inset: `${settings.safeMargin}vmin` }} />
      <div className="absolute inset-x-0 top-1/2 border-t border-amber-200/80" />
      <div className="absolute inset-y-0 left-1/2 border-l border-amber-200/80" />
      <div className="grid h-full w-full place-items-center border-[2vmin] border-sky-300 p-[5vmin]">
        <div className="grid gap-3 rounded-md bg-black/70 px-8 py-6 text-center text-[4vmin] font-bold leading-tight">
          <div>OPENSTAGE RECEIVER TEST</div>
          <div className="text-[0.5em] font-semibold text-amber-200">viewport {viewport.width} x {viewport.height}</div>
          <div className="text-[0.5em] font-semibold text-amber-200">mode {receiverDisplayModeLabel(settings.displayMode)}</div>
          <div className="text-[0.5em] font-semibold text-amber-200">rotation {receiverRotationLabel(settings.displayMode)}</div>
          <div className="text-[0.5em] font-semibold text-amber-200">connected {status === 'connected' ? 'yes' : 'no'} / last {lastMessageAt || '-'}</div>
        </div>
      </div>
    </div>
  );
}

function ReceiverDiagnosticsOverlay({
  payload,
  settings,
  viewport,
  status,
  relayUrl,
  metrics,
  forcedByUrl,
  wakeLockStatus
}: {
  payload: RemoteReceiverPayload;
  settings: ReceiverDisplaySettings;
  viewport: { width: number; height: number };
  status: RemoteDisplayStatus;
  relayUrl: string;
  metrics: ReceiverScrollMetrics;
  forcedByUrl: boolean;
  wakeLockStatus: 'active' | 'unsupported' | 'error' | 'released';
}) {
  const [, refresh] = useState(0);
  useEffect(() => {
    const timer = window.setInterval(() => refresh((value) => value + 1), 1000);
    return () => window.clearInterval(timer);
  }, []);
  const payloadTime = Date.parse(payload.updatedAt);
  const secondsSinceUpdate = Number.isFinite(payloadTime) ? Math.max(0, Math.round((Date.now() - payloadTime) / 1000)) : null;
  const themeName = payload.visualTheme?.stageTheme ?? payload.performance.stageTheme;
  const themeLabel = stageThemes.find((theme) => theme.name === themeName)?.label ?? themeName;

  return (
    <div className="pointer-events-none fixed right-3 top-3 z-[9999] grid max-w-[min(28rem,calc(100vw-1.5rem))] gap-1 rounded-md border border-white/20 bg-black/80 px-4 py-3 text-left text-[clamp(0.8rem,1.55vw,1.05rem)] leading-tight text-white shadow-2xl">
      <div className="mb-1 text-[1.05em] font-semibold">Receiver Diagnostics{forcedByUrl ? ' (URL)' : ''}</div>
      <div>Receiver: {remoteDisplayStatusLabel(status)}</div>
      <div>Song: {payload.song.title || '-'}</div>
      <div>Artist: {payload.song.artist || '-'}</div>
      <div>Display Mode: {receiverDisplayModeLabel(settings.displayMode)}</div>
      <div>FORMAT: {themeLabel}</div>
      <div>Viewport: {viewport.width} x {viewport.height}</div>
      <div>Scroll Height: {metrics.scrollHeight}</div>
      <div>Client Height: {metrics.clientHeight}</div>
      <div>Progress: {metrics.progress.toFixed(3)}</div>
      <div>ScrollTop: {metrics.scrollTop}</div>
      <div>Relay: <span className="font-mono">{relayUrl || '-'}</span></div>
      <div>Wake Lock: {wakeLockStatus}</div>
      <div>Last Payload: {payload.updatedAt || '-'}</div>
      <div>Seconds Since Update: {secondsSinceUpdate ?? '-'}</div>
    </div>
  );
}

function ImportSongsView({
  songs,
  onImport,
  onJsonCsvImport,
  onWebpageChartImport,
  onSharedSongCodeImport
}: {
  songs: Song[];
  onImport: (files: ImportCandidate[], strategy: DuplicateStrategy) => Promise<ImportSummary>;
  onJsonCsvImport: (file: File) => Promise<void>;
  onWebpageChartImport: (song: Song) => Promise<void>;
  onSharedSongCodeImport: (shareId: string) => void;
}) {
  const [strategy, setStrategy] = useState<DuplicateStrategy>('skip');
  const [pendingFiles, setPendingFiles] = useState<ImportCandidate[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [summary, setSummary] = useState<ImportSummary | null>(null);
  const [webpagePasteText, setWebpagePasteText] = useState('');
  const [webpagePreview, setWebpagePreview] = useState<WebpageChartImportPreview | null>(null);
  const [isSavingPaste, setIsSavingPaste] = useState(false);
  const [sharedSongCode, setSharedSongCode] = useState('');
  const [sharedSongCodeError, setSharedSongCodeError] = useState('');

  async function addFiles(files: File[]) {
    const accepted = files.filter((file) => isSupportedSongImportFileName(file.name));
    const candidates = await Promise.all(
      accepted.map(async (file) => {
        const fileName = file.webkitRelativePath || file.name;
        if (isOnSongArchiveFileName(file.name)) {
          return {
            fileName,
            bytes: await file.arrayBuffer()
          };
        }
        return {
          fileName,
          text: await file.text()
        };
      })
    );
    setPendingFiles((current) => [...current, ...candidates]);
  }

  async function runImport() {
    setIsImporting(true);
    try {
      const result = await onImport(pendingFiles, strategy);
      setSummary(result);
      setPendingFiles([]);
    } finally {
      setIsImporting(false);
    }
  }

  function previewWebpagePaste() {
    setWebpagePreview(parseWebpageChartText(webpagePasteText));
  }

  async function saveWebpagePaste() {
    if (!webpagePreview || webpagePreview.warnings.length > 0) return;
    setIsSavingPaste(true);
    try {
      await onWebpageChartImport(webpagePreview.song);
      setWebpagePasteText('');
      setWebpagePreview(null);
    } finally {
      setIsSavingPaste(false);
    }
  }

  function importSharedSongCode() {
    const code = sharedSongCode.trim();
    if (!code) {
      setSharedSongCodeError('Paste a shared song code first.');
      return;
    }
    setSharedSongCodeError('');
    onSharedSongCodeImport(code);
  }

  return (
    <main className="min-h-[calc(100vh-105px)] p-4">
      <div className="mx-auto grid max-w-6xl gap-4 lg:grid-cols-[1fr_340px]">
        <section className="grid gap-4">
          <div>
            <h2 className="text-xl font-semibold">Import Songs</h2>
            <p className="mt-1 text-sm text-slate-600">
              Import ChordPro files or OnSong .archive libraries with source chart text preserved for offline use.
            </p>
          </div>

          <section className="rounded-md border border-teal-200 bg-white p-4 shadow-sm">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <h3 className="text-lg font-semibold">Receive Song</h3>
                <p className="mt-1 text-sm text-slate-600">
                  Paste an OpenStage shared song code to import directly into this app storage.
                </p>
              </div>
            </div>
            <div className="mt-3 flex flex-col gap-2 sm:flex-row">
              <input
                className="input flex-1 font-mono"
                value={sharedSongCode}
                placeholder="Paste shared song code"
                onChange={(event) => {
                  setSharedSongCode(event.target.value);
                  if (sharedSongCodeError) setSharedSongCodeError('');
                }}
              />
              <button className="primary-button" type="button" onClick={importSharedSongCode}>
                  Receive Song
              </button>
            </div>
            {sharedSongCodeError && (
              <div className="mt-2 rounded border border-amber-300 bg-amber-50 px-3 py-2 text-sm font-semibold text-amber-900">
                {sharedSongCodeError}
              </div>
            )}
          </section>

          <section className="rounded-md border border-teal-200 bg-white p-4 shadow-sm">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <h3 className="text-lg font-semibold">Paste Webpage Chart</h3>
                <p className="mt-1 text-sm text-slate-600">
                  Paste copied song text from a webpage. OpenStage will remove common webpage clutter, detect metadata, and preserve chord-over-lyrics spacing.
                </p>
              </div>
              <button className="secondary-button" type="button" onClick={() => { setWebpagePasteText(''); setWebpagePreview(null); }}>
                Clear
              </button>
            </div>
            <textarea
              className="input mt-3 min-h-72 w-full font-mono text-sm leading-relaxed"
              placeholder={"Paste webpage song/chord text here...\n\nExample:\n3AM\nMatchbox 20\nCapo 1\nKey G\nBPM 108\n\nG        C\nShe says it's cold outside"}
              value={webpagePasteText}
              onChange={(event) => {
                setWebpagePasteText(event.target.value);
                if (webpagePreview) setWebpagePreview(null);
              }}
            />
            <div className="mt-3 flex flex-wrap gap-2">
              <button className="primary-button" type="button" onClick={previewWebpagePaste} disabled={!webpagePasteText.trim()}>
                Preview Webpage Chart
              </button>
              {webpagePreview && (
                <button className="primary-button" type="button" onClick={saveWebpagePaste} disabled={isSavingPaste || webpagePreview.warnings.length > 0}>
                  Save as Song
                </button>
              )}
            </div>
            {webpagePreview && (
              <section className="mt-4 grid gap-3 rounded-md border border-slate-200 bg-slate-50 p-4">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <h4 className="font-semibold">Preview</h4>
                    <p className="text-sm text-slate-600">
                      {webpagePreview.detectedFields.length ? `Detected: ${webpagePreview.detectedFields.join(', ')}` : 'No metadata detected.'}
                    </p>
                  </div>
                  <span className="rounded-full border border-slate-300 bg-white px-3 py-1 text-xs font-semibold text-slate-700">
                    Display: {webpagePreview.song.displayPreference === 'chords-over' ? 'Chords over lyrics' : 'Inline chords'}
                  </span>
                </div>
                <div className="grid gap-2 md:grid-cols-3">
                  <div className="rounded border border-slate-200 bg-white p-2">
                    <div className="text-xs font-semibold uppercase text-slate-500">Title</div>
                    <div className="font-semibold">{webpagePreview.song.title}</div>
                  </div>
                  <div className="rounded border border-slate-200 bg-white p-2">
                    <div className="text-xs font-semibold uppercase text-slate-500">Artist</div>
                    <div className="font-semibold">{webpagePreview.song.artist || '-'}</div>
                  </div>
                  <div className="rounded border border-slate-200 bg-white p-2">
                    <div className="text-xs font-semibold uppercase text-slate-500">Metadata</div>
                    <div className="text-sm">Key {webpagePreview.song.key || '-'} / Capo {webpagePreview.song.capo ?? 0} / BPM {webpagePreview.song.bpm || '-'}</div>
                    <div className="text-sm">Tuning {webpagePreview.song.tuning || '-'}</div>
                  </div>
                </div>
                {webpagePreview.removedLines.length > 0 && (
                  <details className="rounded border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900">
                    <summary className="cursor-pointer font-semibold">Removed webpage junk ({webpagePreview.removedLines.length})</summary>
                    <div className="mt-2 grid gap-1">
                      {webpagePreview.removedLines.slice(0, 20).map((line, index) => <div key={`${line}-${index}`}>{line}</div>)}
                    </div>
                  </details>
                )}
                {webpagePreview.warnings.length > 0 && (
                  <div className="rounded border border-red-200 bg-red-50 p-3 text-sm font-semibold text-red-800">
                    {webpagePreview.warnings.join(' ')}
                  </div>
                )}
                <pre className="max-h-96 overflow-auto rounded-md border border-slate-300 bg-white p-3 font-mono text-sm leading-relaxed whitespace-pre-wrap">
                  {webpagePreview.cleanedText}
                </pre>
              </section>
            )}
          </section>

          <div
            className={`grid min-h-64 place-items-center rounded-md border-2 border-dashed bg-white p-8 text-center ${
              isDragging ? 'border-teal-600 bg-teal-50' : 'border-slate-300'
            }`}
            onDragOver={(event) => {
              event.preventDefault();
              setIsDragging(true);
            }}
            onDragLeave={() => setIsDragging(false)}
            onDrop={async (event) => {
              event.preventDefault();
              setIsDragging(false);
              const files = await filesFromDataTransfer(event.dataTransfer);
              await addFiles(files);
            }}
          >
            <div className="grid gap-4">
              <Upload className="mx-auto text-teal-700" size={42} />
              <div>
                <div className="font-semibold">Drop ChordPro files, OnSong archives, or folders here</div>
                <div className="mt-1 text-sm text-slate-600">Supports .archive, .cho, .crd, .chordpro, .chopro, .pro, and .txt.</div>
              </div>
              <div className="flex flex-wrap justify-center gap-2">
                <label className="primary-button cursor-pointer">
                  <Upload size={18} />
                  Select files
                  <input
                    className="hidden"
                    type="file"
                    multiple
                    accept={songImportAccept}
                    onChange={(event) => {
                      void addFiles(Array.from(event.currentTarget.files ?? []));
                      event.currentTarget.value = '';
                    }}
                  />
                </label>
                <label className="secondary-button cursor-pointer">
                  <Upload size={18} />
                  Select folder
                  <input
                    className="hidden"
                    type="file"
                    multiple
                    accept={songImportAccept}
                    ref={(input) => {
                      if (input) input.setAttribute('webkitdirectory', '');
                    }}
                    onChange={(event) => {
                      void addFiles(Array.from(event.currentTarget.files ?? []));
                      event.currentTarget.value = '';
                    }}
                  />
                </label>
              </div>
            </div>
          </div>

          <section className="rounded-md border border-slate-300 bg-white">
            <div className="flex flex-wrap items-center gap-3 border-b border-slate-200 p-3">
              <h3 className="font-semibold">Pending import</h3>
              <span className="text-sm text-slate-600">{pendingFiles.length} file(s)</span>
              <button className="secondary-button ml-auto" type="button" onClick={() => setPendingFiles([])} disabled={pendingFiles.length === 0}>
                Clear
              </button>
              <button className="primary-button" type="button" onClick={runImport} disabled={pendingFiles.length === 0 || isImporting}>
                Import Songs
              </button>
            </div>
            <div className="max-h-72 overflow-auto p-3">
              {pendingFiles.length === 0 ? (
                <p className="text-sm text-slate-600">No song import files selected yet.</p>
              ) : (
                <div className="grid gap-2">
                  {pendingFiles.map((file, index) => (
                    <div key={`${file.fileName}-${index}`} className="rounded border border-slate-200 bg-slate-50 p-3 text-sm">
                      <div className="font-medium">{file.fileName}</div>
                      <div className="mt-1 text-slate-600">{describeImportCandidate(file)}</div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </section>
        </section>

        <aside className="grid content-start gap-4">
          <section className="rounded-md border border-slate-300 bg-white p-4">
            <h3 className="font-semibold">Duplicate handling</h3>
            <div className="mt-3 grid gap-2">
              <RadioOption label="Skip duplicates" value="skip" selected={strategy} onChange={setStrategy} />
              <RadioOption label="Replace existing" value="replace" selected={strategy} onChange={setStrategy} />
              <RadioOption label="Import anyway" value="import" selected={strategy} onChange={setStrategy} />
            </div>
            <p className="mt-3 text-sm text-slate-600">
              Duplicates are matched by title and artist. Replacing keeps the existing song ID so setlists continue to point at it.
            </p>
          </section>

          <section className="rounded-md border border-slate-300 bg-white p-4">
            <h3 className="font-semibold">Current library</h3>
            <p className="mt-1 text-sm text-slate-600">{songs.length} stored song(s)</p>
          </section>

          <section className="rounded-md border border-slate-300 bg-white p-4">
            <h3 className="font-semibold">JSON / CSV</h3>
            <p className="mt-1 text-sm text-slate-600">Legacy library imports remain available for OpenStage exports.</p>
            <label className="secondary-button mt-3 cursor-pointer">
              <Upload size={18} />
              Import JSON or CSV
              <input
                className="hidden"
                type="file"
                accept=".json,.csv,application/json,text/csv"
                onChange={(event) => {
                  const file = event.currentTarget.files?.[0];
                  if (file) void onJsonCsvImport(file);
                  event.currentTarget.value = '';
                }}
              />
            </label>
          </section>
        </aside>
      </div>

      {summary && <ImportSummaryModal summary={summary} onClose={() => setSummary(null)} />}
    </main>
  );
}

const songImportAccept = '.archive,.cho,.crd,.chordpro,.chopro,.pro,.txt,text/plain,application/octet-stream';

function isSupportedSongImportFileName(fileName: string) {
  return isChordProFileName(fileName) || isOnSongArchiveFileName(fileName);
}

function describeImportCandidate(file: ImportCandidate) {
  if (file.bytes) return `${Math.max(1, Math.round(file.bytes.byteLength / 1024))} KB OnSong archive`;
  return `${file.text?.split(/\r?\n/).length ?? 0} lines`;
}

function RadioOption({
  label,
  value,
  selected,
  onChange
}: {
  label: string;
  value: DuplicateStrategy;
  selected: DuplicateStrategy;
  onChange: (value: DuplicateStrategy) => void;
}) {
  return (
    <label className="flex items-center gap-3 rounded-md border border-slate-200 p-3">
      <input type="radio" checked={selected === value} onChange={() => onChange(value)} />
      <span className="text-sm font-medium">{label}</span>
    </label>
  );
}

function ImportSummaryModal({ summary, onClose }: { summary: ImportSummary; onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-slate-950/70 p-4">
      <section className="max-h-[86vh] w-full max-w-2xl overflow-auto rounded-md bg-white p-5 shadow-xl">
        <div className="flex items-start gap-3">
          <CheckCircle className="mt-1 text-teal-700" size={24} />
          <div>
            <h2 className="text-lg font-semibold">Import Summary</h2>
            <p className="mt-1 text-sm text-slate-600">
              Found {summary.songsFound} song(s). Imported {summary.importedCount}. Skipped {summary.skippedCount}.
            </p>
            {summary.fileNames.length > 0 && (
              <p className="mt-1 text-xs text-slate-500">
                File(s): {summary.fileNames.join(', ')}
              </p>
            )}
          </div>
        </div>

        <GroupedWarningList groups={summary.warningGroups} />
        <SummaryList title="Duplicate warnings" items={summary.duplicateWarnings} />

        <div className="mt-5 flex justify-end">
          <button className="primary-button" onClick={onClose}>
            Close
          </button>
        </div>
      </section>
    </div>
  );
}

function GroupedWarningList({ groups }: { groups: ImportSummary['warningGroups'] }) {
  return (
    <section className="mt-4">
      <h3 className="flex items-center gap-2 font-semibold">
        <AlertTriangle size={17} className={groups.length ? 'text-amber-600' : 'text-slate-400'} />
        Parser warnings
      </h3>
      {groups.length === 0 ? (
        <p className="mt-2 text-sm text-slate-600">None.</p>
      ) : (
        <div className="mt-2 grid gap-3">
          {groups.map((group) => (
            <details key={`${group.fileName}-${group.songTitle}`} className="rounded border border-amber-200 bg-amber-50 p-2 text-sm text-amber-900">
              <summary className="cursor-pointer font-semibold">
                {group.songTitle} - {group.warnings.length} warning(s)
              </summary>
              <div className="mt-2 grid gap-1">
                {group.warnings.map((warning, index) => (
                  <div key={`${warning}-${index}`}>{warning}</div>
                ))}
              </div>
            </details>
          ))}
        </div>
      )}
    </section>
  );
}

function SummaryList({ title, items }: { title: string; items: string[] }) {
  return (
    <section className="mt-4">
      <h3 className="flex items-center gap-2 font-semibold">
        <AlertTriangle size={17} className={items.length ? 'text-amber-600' : 'text-slate-400'} />
        {title}
      </h3>
      {items.length === 0 ? (
        <p className="mt-2 text-sm text-slate-600">None.</p>
      ) : (
        <div className="mt-2 grid gap-2">
          {items.map((item, index) => (
            <div key={`${item}-${index}`} className="rounded border border-amber-200 bg-amber-50 p-2 text-sm text-amber-900">
              {item}
            </div>
          ))}
        </div>
      )}
    </section>
  );
}

function PedalConfigView({
  mappings,
  onChange,
  onReset
}: {
  mappings: PedalMappings;
  onChange: (mappings: PedalMappings) => void;
  onReset: () => void;
}) {
  type PedalSectionAction = {
    id: string;
    action: PedalAction;
    label: string;
    hint: string;
  };
  type PedalSection = {
    title: string;
    icon: React.ReactNode;
    actions: PedalSectionAction[];
  };

  const [testMode, setTestMode] = useState(false);
  const [testEvents, setTestEvents] = useState<Array<{ key: string; code: string; actionLabel?: string; recognized: boolean; createdAt: number }>>([]);
  const [duplicateRequest, setDuplicateRequest] = useState<{ key: string; fromAction: PedalAction; toAction: PedalAction } | null>(null);

  const actionLabels: Record<PedalAction, string> = {
    toggleAutoscroll: 'Toggle Autoscroll',
    toggleTempoGuide: 'Toggle Tempo Guide',
    scrollFaster: 'Scroll Faster',
    scrollSlower: 'Scroll Slower',
    nextSong: 'Next Song',
    previousSong: 'Previous Song',
    scrollDown: 'Scroll Down',
    scrollUp: 'Scroll Up',
    toggleChords: 'Show / Hide Chords',
    toggleHarmonyCues: 'Show / Hide Harmony Cues',
    increaseFontSize: 'Increase Font Size',
    decreaseFontSize: 'Decrease Font Size'
  };

  const sections: PedalSection[] = [
    {
      title: 'Performance',
      icon: <Gauge size={20} />,
      actions: [
        { id: 'toggleAutoscroll', action: 'toggleAutoscroll', label: 'Toggle Autoscroll', hint: 'Start or pause Stage autoscroll.' },
        { id: 'tempoGuide', action: 'toggleTempoGuide', label: 'Toggle Tempo Guide', hint: 'Start or stop the visual BPM guide.' },
        { id: 'scrollFaster', action: 'scrollFaster', label: 'Scroll Faster', hint: 'Increase autoscroll speed.' },
        { id: 'scrollSlower', action: 'scrollSlower', label: 'Scroll Slower', hint: 'Decrease autoscroll speed.' }
      ]
    },
    {
      title: 'Navigation',
      icon: <ListMusic size={20} />,
      actions: [
        { id: 'nextSong', action: 'nextSong', label: 'Next Song', hint: 'Common pedals: ArrowRight, PageDown.' },
        { id: 'previousSong', action: 'previousSong', label: 'Previous Song', hint: 'Common pedals: ArrowLeft, PageUp.' },
        { id: 'scrollDown', action: 'scrollDown', label: 'Scroll Down', hint: 'Common pedals: ArrowDown.' },
        { id: 'scrollUp', action: 'scrollUp', label: 'Scroll Up', hint: 'Common pedals: ArrowUp.' }
      ]
    },
    {
      title: 'Display',
      icon: <Monitor size={20} />,
      actions: [
        { id: 'showChords', action: 'toggleChords', label: 'Show / Hide Chords', hint: 'Toggle chord visibility for the Stage chart.' },
        { id: 'showHarmony', action: 'toggleHarmonyCues', label: 'Show / Hide Harmony Cues', hint: 'Toggle harmony cue visibility.' },
        { id: 'increaseFont', action: 'increaseFontSize', label: 'Increase Font Size', hint: 'Increase lyric font size.' },
        { id: 'decreaseFont', action: 'decreaseFontSize', label: 'Decrease Font Size', hint: 'Decrease lyric font size.' }
      ]
    }
  ];

  const supportedActions = sections.flatMap((section) => section.actions);

  function updateAction(action: PedalAction, keys: string[]) {
    onChange({ ...mappings, [action]: keys });
  }

  function findMappedAction(key: string, exceptAction?: PedalAction) {
    return supportedActions.find(({ action }) => action !== exceptAction && (mappings[action] ?? []).includes(key));
  }

  function addKeyToAction(action: PedalAction, key: string) {
    if ((mappings[action] ?? []).includes(key)) return;
    const duplicate = findMappedAction(key, action);
    if (duplicate) {
      setDuplicateRequest({ key, fromAction: duplicate.action, toAction: action });
      return;
    }
    updateAction(action, [...(mappings[action] ?? []), key]);
  }

  function moveDuplicateAssignment() {
    if (!duplicateRequest) return;
    const nextMappings = { ...mappings };
    nextMappings[duplicateRequest.fromAction] = (nextMappings[duplicateRequest.fromAction] ?? []).filter((key) => key !== duplicateRequest.key);
    nextMappings[duplicateRequest.toAction] = Array.from(new Set([...(nextMappings[duplicateRequest.toAction] ?? []), duplicateRequest.key]));
    onChange(nextMappings);
    setDuplicateRequest(null);
  }

  function resetDefaultsWithConfirmation() {
    if (window.confirm('Reset pedal mappings to the OpenStage defaults?')) {
      onReset();
    }
  }

  useEffect(() => {
    setPedalTestModeActive(testMode);
    if (!testMode) return () => setPedalTestModeActive(false);
    function handleTestKeyDown(event: KeyboardEvent) {
      event.preventDefault();
      event.stopPropagation();
      event.stopImmediatePropagation();
      const key = normalizeKeyEvent(event);
      const code = event.code || '-';
      const match = supportedActions.find(({ action }) => (mappings[action] ?? []).includes(key));
      setTestEvents((events) => [
        { key, code, actionLabel: match?.label, recognized: Boolean(match), createdAt: Date.now() },
        ...events
      ].slice(0, 12));
    }
    window.addEventListener('keydown', handleTestKeyDown, true);
    document.addEventListener('keydown', handleTestKeyDown, true);
    return () => {
      window.removeEventListener('keydown', handleTestKeyDown, true);
      document.removeEventListener('keydown', handleTestKeyDown, true);
      setPedalTestModeActive(false);
    };
  }, [mappings, supportedActions, testMode]);

  return (
    <main className="min-h-[calc(100vh-105px)] bg-slate-50 p-4">
      <div className="mx-auto max-w-5xl">
        <div className="mb-5 rounded-md border border-slate-300 bg-white p-5 shadow-sm">
          <div className="flex flex-wrap items-start gap-3">
            <div>
              <h2 className="text-2xl font-semibold">Pedal Configuration</h2>
              <p className="mt-1 max-w-2xl text-sm text-slate-600">
                Set up Bluetooth pedals, USB pedals, and page up/down devices for live Stage control.
              </p>
            </div>
            <div className="ml-auto flex flex-wrap gap-2">
              <button
                className={testMode ? 'primary-button' : 'secondary-button'}
                type="button"
                onClick={() => {
                  setTestMode(true);
                  setTestEvents([]);
                }}
              >
                <CheckCircle size={18} />
                Test Pedals
              </button>
              <button className="secondary-button" type="button" onClick={resetDefaultsWithConfirmation}>
                <RotateCcw size={18} />
                Reset Defaults
              </button>
            </div>
          </div>

          {testMode && (
            <section className="mt-4 rounded-md border border-teal-200 bg-teal-50 p-4">
              <div className="flex flex-wrap items-center gap-3">
                <div>
                  <h3 className="font-semibold text-teal-950">Waiting for pedal input...</h3>
                  <p className="mt-1 text-sm text-teal-800">Press pedals repeatedly to verify what OpenStage receives.</p>
                  <p className="mt-2 rounded-md border border-teal-300 bg-white/80 px-3 py-2 text-sm font-semibold text-teal-900">
                    Test Mode Active - pedal actions are disabled while testing.
                  </p>
                </div>
                <button className="secondary-button ml-auto bg-white" type="button" onClick={() => setTestMode(false)}>
                  Done
                </button>
              </div>
              <div className="mt-3 grid gap-2">
                {testEvents.length === 0 ? (
                  <div className="rounded-md border border-dashed border-teal-300 bg-white/70 p-3 text-sm text-teal-800">No pedal input detected yet.</div>
                ) : (
                  testEvents.map((item) => (
                    <div
                      key={`${item.key}-${item.createdAt}`}
                      className={`flex flex-wrap items-center gap-3 rounded-md border p-3 text-sm ${
                        item.recognized ? 'border-teal-300 bg-white text-teal-950' : 'border-amber-300 bg-amber-50 text-amber-950'
                      }`}
                    >
                      <span className={item.recognized ? 'text-teal-600' : 'text-amber-600'}>
                        {item.recognized ? <CheckCircle size={19} /> : <AlertTriangle size={19} />}
                      </span>
                      <span className="rounded-md border border-slate-300 bg-slate-950 px-3 py-1 font-mono font-semibold text-white">key: {item.key}</span>
                      <span className="rounded-md border border-slate-300 bg-white px-3 py-1 font-mono font-semibold text-slate-800">code: {item.code}</span>
                      {item.recognized ? (
                        <span>Mapped to: <strong>{item.actionLabel}</strong></span>
                      ) : (
                        <span className="font-semibold">Unmapped key</span>
                      )}
                    </div>
                  ))
                )}
              </div>
            </section>
          )}
        </div>

        <div className="grid gap-5">
          {sections.map((section) => (
            <section key={section.title} className="rounded-md border border-slate-300 bg-white p-5 shadow-sm">
              <div className="mb-4 flex items-center gap-2 border-b border-slate-200 pb-3 text-slate-900">
                <span className="rounded-md bg-slate-100 p-2 text-teal-700">{section.icon}</span>
                <h3 className="text-lg font-semibold">{section.title}</h3>
              </div>
              <div className="grid gap-3">
                {section.actions.map((item) => (
                  <PedalActionRow
                    key={item.id}
                    label={item.label}
                    hint={item.hint}
                    keys={mappings[item.action] ?? []}
                    onRemoveKey={(key) => updateAction(item.action, (mappings[item.action] ?? []).filter((mappedKey) => mappedKey !== key))}
                    onClearMapping={() => updateAction(item.action, [])}
                    onLearnKey={(key) => addKeyToAction(item.action, key)}
                  />
                ))}
              </div>
            </section>
          ))}

          <section className="rounded-md border border-dashed border-slate-300 bg-white/80 p-5">
            <h3 className="font-semibold text-slate-800">Future Pedal Actions</h3>
            <p className="mt-1 text-sm text-slate-600">
              Reserved space for Blank Screen, Leader Mode, External Display, Receive Song, and other live workflows as those actions become stage-ready.
            </p>
          </section>
        </div>

        {duplicateRequest && (
          <div className="fixed inset-0 z-[90] flex items-center justify-center bg-black/40 px-4 py-6 backdrop-blur-sm">
            <section className="w-full max-w-md rounded-md border border-amber-300 bg-white p-5 shadow-2xl">
              <div className="flex items-start gap-3">
                <AlertTriangle className="mt-1 text-amber-600" size={22} />
                <div>
                  <h3 className="text-lg font-semibold">Duplicate Mapping</h3>
                  <p className="mt-2 text-sm text-slate-700">
                    This key is already assigned to <strong>{actionLabels[duplicateRequest.fromAction]}</strong>.
                  </p>
                  <p className="mt-2 text-sm text-slate-600">
                    Move <span className="font-mono font-semibold">{duplicateRequest.key}</span> to <strong>{actionLabels[duplicateRequest.toAction]}</strong>?
                  </p>
                </div>
              </div>
              <div className="mt-5 flex flex-wrap justify-end gap-2">
                <button className="secondary-button" type="button" onClick={() => setDuplicateRequest(null)}>Cancel</button>
                <button className="primary-button" type="button" onClick={moveDuplicateAssignment}>Move Assignment</button>
              </div>
            </section>
          </div>
        )}
      </div>
    </main>
  );
}

function PedalActionRow({
  label,
  hint,
  keys,
  onRemoveKey,
  onClearMapping,
  onLearnKey
}: {
  label: string;
  hint: string;
  keys: string[];
  onRemoveKey: (key: string) => void;
  onClearMapping: () => void;
  onLearnKey: (key: string) => void;
}) {
  return (
    <div className="rounded-md border border-slate-200 bg-slate-50 p-4">
      <div className="grid gap-3 md:grid-cols-[1fr_1.5fr] md:items-center">
        <div>
          <h4 className="font-semibold text-slate-950">{label}</h4>
          <p className="mt-1 text-sm text-slate-600">{hint}</p>
        </div>
        <KeyCapture
          keys={keys}
          onRemoveKey={onRemoveKey}
          onClearMapping={onClearMapping}
          onLearnKey={onLearnKey}
        />
      </div>
    </div>
  );
}

function KeyCapture({
  keys,
  onRemoveKey,
  onClearMapping,
  onLearnKey
}: {
  keys: string[];
  onRemoveKey: (key: string) => void;
  onClearMapping: () => void;
  onLearnKey: (key: string) => void;
}) {
  const [isCapturing, setIsCapturing] = useState(false);
  const buttonRef = useRef<HTMLButtonElement | null>(null);

  useEffect(() => {
    if (isCapturing) buttonRef.current?.focus();
  }, [isCapturing]);

  return (
    <div className="grid gap-3">
      <div className="text-xs font-semibold uppercase tracking-wide text-slate-500">Current Mapping</div>
      <div className="flex flex-wrap gap-2">
        {keys.map((key) => (
          <button
            key={key}
            className="rounded-md border border-slate-300 bg-white px-3 py-2 font-mono text-sm font-semibold text-slate-900 shadow-sm hover:border-red-300 hover:text-red-700"
            title={`Remove ${key}`}
            type="button"
            onClick={() => onRemoveKey(key)}
          >
            {key}
          </button>
        ))}
        {keys.length === 0 && <span className="rounded-md border border-dashed border-slate-300 bg-white px-3 py-2 text-sm text-slate-500">No pedal assigned</span>}
      </div>
      <div className="flex flex-wrap gap-2">
        <button
          ref={buttonRef}
          className="primary-button w-fit"
          type="button"
          onClick={() => setIsCapturing(true)}
          onBlur={() => {
            if (isCapturing) window.setTimeout(() => setIsCapturing(false), 120);
          }}
          onKeyDown={(event) => {
            if (!isCapturing) return;
            event.preventDefault();
            event.stopPropagation();
            const normalized = normalizeKeyEvent(event.nativeEvent);
            onLearnKey(normalized);
            setIsCapturing(false);
          }}
        >
          <Settings size={18} />
          {isCapturing ? 'Press pedal or key...' : 'Learn Button'}
        </button>
        <button className="secondary-button w-fit" type="button" disabled={keys.length === 0} onClick={onClearMapping}>
          Clear Mapping
        </button>
      </div>
      {isCapturing && (
        <div className="rounded-md border border-teal-200 bg-teal-50 px-3 py-2 text-sm font-semibold text-teal-900">
          Press the pedal or keyboard key you want to assign...
        </div>
      )}
    </div>
  );
}

function SettingsView({
  state,
  setState,
  setPreset,
  setAutoscrollSpeed,
  onExportBackup,
  onRestoreBackup,
  onSyncNow,
  onBackupLibrary,
  onRetryFailedBackup,
  onRestoreLibrary,
  onUndoLastRestore,
  cloudBackupProgress,
  onPedals,
  onImport,
  syncStatus,
  conflicts
}: {
  state: PerformanceState;
  setState: (next: Partial<PerformanceState>) => void;
  setPreset: (preset: AutoscrollPreset) => void;
  setAutoscrollSpeed: (speed: number) => void;
  onExportBackup: () => void;
  onRestoreBackup: (file: File) => void;
  onSyncNow: () => void;
  onBackupLibrary: () => void;
  onRetryFailedBackup: () => void;
  onRestoreLibrary: (userId: string) => Promise<CloudRestoreResult>;
  onUndoLastRestore: () => Promise<void>;
  cloudBackupProgress: CloudBackupProgress;
  onPedals: () => void;
  onImport: () => void;
  syncStatus: string;
  conflicts: SyncConflict[];
}) {
  return (
    <main className="min-h-[calc(100vh-105px)] p-4">
      <div className="mx-auto grid max-w-5xl gap-4 md:grid-cols-2">
        <RemoteDisplaySettingsCard />
        <SettingsCard title="Display Settings">
          <PerformanceControlPanel state={state} setState={setState} setPreset={setPreset} setAutoscrollSpeed={setAutoscrollSpeed} onCalculateDuration={() => undefined} />
        </SettingsCard>
        <SettingsCard title="Pedal Settings">
          <p className="text-sm text-slate-600">Configure Bluetooth pedals, USB pedals, page up/down devices, and keyboard mappings.</p>
          <button className="primary-button mt-3" onClick={onPedals}>
            <Settings size={18} />
            Open pedal configuration
          </button>
        </SettingsCard>
        <SettingsCard title="Import / Export">
          <div className="flex flex-wrap gap-2">
            <button className="secondary-button" onClick={onImport}>
              <Upload size={18} />
              Import songs
            </button>
            <button className="primary-button" onClick={onExportBackup}>
              <Download size={18} />
              Export full backup
            </button>
            <label className="secondary-button cursor-pointer">
              <Upload size={18} />
              Restore backup
              <input
                className="hidden"
                type="file"
                accept=".json,application/json"
                onChange={(event) => {
                  const file = event.currentTarget.files?.[0];
                  if (file) onRestoreBackup(file);
                  event.currentTarget.value = '';
                }}
              />
            </label>
          </div>
        </SettingsCard>
        <SettingsCard title="Install App">
          <p className="text-sm text-slate-600">On iPhone Safari, use Share, then Add to Home Screen. OpenStage will launch as a standalone PWA with phone-safe Stage spacing.</p>
        </SettingsCard>
        <OpenStageCloudSettingsCard
          state={state}
          progress={cloudBackupProgress}
          onBackupLibrary={onBackupLibrary}
          onRetryFailedBackup={onRetryFailedBackup}
          onRestoreLibrary={onRestoreLibrary}
          onUndoLastRestore={onUndoLastRestore}
        />
        <SettingsCard title="Sync Foundation">
          <p className="text-sm text-slate-600">Automatic sync and restore are not enabled yet. Manual Cloud Backup is available above.</p>
          <div className="mt-3 flex flex-wrap gap-2">
            <button className="primary-button" onClick={onSyncNow}>Sync now</button>
          </div>
          <p className="mt-3 text-sm">Status: {syncStatus}</p>
          {conflicts.length > 0 && <p className="mt-2 text-sm text-amber-700">{conflicts.length} conflict(s) need review.</p>}
        </SettingsCard>
        <SettingsCard title="Stage Defaults">
          <label className="grid gap-1 text-sm">
            <span>Default countdown: {state.countdownSeconds}s</span>
            <input type="range" min={0} max={90} step={5} value={state.countdownSeconds} onChange={(event) => setState({ countdownSeconds: Number(event.target.value) })} />
          </label>
          <label className="mt-3 flex items-center gap-2 text-sm">
            <input type="checkbox" checked={state.recoverToStageMode} onChange={(event) => setState({ recoverToStageMode: event.target.checked })} />
            Reopen last stage state after reload
          </label>
          <label className="mt-3 flex items-center gap-2 text-sm">
            <input type="checkbox" checked={state.showAutoscrollDebug} onChange={(event) => setState({ showAutoscrollDebug: event.target.checked })} />
            Show Autoscroll Debug
          </label>
          <label className="mt-3 flex items-center gap-2 text-sm">
            <input type="checkbox" checked={Boolean(state.showChordAnchorDebug)} onChange={(event) => setState({ showChordAnchorDebug: event.target.checked })} />
            Show Chord Anchor Debug
          </label>
        </SettingsCard>
        <SettingsCard title="Theme Settings">
          <div className="flex flex-wrap gap-2">
            <button className="stage-toggle text-slate-900" onClick={() => setState({ theme: 'dark' })}><Moon size={18} /> Dark</button>
            <button className="stage-toggle text-slate-900" onClick={() => setState({ theme: 'light' })}><Sun size={18} /> Light</button>
          </div>
          <div className="mt-3 grid gap-2">
            {stageThemes.map((theme) => (
              <button key={theme.name} className="secondary-button justify-start" onClick={() => setState(stageThemePresetPatch(state, theme.name))}>
                {theme.label}
              </button>
            ))}
          </div>
        </SettingsCard>
      </div>
    </main>
  );
}

function formatLastBackupTime(value?: string) {
  if (!value) return 'Never';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return 'Never';
  const now = new Date();
  const dayLabel = date.toDateString() === now.toDateString()
    ? 'Today'
    : date.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
  const timeLabel = date.toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' });
  return `${dayLabel} ${timeLabel}`;
}

function cloudAuthErrorMessage(error: unknown) {
  const message = error instanceof Error ? error.message : String(error);
  if (/already registered|already exists|user already/i.test(message)) return 'Email already exists';
  if (/invalid login credentials|invalid password|email|password/i.test(message)) return 'Invalid email or password';
  if (/network|failed to fetch|load failed|offline/i.test(message)) return 'Network error';
  return message || 'OpenStage Cloud authentication failed.';
}

type CloudLibraryPreview = {
  songs: Array<{ songUuid: string; title: string; revision: number; updatedAt: string; song?: Song }>;
  setlists: Array<{ setlistUuid: string; name: string; updatedAt: string; setlist?: SavedSetlist }>;
  lastBackup: string;
};

function OpenStageCloudSettingsCard({
  state,
  progress,
  onBackupLibrary,
  onRetryFailedBackup,
  onRestoreLibrary,
  onUndoLastRestore
}: {
  state: PerformanceState;
  progress: CloudBackupProgress;
  onBackupLibrary: () => void;
  onRetryFailedBackup: () => void;
  onRestoreLibrary: (userId: string) => Promise<CloudRestoreResult>;
  onUndoLastRestore: () => Promise<void>;
}) {
  const cloud = useCloud();
  const [message, setMessage] = useState('');
  const [emailModalOpen, setEmailModalOpen] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [emailError, setEmailError] = useState('');
  const [emailSubmitting, setEmailSubmitting] = useState(false);
  const [restoreModalOpen, setRestoreModalOpen] = useState(false);
  const [restorePreview, setRestorePreview] = useState<CloudLibraryPreview | null>(null);
  const [restoreStep, setRestoreStep] = useState<'preview' | 'confirm'>('preview');
  const [restoreLoading, setRestoreLoading] = useState(false);
  const [restoreSubmitting, setRestoreSubmitting] = useState(false);
  const [restorePhase, setRestorePhase] = useState('');
  const [restoreError, setRestoreError] = useState('');
  const isRunning = progress.phase === 'songs' || progress.phase === 'setlists';
  const failedSongs = progress.failed.filter((failure) => failure.type === 'song').length;
  const failedSetlists = progress.failed.filter((failure) => failure.type === 'setlist').length;
  const backedUpSongs = Math.max(0, progress.songDone - failedSongs);
  const backedUpSetlists = Math.max(0, progress.setlistDone - failedSetlists);
  const backedUpItems = backedUpSongs + backedUpSetlists;
  const totalFailed = progress.failed.length;
  const completed = progress.phase === 'complete' || progress.phase === 'failed';
  const activeProgressLabel = progress.phase === 'setlists'
    ? `Backing up setlists... ${progress.setlistDone} / ${progress.setlistTotal}`
    : `Backing up songs... ${progress.songDone} / ${progress.songTotal}`;

  async function submitEmailAuth(action: 'sign-in' | 'create') {
    setEmailError('');
    setMessage('');
    if (!email.trim() || !password) {
      setEmailError('Email and password are required.');
      return;
    }

    setEmailSubmitting(true);
    try {
      if (action === 'create') {
        await cloud.createAccount(email.trim(), password);
        setMessage('Please check your email to confirm your account, if email confirmation is required.');
      } else {
        await cloud.signIn('email', email.trim(), password);
        setMessage('Signed in to OpenStage Cloud.');
      }
      setEmailModalOpen(false);
      setPassword('');
    } catch (error) {
      reportError('OpenStage Cloud email authentication failed', error);
      setEmailError(cloudAuthErrorMessage(error));
    } finally {
      setEmailSubmitting(false);
    }
  }

  function openRestorePreview() {
    if (!cloud.user?.id) return;

    setRestoreModalOpen(true);
    setRestorePreview(null);
    setRestoreStep('preview');
    setRestoreError('');
    setRestorePhase('Preparing restore...');
    setMessage('');

    const startFetch = () => void fetchRestorePreview();
    if (typeof window !== 'undefined' && typeof window.requestAnimationFrame === 'function') {
      window.requestAnimationFrame(() => window.setTimeout(startFetch, 0));
    } else {
      setTimeout(startFetch, 0);
    }
  }

  async function fetchRestorePreview() {
    if (!cloud.user?.id) return;

    setRestoreLoading(true);
    setRestoreError('');
    setRestorePhase('Checking cloud backup...');
    try {
      const response = await fetch(`${openStageApiBaseUrl}/api/sync/library?userId=${encodeURIComponent(cloud.user.id)}`);
      const body = await response.json().catch(() => null);

      if (!response.ok || !body?.ok) {
        throw new Error(body?.error || `Cloud library preview failed with HTTP ${response.status}`);
      }

      const songs = Array.isArray(body.songs) ? body.songs : [];
      const setlists = Array.isArray(body.setlists) ? body.setlists : [];
      const latestUpdatedAt = [...songs, ...setlists]
        .map((item) => typeof item.updatedAt === 'string' ? item.updatedAt : '')
        .filter(Boolean)
        .sort((a, b) => new Date(b).getTime() - new Date(a).getTime())[0] || '';

      setRestorePreview({
        songs,
        setlists,
        lastBackup: latestUpdatedAt
      });
      setRestoreStep('preview');
      setRestorePhase('');
    } catch (error) {
      reportError('Cloud restore preview failed', error);
      setRestoreError('Could not load cloud backup.');
      setRestorePhase('');
    } finally {
      setRestoreLoading(false);
    }
  }

  function closeRestorePreview() {
    setRestoreModalOpen(false);
    setRestorePreview(null);
    setRestoreStep('preview');
    setRestorePhase('');
    setRestoreError('');
    setRestoreSubmitting(false);
  }

  async function confirmRestoreLibrary() {
    console.log('RESTORE_CLICKED');
    if (!cloud.user?.id) {
      setRestoreError('Sign in required to restore your library.');
      return;
    }
    setRestoreSubmitting(true);
    setRestorePhase('Preparing restore...');
    console.log('RESTORE_PHASE: preparing');
    setRestoreError('');
    try {
      setRestorePhase('Downloading cloud library...');
      console.log('RESTORE_PHASE: downloading cloud library');
      const result = await onRestoreLibrary(cloud.user.id);
      setRestorePhase('Restore complete');
      setMessage(`Restore Complete\n${result.songCount} Songs\n${result.setlistCount} Setlists\nRestore completed successfully.`);
      closeRestorePreview();
    } catch (error) {
      setRestoreError('Restore failed.\nYour previous library has been restored.');
    } finally {
      setRestoreSubmitting(false);
    }
  }

  async function undoLastRestore() {
    setRestoreError('');
    setMessage('');
    try {
      await onUndoLastRestore();
      setMessage('Undo restore complete.');
    } catch (error) {
      reportError('Undo last restore failed', error);
      setRestoreError(error instanceof Error ? error.message : 'Undo restore failed.');
    }
  }

  return (
    <SettingsCard title="☁ OpenStage Cloud">
      <div className="grid gap-3 text-sm text-slate-700">
        <p>Keep your songs, setlists, and settings safely backed up and available on all your devices.</p>
        <p className="rounded-md border border-teal-200 bg-teal-50 px-3 py-2 text-teal-900">
          Your library stays available offline. Cloud backup protects your work and helps restore it on another device.
        </p>
        <div className="rounded-md border border-slate-200 bg-slate-50 p-3">
          <div className="text-xs font-semibold uppercase text-slate-500">Status</div>
          <div className="mt-1 text-base font-semibold text-slate-900">
            Status: {cloud.loading ? 'Checking...' : cloud.user ? 'Signed In' : 'Not Signed In'}
          </div>
          {cloud.user && <div className="mt-1 text-sm text-slate-600">Email: {cloud.user.email || cloud.user.user_metadata?.name || cloud.user.id}</div>}
        </div>
        {cloud.user ? (
          <div className="flex flex-wrap gap-2">
            <button className="secondary-button" type="button" onClick={() => void cloud.signOut()}>
              Sign Out
            </button>
            <button className="primary-button" type="button" disabled={isRunning} onClick={onBackupLibrary}>
              <Cloud size={18} />
              Backup My Library
            </button>
            <button className="secondary-button" type="button" disabled={restoreLoading} onClick={openRestorePreview}>
              Restore Library
            </button>
          </div>
        ) : (
          <>
            <div className="flex flex-wrap gap-2">
              <button className="primary-button opacity-60" type="button" disabled title="Coming soon">
                Sign in with Apple
              </button>
              <button className="secondary-button opacity-60" type="button" disabled title="Coming soon">
                Sign in with Google
              </button>
              <button className="secondary-button" type="button" disabled={!cloud.configured || cloud.loading} onClick={() => setEmailModalOpen(true)}>
                Sign in with Email
              </button>
            </div>
            <p className="text-xs text-amber-700">Sign in to enable cloud backup.</p>
          </>
        )}
        {cloud.user && (
          <>
            <div className="rounded-md border border-slate-200 bg-slate-50 p-3">
              <div className="text-xs font-semibold uppercase text-slate-500">Last Backup</div>
              <div className="mt-1 text-base font-semibold text-slate-900">{formatLastBackupTime(state.lastBackupTime)}</div>
            </div>
            <div className="rounded-md border border-slate-200 bg-slate-50 p-3">
              <div className="text-xs font-semibold uppercase text-slate-500">Last Restore</div>
              <div className="mt-1 text-base font-semibold text-slate-900">{formatLastBackupTime(state.lastRestoreTime)}</div>
              <button className="secondary-button mt-3 w-fit" type="button" onClick={() => void undoLastRestore()}>
                Undo Last Restore
              </button>
            </div>
            {isRunning && (
              <div className="rounded-md border border-teal-200 bg-teal-50 p-3 text-teal-900">
                <div className="font-semibold">{activeProgressLabel}</div>
                {totalFailed > 0 && <div className="mt-1 text-xs">{totalFailed} item(s) have failed so far. Backup will continue.</div>}
              </div>
            )}
            {completed && (
              <div className={`rounded-md border p-3 ${totalFailed > 0 ? 'border-amber-300 bg-amber-50 text-amber-950' : 'border-teal-300 bg-teal-50 text-teal-950'}`}>
                <div className="font-semibold">{totalFailed > 0 ? 'Backup Finished With Errors' : 'Backup Complete'}</div>
                <div className="mt-2 grid gap-1">
                  <div>{backedUpSongs} Songs</div>
                  <div>{backedUpSetlists} Setlists</div>
                  {typeof progress.completedSeconds === 'number' && <div>Completed in {progress.completedSeconds.toFixed(1)} seconds</div>}
                </div>
                {totalFailed > 0 && (
                  <div className="mt-3 grid gap-2">
                    <div className="font-semibold">{backedUpItems} items backed up</div>
                    <div>{totalFailed} Failed</div>
                    <div className="text-xs">Failed songs: {failedSongs} | Failed setlists: {failedSetlists}</div>
                    <button className="secondary-button w-fit" type="button" onClick={onRetryFailedBackup}>
                      Retry Failed
                    </button>
                  </div>
                )}
              </div>
            )}
          </>
        )}
        {!cloud.configured && <p className="text-xs text-amber-700">OpenStage Cloud is not configured in this build.</p>}
        {message && <p className="whitespace-pre-line rounded-md border border-slate-200 bg-white px-3 py-2 text-xs text-slate-700">{message}</p>}
        {restoreError && !restoreModalOpen && <p className="whitespace-pre-line rounded-md border border-red-200 bg-red-50 px-3 py-2 text-xs font-semibold text-red-700">{restoreError}</p>}
      </div>
      {emailModalOpen && (
        <div className="fixed inset-0 z-[80] flex items-center justify-center bg-slate-950/70 p-4">
          <form className="grid w-full max-w-md gap-4 rounded-md border border-slate-300 bg-white p-5 text-slate-900 shadow-2xl" onSubmit={(event) => event.preventDefault()}>
            <div>
              <h3 className="text-xl font-semibold">OpenStage Cloud</h3>
              <p className="mt-1 text-sm text-slate-600">Sign in or create an account with email and password.</p>
            </div>
            <label className="grid gap-1 text-sm">
              <span className="font-semibold">Email</span>
              <input className="input" type="email" autoComplete="email" value={email} onChange={(event) => setEmail(event.target.value)} />
            </label>
            <label className="grid gap-1 text-sm">
              <span className="font-semibold">Password</span>
              <input className="input" type="password" autoComplete="current-password" value={password} onChange={(event) => setPassword(event.target.value)} />
            </label>
            {emailError && <div className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm font-semibold text-red-700">{emailError}</div>}
            <div className="flex flex-wrap justify-end gap-2">
              <button className="secondary-button" type="button" disabled={emailSubmitting} onClick={() => void submitEmailAuth('sign-in')}>
                Sign In
              </button>
              <button className="primary-button" type="button" disabled={emailSubmitting} onClick={() => void submitEmailAuth('create')}>
                Create Account
              </button>
              <button className="secondary-button" type="button" disabled={emailSubmitting} onClick={() => setEmailModalOpen(false)}>
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}
      {restoreModalOpen && (
        <div className="fixed inset-0 z-[80] flex items-center justify-center bg-slate-950/70 p-4">
          <section className="grid w-full max-w-md gap-4 rounded-md border border-slate-300 bg-white p-5 text-slate-900 shadow-2xl">
            <div>
              <h3 className="text-xl font-semibold">Restore Library</h3>
              <p className="mt-1 text-sm font-semibold text-slate-600">Cloud Backup</p>
            </div>
            {restoreLoading && (
              <>
                <p className="rounded-md border border-teal-200 bg-teal-50 px-3 py-2 text-sm font-semibold text-teal-900">
                  {restorePhase || 'Checking cloud backup...'}
                </p>
                <p className="text-sm text-slate-600">This may take a moment on iPad or slower networks.</p>
              </>
            )}
            {!restoreLoading && restoreError ? (
              <>
                <p className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm font-semibold text-red-700">
                  {restoreError}
                </p>
                <div className="flex flex-wrap justify-end gap-2">
                  <button className="primary-button" type="button" onClick={() => void fetchRestorePreview()}>
                    Try Again
                  </button>
                  <button className="secondary-button" type="button" onClick={closeRestorePreview}>
                    Cancel
                  </button>
                </div>
              </>
            ) : !restoreLoading && restorePreview && restoreStep === 'preview' ? (
              <>
                <div className="grid gap-2 rounded-md border border-slate-200 bg-slate-50 p-4 text-sm">
                  <div>Songs: <span className="font-semibold">{restorePreview.songs.length}</span></div>
                  <div>Setlists: <span className="font-semibold">{restorePreview.setlists.length}</span></div>
                  <div>Last Backup: <span className="font-semibold">{formatLastBackupTime(restorePreview.lastBackup)}</span></div>
                </div>
                <div className="border-t border-slate-200" />
                <p className="text-sm font-semibold text-slate-700">Nothing on this screen modifies local data.</p>
                <div className="flex flex-wrap justify-end gap-2">
                  <button className="primary-button" type="button" onClick={() => setRestoreStep('confirm')}>
                    Continue
                  </button>
                  <button className="secondary-button" type="button" onClick={closeRestorePreview}>
                    Cancel
                  </button>
                </div>
              </>
            ) : !restoreLoading && restorePreview ? (
              <>
                <p className="rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-sm font-semibold text-amber-900">
                  This will replace your current local library with the cloud backup.
                </p>
                <p className="text-sm text-slate-700">Your current library will be backed up first.</p>
                {restorePhase && <p className="rounded-md border border-teal-200 bg-teal-50 px-3 py-2 text-sm font-semibold text-teal-900">{restorePhase}</p>}
                <div className="flex flex-wrap justify-end gap-2">
                  <button className="primary-button" type="button" disabled={restoreSubmitting} onClick={() => void confirmRestoreLibrary()}>
                    Restore
                  </button>
                  <button className="secondary-button" type="button" disabled={restoreSubmitting} onClick={closeRestorePreview}>
                    Cancel
                  </button>
                </div>
              </>
            ) : null}
          </section>
        </div>
      )}
    </SettingsCard>
  );
}

function RemoteDisplaySettingsCard() {
  const [relayUrl, setRelayUrl] = useState(() => getRemoteDisplayUrl());
  const [status, setStatus] = useState<RemoteDisplayStatus>('disconnected');
  const [diagnostics, setDiagnostics] = useState<RemoteDisplayControllerSnapshot>({
    status: 'disconnected',
    url: getRemoteDisplayUrl(),
    detail: 'Controller has not connected yet.',
    lastEventAt: '',
    lastSongId: '',
    lastPublishState: 'none',
    lastReceiverMode: ''
  });
  const [message, setMessage] = useState('');

  useEffect(() => subscribeRemoteDisplayControllerStatus(setStatus), []);
  useEffect(() => subscribeRemoteDisplayControllerSnapshot((snapshot) => {
    setDiagnostics(snapshot);
    setStatus(snapshot.status);
  }), []);

  function saveRelayUrl() {
    saveRemoteDisplayUrl(relayUrl.trim());
    connectRemoteDisplayControllerForDiagnostics();
    setMessage('Remote Display relay address saved');
    window.setTimeout(() => setMessage(''), 2500);
  }

  return (
    <SettingsCard title="Remote Display">
      <div className="grid gap-3 text-sm text-slate-700">
        <p>
          Render stays a static site. Run the relay locally on the Raspberry Pi with <span className="font-mono">npm run remote-display</span>,
          or <span className="font-mono">npm run remote-display-secure</span> for Render/HTTPS, then point both the iPad and <span className="font-mono">/display</span> at that Pi address.
        </p>
        <label className="grid gap-1">
          <span className="font-semibold text-slate-800">Relay address</span>
          <input
            className="input font-mono"
            placeholder="wss://192.168.68.125:8788"
            value={relayUrl}
            onChange={(event) => setRelayUrl(event.target.value)}
          />
        </label>
        <div className="flex flex-wrap items-center gap-2">
          <button className="primary-button" type="button" onClick={saveRelayUrl}>Save Relay Address</button>
          <span className={`rounded-full border px-3 py-1 text-xs font-semibold ${remoteDisplayStatusClass(status)}`}>
            {remoteDisplayStatusLabel(status)}
          </span>
        </div>
        <div className="grid gap-1 rounded-md border border-slate-200 bg-slate-50 p-3 text-xs text-slate-700">
          <div className="font-semibold text-slate-900">Controller WebSocket Diagnostics</div>
          <div>URL used: <span className="font-mono">{diagnostics.url || getRemoteDisplayUrl()}</span></div>
          <div>Status: <span className="font-semibold">{remoteDisplayStatusLabel(diagnostics.status)}</span></div>
          <div>Last event: {diagnostics.lastEventAt || '-'}</div>
          <div>Last song: <span className="font-mono">{diagnostics.lastSongId || '-'}</span></div>
          <div>Receiver mode: {diagnostics.lastReceiverMode ? receiverDisplayModeLabel(diagnostics.lastReceiverMode as ReceiverDisplayMode) : '-'}</div>
          <div>Publish state: {diagnostics.lastPublishState}</div>
          <div className={diagnostics.status === 'error' ? 'font-semibold text-red-700' : ''}>Message: {diagnostics.detail || '-'}</div>
        </div>
        {message && <div className="rounded-md border border-teal-200 bg-teal-50 px-3 py-2 text-sm font-semibold text-teal-800">{message}</div>}
        <p className="text-xs text-slate-500">
          Use <span className="font-mono">wss://PI-IP:8788</span> when OpenStage is loaded from Render over HTTPS. Plain <span className="font-mono">ws://PI-IP:8787</span> is still available for local HTTP testing.
        </p>
      </div>
    </SettingsCard>
  );
}

function remoteDisplayStatusLabel(status: RemoteDisplayStatus) {
  if (status === 'connected') return 'Connected';
  if (status === 'connecting') return 'Reconnecting';
  if (status === 'error') return 'Error';
  return 'Disconnected';
}

function remoteDisplayStatusClass(status: RemoteDisplayStatus) {
  if (status === 'connected') return 'border-teal-300 bg-teal-50 text-teal-800';
  if (status === 'connecting') return 'border-amber-300 bg-amber-50 text-amber-800';
  if (status === 'error') return 'border-red-300 bg-red-50 text-red-800';
  return 'border-slate-300 bg-slate-100 text-slate-700';
}

function stageThemePresetPatch(state: PerformanceState, stageTheme: PerformanceState['stageTheme']): Partial<PerformanceState> {
  const lightTheme = stageTheme === 'standard-light' || stageTheme === 'outdoor';
  return {
    stageTheme,
    theme: lightTheme ? 'light' : 'dark',
    receiverDisplay: {
      ...normalizeReceiverDisplaySettings(state.receiverDisplay),
      blackBackground: stageTheme === 'standard-dark' || stageTheme === 'high-contrast'
    }
  };
}

function normalizeReceiverDisplaySettings(settings: Partial<ReceiverDisplaySettings> | undefined): ReceiverDisplaySettings {
  const requestedDisplayMode = settings?.displayMode;
  const displayMode: ReceiverDisplayMode = receiverDisplayModeOptions.some((option) => option.value === requestedDisplayMode)
    ? requestedDisplayMode as ReceiverDisplayMode
    : defaultReceiverDisplaySettings.displayMode;
  return {
    displayMode,
    blackBackground: settings?.blackBackground ?? defaultReceiverDisplaySettings.blackBackground,
    fontScale: clampNumber(settings?.fontScale ?? defaultReceiverDisplaySettings.fontScale, 0.65, 1.8),
    showTestPattern: Boolean(settings?.showTestPattern),
    showDiagnostics: Boolean(settings?.showDiagnostics),
    safeMargin: clampNumber(settings?.safeMargin ?? defaultReceiverDisplaySettings.safeMargin, 0, 14)
  };
}

function getReceiverVisualTheme(state: PerformanceState, receiver: ReceiverDisplaySettings) {
  if (receiver.blackBackground && (state.stageTheme === 'standard-dark' || state.stageTheme === 'high-contrast')) {
    return state.stageTheme === 'high-contrast'
      ? {
        background: '#000000',
        text: '#ffffff',
        muted: '#ffffff',
        chordColor: '#ffffff',
        sectionColor: '#ffffff',
        harmonyTextColor: '#ffffff',
        harmonyIconColor: '#ffffff',
        sectionBold: true,
        sectionItalic: false,
        sectionUppercase: true
      }
      : {
        background: '#000000',
        text: '#f8fafc',
        muted: '#cbd5e1',
        chordColor: '#d9ad65',
        sectionColor: '#f2c66d',
        harmonyTextColor: '#8bd3dd',
        harmonyIconColor: '#d9ad65',
        sectionBold: true,
        sectionItalic: false,
        sectionUppercase: true
      };
  }

  if (state.stageTheme === 'standard-light') {
    return {
      background: '#f8fafc',
      text: '#020617',
      muted: '#334155',
      chordColor: '#1e3a8a',
      sectionColor: '#1e3a8a',
      harmonyTextColor: '#0f766e',
      harmonyIconColor: '#1e3a8a',
      sectionBold: true,
      sectionItalic: false,
      sectionUppercase: true
    };
  }

  if (state.stageTheme === 'coffeehouse') {
    return {
      background: '#110d0a',
      text: '#f4ead2',
      muted: '#cdbb96',
      chordColor: '#d9ad65',
      sectionColor: '#f4ead2',
      harmonyTextColor: '#f3a683',
      harmonyIconColor: '#d9ad65',
      sectionBold: true,
      sectionItalic: false,
      sectionUppercase: true
    };
  }

  if (state.stageTheme === 'high-contrast') {
    return {
      background: '#000000',
      text: '#ffffff',
      muted: '#ffffff',
      chordColor: '#ffffff',
      sectionColor: '#ffffff',
      harmonyTextColor: '#ffffff',
      harmonyIconColor: '#ffffff',
      sectionBold: true,
      sectionItalic: false,
      sectionUppercase: true
    };
  }

  if (state.stageTheme === 'outdoor') {
    return {
      background: '#ffffff',
      text: '#000000',
      muted: '#111827',
      chordColor: '#000000',
      sectionColor: '#000000',
      harmonyTextColor: '#000000',
      harmonyIconColor: '#000000',
      sectionBold: true,
      sectionItalic: false,
      sectionUppercase: true
    };
  }

  const documentTheme = getDocumentThemePreset(receiver.blackBackground ? 'dark-stage' : getEffectiveDocumentTheme(state));
  return {
    background: documentTheme.background,
    text: documentTheme.text,
    muted: documentTheme.muted,
    chordColor: getEffectiveChordFontColor(state),
    sectionColor: getEffectiveSectionFontColor(state),
    harmonyTextColor: getEffectiveHarmonyTextColor(state),
    harmonyIconColor: getEffectiveHarmonyIconColor(state),
    sectionBold: getEffectiveSectionBold(state),
    sectionItalic: getEffectiveSectionItalic(state),
    sectionUppercase: getEffectiveSectionUppercase(state)
  };
}

function resolveRenderableColor(value: string, resolver: (color: string) => string) {
  return /^#|^rgb|^hsl|^var\(/i.test(value) ? value : resolver(value);
}

function receiverDisplayModeLabel(mode: ReceiverDisplayMode) {
  return receiverDisplayModeOptions.find((option) => option.value === mode)?.label ?? 'Landscape Lyrics Mode';
}

function receiverRotationLabel(mode: ReceiverDisplayMode) {
  if (mode === 'rotate-90-cw') return '90 clockwise';
  if (mode === 'rotate-90-ccw') return '90 counterclockwise';
  return 'none';
}

function calculateReceiverLayout(settings: ReceiverDisplaySettings, viewportWidth: number, viewportHeight: number) {
  if (settings.displayMode === 'landscape-lyrics') {
    return {
      contentWidth: viewportWidth,
      contentHeight: viewportHeight,
      rotation: 0,
      scale: 1
    };
  }

  const rotation = settings.displayMode === 'rotate-90-cw' ? 90 : settings.displayMode === 'rotate-90-ccw' ? -90 : 0;
  const contentWidth = 1080;
  const contentHeight = 1920;
  const rotatedWidth = Math.abs(rotation) === 90 ? contentHeight : contentWidth;
  const rotatedHeight = Math.abs(rotation) === 90 ? contentWidth : contentHeight;
  const fitScale = Math.min(viewportWidth / rotatedWidth, viewportHeight / rotatedHeight);
  const fillScale = Math.max(viewportWidth / rotatedWidth, viewportHeight / rotatedHeight);
  const shouldFill = settings.displayMode === 'fill-portrait-crop-safe' || settings.displayMode === 'rotate-90-cw' || settings.displayMode === 'rotate-90-ccw';
  const scale = Math.max(0.1, shouldFill ? fillScale : fitScale);
  return { contentWidth, contentHeight, rotation, scale };
}

function scaleReceiverPerformanceState(state: PerformanceState, receiver: ReceiverDisplaySettings, typography?: RemoteReceiverPayload['typography']): PerformanceState {
  const scale = receiver.fontScale;
  const scaledLyric = Math.round((typography?.lyricFontSize ?? getEffectiveLyricFontSize(state)) * scale);
  const scaledHeader = Math.round((typography?.headerFontSize ?? getEffectiveHeaderFontSize(state)) * scale);
  const scaledTitle = Math.round((typography?.songTitleFontSize ?? getEffectiveSongTitleFontSize(state)) * scale);
  const scaledArtist = Math.round((typography?.songArtistFontSize ?? getEffectiveSongArtistFontSize(state)) * scale);
  const scaledChord = Math.round((typography?.chordFontSize ?? getEffectiveChordFontSize(state)) * scale);
  const scaledSection = Math.round((typography?.sectionFontSize ?? getEffectiveSectionFontSize(state)) * scale);
  const scaledLineSpacing = typography?.lineSpacing ?? getEffectiveLineSpacing(state);
  return {
    ...state,
    activeProfile: 'prompter-display',
    theme: receiver.blackBackground ? 'dark' : state.theme,
    documentTheme: receiver.blackBackground ? 'dark-stage' : state.documentTheme,
    fontSize: scaledLyric,
    fontSizesByProfile: { ...(state.fontSizesByProfile ?? {}), 'prompter-display': scaledLyric },
    headerFontSize: scaledHeader,
    headerFontSizesByProfile: { ...(state.headerFontSizesByProfile ?? {}), 'prompter-display': scaledHeader },
    songTitleFontSize: scaledTitle,
    songTitleFontSizesByProfile: { ...(state.songTitleFontSizesByProfile ?? {}), 'prompter-display': scaledTitle },
    songArtistFontSize: scaledArtist,
    songArtistFontSizesByProfile: { ...(state.songArtistFontSizesByProfile ?? {}), 'prompter-display': scaledArtist },
    chordFontSize: scaledChord,
    chordFontSizesByProfile: { ...(state.chordFontSizesByProfile ?? {}), 'prompter-display': scaledChord },
    sectionFontSize: scaledSection,
    sectionFontSizesByProfile: { ...(state.sectionFontSizesByProfile ?? {}), 'prompter-display': scaledSection },
    lineSpacing: scaledLineSpacing,
    lineSpacingsByProfile: { ...(state.lineSpacingsByProfile ?? {}), 'prompter-display': scaledLineSpacing },
    receiverDisplay: receiver
  };
}

function clampNumber(value: number, min: number, max: number) {
  if (!Number.isFinite(value)) return min;
  return Math.max(min, Math.min(max, value));
}

function SettingsCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="rounded-md border border-slate-300 bg-white p-4">
      <h2 className="mb-3 text-lg font-semibold">{title}</h2>
      {children}
    </section>
  );
}

function PwaUpdateBanner({
  stageSurface,
  onUpdate,
  onLater
}: {
  stageSurface: boolean;
  onUpdate: () => void;
  onLater: () => void;
}) {
  return (
    <section
      className={`${stageSurface ? 'fixed left-1/2 top-4 z-[90] w-[min(32rem,calc(100vw-1.5rem))] -translate-x-1/2' : 'sticky top-0 z-40'} border border-teal-300 bg-teal-50 px-4 py-3 text-teal-950 shadow-lg`}
      role="status"
      aria-live="polite"
    >
      <div className="mx-auto flex max-w-5xl flex-wrap items-center gap-3">
        <div className="min-w-0 flex-1">
          <div className="font-semibold">OpenStage update available</div>
          <div className="text-xs text-teal-800">Reload when you are ready to use the newest version.</div>
        </div>
        <button className="primary-button h-9 bg-teal-700 px-3 text-xs" type="button" onClick={onUpdate}>
          Update Now
        </button>
        <button className="secondary-button h-9 px-3 text-xs" type="button" onClick={onLater}>
          Later
        </button>
      </div>
    </section>
  );
}

function DiagnosticsView({
  diagnostics,
  logs,
  syncStatus,
  conflicts,
  onClearLogs,
  pwaUpdate,
  onCheckPwaUpdate
}: {
  diagnostics: RenderDiagnostics;
  logs: AppLogEntry[];
  syncStatus: string;
  conflicts: SyncConflict[];
  onClearLogs: () => void;
  pwaUpdate: PwaUpdateSnapshot;
  onCheckPwaUpdate: () => void;
}) {
  const memory = getMemoryUsage();

  return (
    <main className="min-h-[calc(100vh-105px)] p-4">
      <div className="mx-auto grid max-w-5xl gap-4 md:grid-cols-2">
        <SettingsCard title="Performance Metrics">
          <div className="grid gap-2 text-sm">
            <Metric label="Last render" value={`${diagnostics.lastRenderMs} ms`} />
            <Metric label="Parse/preload" value={`${diagnostics.lastParseMs} ms`} />
            <Metric label="Render cache" value={`${diagnostics.renderCacheSize} song view(s)`} />
            <Metric label="Parsed lines" value={String(diagnostics.parsedLineCount)} />
            <Metric label="Memory" value={memory} />
          </div>
        </SettingsCard>
        <SettingsCard title="Sync Diagnostics">
          <p className="text-sm">Status: {syncStatus}</p>
          <p className="mt-2 text-sm">Conflicts: {conflicts.length}</p>
        </SettingsCard>
        <SettingsCard title="PWA Update Diagnostics">
          <div className="grid gap-2 text-sm">
            <Metric label="Service worker" value={pwaUpdate.supported ? pwaUpdate.registrationState : 'Service worker not active'} />
            <Metric label="Active worker" value={pwaUpdate.activeState} />
            <Metric label="Waiting worker" value={pwaUpdate.waitingState} />
            <Metric label="Installing worker" value={pwaUpdate.installingState} />
            <Metric label="Update waiting" value={pwaUpdate.updateWaiting ? 'yes' : 'no'} />
            <Metric label="App version" value={pwaUpdate.appVersion} />
            <Metric label="Build time" value={pwaUpdate.buildTime} />
            <Metric label="Last update check" value={pwaUpdate.lastCheckedAt ? new Date(pwaUpdate.lastCheckedAt).toLocaleString() : '-'} />
            {pwaUpdate.lastError && <div className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-xs font-semibold text-red-700">{pwaUpdate.lastError}</div>}
            <button className="secondary-button w-fit" type="button" onClick={onCheckPwaUpdate}>
              Check for App Update
            </button>
          </div>
        </SettingsCard>
        <section className="rounded-md border border-slate-300 bg-white p-4 md:col-span-2">
          <div className="mb-3 flex items-center gap-3">
            <h2 className="text-lg font-semibold">Application Logs</h2>
            <button className="secondary-button ml-auto" onClick={onClearLogs}>Clear logs</button>
          </div>
          <div className="grid max-h-96 gap-2 overflow-auto">
            {logs.length === 0 ? (
              <p className="text-sm text-slate-600">No logged issues.</p>
            ) : (
              logs.map((log) => (
                <div key={log.id} className="rounded border border-slate-200 bg-slate-50 p-3 text-sm">
                  <div className="font-semibold">{log.level.toUpperCase()} - {log.message}</div>
                  <div className="text-xs text-slate-500">{new Date(log.createdAt).toLocaleString()}</div>
                  {log.detail && <pre className="mt-2 whitespace-pre-wrap text-xs">{log.detail}</pre>}
                </div>
              ))
            )}
          </div>
        </section>
      </div>
    </main>
  );
}

function StorageErrorView({ message }: { message: string }) {
  return (
    <main className="min-h-[calc(100vh-105px)] bg-slate-100 p-4">
      <div className="mx-auto max-w-3xl rounded-md border border-red-300 bg-white p-5 shadow-sm">
        <div className="mb-3 flex items-center gap-2 text-red-700">
          <AlertTriangle size={22} />
          <h2 className="text-xl font-semibold">OpenStage storage is unavailable</h2>
        </div>
        <p className="text-slate-700">
          The app started, but local offline storage could not be opened. On iPad Safari this can happen in Private Browsing,
          when storage is disabled, or when the browser blocks IndexedDB for the current address.
        </p>
        <pre className="mt-4 overflow-auto rounded-md bg-red-50 p-3 text-sm text-red-900">{message}</pre>
        <p className="mt-4 text-sm text-slate-600">Open the app with <span className="font-mono">?debug=true</span> to see startup diagnostics.</p>
      </div>
    </main>
  );
}

function NewSongMenu({ align, onSelect }: { align: 'left' | 'right'; onSelect: (action: NewSongAction) => void }) {
  return (
    <div className={`absolute top-full z-50 mt-2 w-56 overflow-hidden rounded-md border border-slate-700 bg-slate-950 text-sm text-white shadow-2xl ${align === 'right' ? 'right-0' : 'left-0'}`}>
      <button className="flex w-full items-center gap-2 px-3 py-3 text-left hover:bg-white/10" type="button" onClick={() => onSelect('scratch')}>
        <Pencil size={16} /> Create From Scratch
      </button>
      <button className="flex w-full items-center gap-2 border-t border-slate-800 px-3 py-3 text-left hover:bg-white/10" type="button" onClick={() => onSelect('ai')}>
        <Sparkles size={16} /> AI Import
      </button>
      <button className="flex w-full items-center gap-2 border-t border-slate-800 px-3 py-3 text-left hover:bg-white/10" type="button" onClick={() => onSelect('receive')}>
        <Download size={16} /> Receive Song
      </button>
    </div>
  );
}

function ReceiveSongModal({ onClose, onReceive }: { onClose: () => void; onReceive: (shareId: string) => void }) {
  const [shareCode, setShareCode] = useState('');
  const [error, setError] = useState('');

  function receive() {
    const code = shareCode.trim();
    if (!code) {
      setError('Enter a share code first.');
      return;
    }
    onReceive(code);
  }

  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center bg-black/45 px-4 py-6 backdrop-blur-sm" onClick={onClose}>
      <section
        className="w-full max-w-md rounded-xl border border-slate-300 bg-white p-5 text-slate-950 shadow-2xl"
        role="dialog"
        aria-modal="true"
        aria-label="Receive Song"
        onClick={(event) => event.stopPropagation()}
      >
        <h2 className="text-2xl font-semibold">Receive Song</h2>
        <label className="mt-4 grid gap-2">
          <span className="text-sm font-semibold text-slate-700">Share Code</span>
          <input
            className="input font-mono text-lg font-semibold uppercase tracking-wide"
            value={shareCode}
            autoFocus
            onChange={(event) => {
              setShareCode(event.target.value);
              if (error) setError('');
            }}
            onKeyDown={(event) => {
              if (event.key === 'Enter') receive();
            }}
          />
        </label>
        <p className="mt-3 text-sm leading-6 text-slate-600">
          Have another musician choose Share Song and send you the share code.
        </p>
        {error && <div className="mt-3 rounded-md border border-amber-300 bg-amber-50 px-3 py-2 text-sm font-semibold text-amber-900">{error}</div>}
        <div className="mt-5 flex flex-wrap justify-end gap-2">
          <button className="secondary-button" type="button" onClick={onClose}>
            Cancel
          </button>
          <button className="primary-button" type="button" onClick={receive}>
            Receive
          </button>
        </div>
      </section>
    </div>
  );
}

function AiImportSongModal({ onClose, onImport }: { onClose: () => void; onImport: (song: Song) => Promise<void> }) {
  const [title, setTitle] = useState('');
  const [artist, setArtist] = useState('');
  const [preferredKey, setPreferredKey] = useState('');
  const [capo, setCapo] = useState('0');
  const [preview, setPreview] = useState<Song | null>(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const generate = async () => {
    const requestTitle = title.trim();
    const requestArtist = artist.trim();
    if (!requestTitle || !requestArtist) {
      setError('Song title and artist are required.');
      return;
    }

    setLoading(true);
    setError('');
    try {
      const response = await fetch(`${openStageApiBaseUrl}/api/ai-import-song`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: requestTitle,
          artist: requestArtist,
          key: preferredKey.trim(),
          capo: capo.trim() === '' ? 0 : Number(capo)
        })
      });
      const data = await response.json().catch(() => null);
      if (!response.ok || !data?.ok || !data.song) throw new Error('AI import failed');
      const nextSong = songFromAiImport(data.song);
      setPreview(nextSong);
      setTitle(nextSong.title);
      setArtist(nextSong.artist);
      setPreferredKey(nextSong.key);
      setCapo(String(nextSong.capo ?? 0));
    } catch {
      setError('AI Import failed. Try again or use Paste Webpage Chart.');
    } finally {
      setLoading(false);
    }
  };

  const importPreview = async () => {
    if (!preview) return;
    setSaving(true);
    setError('');
    try {
      await onImport({
        ...preview,
        title: preview.title.trim() || title.trim(),
        artist: preview.artist.trim() || artist.trim(),
        key: preview.key.trim(),
        capo: Math.max(0, Math.round(Number(preview.capo ?? 0) || 0)),
        bpm: Number.isFinite(Number(preview.bpm)) && Number(preview.bpm) > 0 ? Math.round(Number(preview.bpm)) : 0,
        chart: preview.chart,
        rawChordPro: preview.chart,
        parsedChordPro: parseChordPro(preview.chart),
        updatedAt: new Date().toISOString()
      });
    } catch {
      setError('AI Import failed. Try again or use Paste Webpage Chart.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center bg-black/60 p-3">
      <div className="max-h-[min(92vh,760px)] w-[min(56rem,100%)] overflow-hidden rounded-xl border border-slate-700 bg-slate-950 text-slate-100 shadow-2xl">
        <div className="flex items-center justify-between gap-3 border-b border-slate-800 px-4 py-3">
          <div>
            <h2 className="text-lg font-semibold">AI Import Song</h2>
            <p className="text-xs text-slate-400">Generate a draft chart through OpenStage-API, then preview before saving.</p>
          </div>
          <button className="icon-button" type="button" aria-label="Close AI Import" onClick={onClose}>
            <X size={18} />
          </button>
        </div>

        <div className="max-h-[calc(min(92vh,760px)-4rem)] overflow-y-auto p-4">
          <div className="grid gap-3 md:grid-cols-2">
            <label className="grid gap-1 text-sm font-semibold">
              Song Title <span className="text-red-300">*</span>
              <input className="rounded-md border border-slate-700 bg-slate-900 px-3 py-2 text-slate-100 outline-none focus:border-teal-400" value={title} onChange={(event) => setTitle(event.target.value)} />
            </label>
            <label className="grid gap-1 text-sm font-semibold">
              Artist <span className="text-red-300">*</span>
              <input className="rounded-md border border-slate-700 bg-slate-900 px-3 py-2 text-slate-100 outline-none focus:border-teal-400" value={artist} onChange={(event) => setArtist(event.target.value)} />
            </label>
            <label className="grid gap-1 text-sm font-semibold">
              Preferred Key <span className="text-slate-500">optional</span>
              <input className="rounded-md border border-slate-700 bg-slate-900 px-3 py-2 text-slate-100 outline-none focus:border-teal-400" value={preferredKey} onChange={(event) => setPreferredKey(event.target.value)} />
            </label>
            <label className="grid gap-1 text-sm font-semibold">
              Capo <span className="text-slate-500">optional</span>
              <input className="rounded-md border border-slate-700 bg-slate-900 px-3 py-2 text-slate-100 outline-none focus:border-teal-400" type="number" min="0" max="12" step="1" value={capo} onChange={(event) => setCapo(event.target.value)} />
            </label>
          </div>

          <div className="mt-4 flex flex-wrap gap-2">
            <button className="rounded-md bg-teal-600 px-4 py-2 text-sm font-semibold text-white hover:bg-teal-500 disabled:cursor-wait disabled:opacity-60" type="button" disabled={loading || !title.trim() || !artist.trim()} onClick={generate}>
              {loading ? 'Generating chart...' : preview ? 'Regenerate' : 'Generate Chart'}
            </button>
            <button className="rounded-md border border-slate-700 px-4 py-2 text-sm font-semibold hover:bg-white/10" type="button" onClick={onClose}>
              Cancel
            </button>
          </div>
          {error && <div className="mt-3 rounded-md border border-red-400/30 bg-red-500/10 px-3 py-2 text-sm text-red-100">{error}</div>}

          {preview && (
            <div className="mt-5 grid gap-3 rounded-lg border border-slate-800 bg-slate-900/70 p-3">
              <h3 className="font-semibold">Preview Before Saving</h3>
              <div className="grid gap-3 md:grid-cols-2">
                <label className="grid gap-1 text-sm font-semibold">
                  Title
                  <input className="rounded-md border border-slate-700 bg-slate-950 px-3 py-2 text-slate-100 outline-none focus:border-teal-400" value={preview.title} onChange={(event) => setPreview({ ...preview, title: event.target.value })} />
                </label>
                <label className="grid gap-1 text-sm font-semibold">
                  Artist
                  <input className="rounded-md border border-slate-700 bg-slate-950 px-3 py-2 text-slate-100 outline-none focus:border-teal-400" value={preview.artist} onChange={(event) => setPreview({ ...preview, artist: event.target.value })} />
                </label>
                <label className="grid gap-1 text-sm font-semibold">
                  Key
                  <input className="rounded-md border border-slate-700 bg-slate-950 px-3 py-2 text-slate-100 outline-none focus:border-teal-400" value={preview.key} onChange={(event) => setPreview({ ...preview, key: event.target.value })} />
                </label>
                <label className="grid gap-1 text-sm font-semibold">
                  Capo
                  <input className="rounded-md border border-slate-700 bg-slate-950 px-3 py-2 text-slate-100 outline-none focus:border-teal-400" type="number" min="0" max="12" step="1" value={preview.capo ?? 0} onChange={(event) => setPreview({ ...preview, capo: Number(event.target.value) || 0 })} />
                </label>
                <label className="grid gap-1 text-sm font-semibold">
                  BPM
                  <input className="rounded-md border border-slate-700 bg-slate-950 px-3 py-2 text-slate-100 outline-none focus:border-teal-400" type="number" min="0" step="1" value={preview.bpm || ''} onChange={(event) => setPreview({ ...preview, bpm: Number(event.target.value) || 0 })} />
                </label>
              </div>
              <label className="grid gap-1 text-sm font-semibold">
                Chart
                <textarea className="min-h-[18rem] rounded-md border border-slate-700 bg-slate-950 px-3 py-2 font-mono text-sm text-slate-100 outline-none focus:border-teal-400" value={preview.chart} onChange={(event) => setPreview({ ...preview, chart: event.target.value })} />
              </label>
              <div className="flex flex-wrap gap-2">
                <button className="rounded-md bg-teal-600 px-4 py-2 text-sm font-semibold text-white hover:bg-teal-500 disabled:cursor-wait disabled:opacity-60" type="button" disabled={saving} onClick={importPreview}>
                  {saving ? 'Importing...' : 'Import Song'}
                </button>
                <button className="rounded-md border border-slate-700 px-4 py-2 text-sm font-semibold hover:bg-white/10 disabled:cursor-wait disabled:opacity-60" type="button" disabled={loading} onClick={generate}>
                  Regenerate
                </button>
                <button className="rounded-md border border-slate-700 px-4 py-2 text-sm font-semibold hover:bg-white/10" type="button" onClick={onClose}>
                  Cancel
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function LibraryView({
  songs,
  query,
  setQuery,
  smartFilter,
  setSmartFilter,
  onNewSongAction,
  onSelect,
  onToggleFavorite
}: {
  songs: Song[];
  query: string;
  setQuery: (query: string) => void;
  smartFilter: string;
  setSmartFilter: (filter: string) => void;
  onNewSongAction: (action: NewSongAction) => void;
  onSelect: (id: string) => void;
  onToggleFavorite: (id: string) => void;
}) {
  const [visibleCount, setVisibleCount] = useState(80);
  const visibleSongs = songs.slice(0, visibleCount);
  const [newSongMenuOpen, setNewSongMenuOpen] = useState(false);

  useEffect(() => setVisibleCount(80), [query, smartFilter]);

  return (
    <main className="library-screen min-h-[calc(100vh-105px)] bg-slate-100 p-4 text-slate-950">
      <section className="mx-auto grid max-w-7xl gap-3">
        <div className="flex flex-col gap-2 md:flex-row">
          <label className="flex h-11 flex-1 items-center gap-2 rounded-md border border-slate-300 bg-white px-3">
            <Search size={18} className="text-slate-500" />
            <input
              className="w-full bg-transparent text-sm outline-none"
              placeholder="Search songs, artists, keys, tags"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
            />
          </label>
          <select
            className="h-11 rounded-md border border-slate-300 bg-white px-3 text-sm"
            value={smartFilter}
            onChange={(event) => setSmartFilter(event.target.value)}
          >
            <option value="all">All songs</option>
            <option value="acoustic">Acoustic songs</option>
            <option value="capo">Capo songs</option>
            <option value="female">Female vocal songs</option>
            <option value="easy">Easy songs</option>
            <option value="fast">90 BPM+</option>
          </select>
          <div className="relative">
            <button
              className="h-11 rounded-md bg-teal-600 px-4 text-sm font-semibold text-white hover:bg-teal-500"
              type="button"
              onClick={() => setNewSongMenuOpen((open) => !open)}
            >
              + New Song
            </button>
            {newSongMenuOpen && (
              <NewSongMenu
                align="right"
                onSelect={(action) => {
                  setNewSongMenuOpen(false);
                  onNewSongAction(action);
                }}
              />
            )}
          </div>
        </div>
        <div className="overflow-hidden rounded-md border border-slate-300 bg-white">
          <div className="library-header grid grid-cols-[2.5rem_minmax(12rem,2fr)_minmax(9rem,1fr)_5rem_5rem_5rem_minmax(10rem,1fr)] gap-3 border-b border-slate-200 bg-slate-50 px-3 py-2 text-xs font-semibold uppercase text-slate-500">
            <div>Fav</div>
            <div>Title</div>
            <div>Artist</div>
            <div>Key</div>
            <div>Capo</div>
            <div>BPM</div>
            <div>Tags</div>
          </div>
          <div
            className="max-h-[calc(100vh-230px)] overflow-auto"
            onScroll={(event) => {
              const element = event.currentTarget;
              if (element.scrollTop + element.clientHeight > element.scrollHeight - 600) {
                setVisibleCount((count) => Math.min(songs.length, count + 120));
              }
            }}
          >
            {visibleSongs.map((song) => (
              <button
                key={song.id}
                className="library-row grid w-full grid-cols-[2.5rem_minmax(12rem,2fr)_minmax(9rem,1fr)_5rem_5rem_5rem_minmax(10rem,1fr)] gap-3 border-b border-slate-100 px-3 py-2 text-left text-sm hover:bg-teal-50"
                onClick={() => onSelect(song.id)}
              >
                <span
                  className={`inline-flex h-7 w-7 items-center justify-center rounded-full ${song.favorite ? 'text-amber-500' : 'text-slate-400 hover:text-amber-500'}`}
                  title={song.favorite ? 'Remove favorite' : 'Add favorite'}
                  onClick={(event) => {
                    event.preventDefault();
                    event.stopPropagation();
                    onToggleFavorite(song.id);
                  }}
                >
                  <Star size={18} fill={song.favorite ? 'currentColor' : 'none'} />
                </span>
                <span className="truncate font-semibold">{song.title}</span>
                <span className="truncate text-slate-600">{song.artist || 'Unknown artist'}</span>
                <span>{song.key || '-'}</span>
                <span>{song.capo ?? 0}</span>
                <span>{song.bpm || '-'}</span>
                <span className="truncate text-slate-500">{song.tags.join(', ') || '-'}</span>
              </button>
            ))}
          </div>
        </div>
      </section>
    </main>
  );
}

function SongEditorView({
  song,
  songs,
  onSave,
  onCancel,
  onDelete,
  onAddToSetlist,
  performanceState,
  setPerformanceState,
  onDirtyChange
}: {
  song: Song;
  songs: Song[];
  onSave: (song: Song) => void | Promise<void>;
  onCancel: () => void;
  onDelete: (id: string) => void | Promise<void>;
  onAddToSetlist: (id: string) => void;
  performanceState: PerformanceState;
  setPerformanceState: (next: Partial<PerformanceState>) => void;
  onDirtyChange?: (dirty: boolean) => void;
}) {
  const [draft, setDraft] = useState<Song>(song);
  const [durationDraft, setDurationDraft] = useState('');
  const [durationError, setDurationError] = useState('');
  const [conversionPreview, setConversionPreview] = useState('');
  const [enrichment, setEnrichment] = useState<EnrichmentResult | null>(null);
  const [enrichmentStatus, setEnrichmentStatus] = useState('');
  const [enrichmentError, setEnrichmentError] = useState('');
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [referenceAudioOpen, setReferenceAudioOpen] = useState(Boolean(song.referenceAudioUrl));
  const [fullScreenEditor, setFullScreenEditor] = useState(false);
  const chartEditorRef = useRef<HTMLTextAreaElement | null>(null);
  const chartSelectionRef = useRef({ start: 0, end: 0 });

  useEffect(() => {
    setDraft(song);
    setDurationDraft(song.durationSeconds ? formatDuration(song.durationSeconds) : '');
    setDurationError('');
    setConversionPreview('');
    setEnrichment(null);
    setEnrichmentStatus('');
    setEnrichmentError('');
    setDetailsOpen(false);
    setReferenceAudioOpen(Boolean(song.referenceAudioUrl));
    setFullScreenEditor(false);
  }, [song]);

  const hasUnsavedChanges = useMemo(() => {
    const parsedDuration = parseDurationInput(durationDraft);
    return JSON.stringify({ ...draft, durationSeconds: parsedDuration ?? draft.durationSeconds }) !== JSON.stringify(song);
  }, [draft, durationDraft, song]);

  useEffect(() => {
    onDirtyChange?.(hasUnsavedChanges);
    return () => onDirtyChange?.(false);
  }, [hasUnsavedChanges, onDirtyChange]);

  useEffect(() => {
    function handleShortcut(event: KeyboardEvent) {
      if (event.ctrlKey && event.shiftKey && event.key.toLowerCase() === 'f') {
        event.preventDefault();
        setFullScreenEditor((enabled) => !enabled);
      }
    }
    window.addEventListener('keydown', handleShortcut);
    return () => window.removeEventListener('keydown', handleShortcut);
  }, []);

  async function saveDraft() {
    const parsedDuration = parseDurationInput(durationDraft);
    if (durationDraft.trim() && parsedDuration === undefined) {
      setDurationError('Use formats like 3:45 or 1:02:30');
      return;
    }
    await onSave({ ...draft, durationSeconds: parsedDuration });
  }

  function cancelEditor() {
    if (hasUnsavedChanges && !window.confirm('Discard unsaved changes?')) return;
    onCancel();
  }

  async function runEnrichmentLookup() {
    setEnrichmentStatus('Looking up MusicBrainz, Last.fm, Deezer, and local matches...');
    setEnrichmentError('');
    setEnrichment(null);
    try {
      const result = await enrichSongMetadata({ ...draft, durationSeconds: parseDurationInput(durationDraft) ?? draft.durationSeconds }, songs);
      setEnrichment(result);
      const foundCount = result.proposals.length;
      const missingCount = result.unavailable.length;
      setEnrichmentStatus(`Found ${foundCount} field proposal${foundCount === 1 ? '' : 's'}; ${missingCount} field${missingCount === 1 ? '' : 's'} not found.`);
    } catch (error) {
      setEnrichmentError(error instanceof Error ? error.message : String(error));
      setEnrichmentStatus('');
    }
  }

  function applyEnrichmentPreview(overwrite = false) {
    if (!enrichment) return;
    if (overwrite && !window.confirm('Apply all proposed metadata and overwrite existing populated values?')) return;
    const next = applyEnrichment({ ...draft, durationSeconds: parseDurationInput(durationDraft) ?? draft.durationSeconds }, enrichment.proposals, overwrite);
    setDraft(next);
    setDurationDraft(next.durationSeconds ? formatDuration(next.durationSeconds) : '');
    setEnrichment(null);
    setEnrichmentStatus(overwrite ? 'Applied all proposed metadata.' : 'Applied missing metadata only.');
  }

  function updateChartFromSelection(updater: (chart: string, start: number, end: number) => string) {
    const editor = chartEditorRef.current;
    const liveStart = editor?.selectionStart;
    const liveEnd = editor?.selectionEnd;
    const remembered = chartSelectionRef.current;
    const hasLiveSelection = typeof liveStart === 'number' && typeof liveEnd === 'number' && liveStart !== liveEnd;
    const hasRememberedSelection = remembered.start !== remembered.end;
    const start = hasLiveSelection ? liveStart : hasRememberedSelection ? remembered.start : liveStart ?? remembered.start ?? 0;
    const end = hasLiveSelection ? liveEnd : hasRememberedSelection ? remembered.end : liveEnd ?? remembered.end ?? start;
    const nextChart = updater(draft.chart, start, end);
    setDraft({ ...draft, chart: nextChart });
    chartSelectionRef.current = { start, end: start };
    window.requestAnimationFrame(() => {
      chartEditorRef.current?.focus();
      const nextPosition = Math.min(nextChart.length, start);
      chartEditorRef.current?.setSelectionRange(nextPosition, nextPosition);
    });
  }

  function markHarmonySelection() {
    updateChartFromSelection((chart, start, end) => markHarmonyRange(chart, start, end));
  }

  function removeHarmonySelection() {
    updateChartFromSelection((chart, start, end) => removeHarmonyRange(chart, start, end));
  }

  function rememberChartSelection() {
    const editor = chartEditorRef.current;
    if (!editor) return;
    chartSelectionRef.current = { start: editor.selectionStart, end: editor.selectionEnd };
  }

  if (fullScreenEditor) {
    const hasPlayableReferenceAudio = isDirectReferenceAudioUrl(draft.referenceAudioUrl || '');
    const hasExternalReferenceLink = Boolean(draft.referenceAudioUrl?.trim()) && !hasPlayableReferenceAudio;
    return (
      <main className="fixed inset-0 z-[100] grid min-h-[100dvh] grid-rows-[auto_auto_1fr] bg-slate-950 text-slate-100">
        <div className="flex min-h-12 items-center gap-2 border-b border-slate-800 bg-slate-950/95 px-2 pb-1.5 pt-[max(0.35rem,env(safe-area-inset-top))] shadow-lg backdrop-blur sm:px-3">
          <div className="min-w-0 flex-1">
            <div className="truncate text-sm font-semibold leading-tight sm:text-base">{draft.title || 'Untitled Song'}</div>
            <div className="truncate text-[0.68rem] leading-tight text-slate-400 sm:text-xs">{draft.artist || 'Unknown artist'}{hasUnsavedChanges ? ' - Unsaved changes' : ''}</div>
          </div>
          {hasExternalReferenceLink && (
            <button className="stage-menu-button hidden h-9 sm:inline-flex" type="button" onClick={() => window.open(draft.referenceAudioUrl?.trim(), '_blank', 'noopener,noreferrer')}>
              Reference Link
            </button>
          )}
          <button className="primary-button h-9 px-2 text-xs sm:px-3 sm:text-sm" type="button" onClick={() => void saveDraft()}>
            <Save size={18} />
            Save
          </button>
          <button className="secondary-button h-9 border-slate-700 bg-slate-900 px-2 text-xs text-slate-100 sm:px-3 sm:text-sm" type="button" onClick={cancelEditor}>
            Cancel
          </button>
          <button className="secondary-button h-9 border-slate-700 bg-slate-900 px-2 text-xs text-slate-100 sm:px-3 sm:text-sm" type="button" onClick={() => setFullScreenEditor(false)}>
            <X size={18} />
            <span className="hidden sm:inline">Exit Full Screen</span>
            <span className="sm:hidden">Exit</span>
          </button>
        </div>
        {hasPlayableReferenceAudio ? (
          <ReferenceAudioControls
            url={draft.referenceAudioUrl || ''}
            onChange={(referenceAudioUrl) => setDraft({ ...draft, referenceAudioUrl })}
            compact
            miniPlayer
            dense
          />
        ) : <div />}
        <section className="grid min-h-0 grid-rows-[auto_1fr] gap-1 px-2 pb-[max(0.45rem,env(safe-area-inset-bottom))] pt-1 sm:px-3">
          <div className="flex flex-wrap items-center gap-2 text-[0.68rem] leading-tight text-slate-400">
            <span>ChordPro, OnSong text, and chords-over-lyrics spacing are preserved.</span>
            {hasExternalReferenceLink && <span className="text-amber-200">Reference link is external; use a direct audio file URL for the mini-player.</span>}
            <span className="ml-auto hidden sm:inline">Ctrl+Shift+F toggles full screen</span>
          </div>
          <textarea
            ref={chartEditorRef}
            className="h-full min-h-[40dvh] w-full resize-none rounded-md border border-slate-700 bg-black p-3 font-mono text-base leading-7 text-slate-100 outline-none focus:border-teal-400 sm:p-4 sm:text-lg sm:leading-8"
            value={draft.chart}
            spellCheck={false}
            autoFocus
            onSelect={rememberChartSelection}
            onKeyUp={rememberChartSelection}
            onMouseUp={rememberChartSelection}
            onTouchEnd={rememberChartSelection}
            onChange={(event) => setDraft({ ...draft, chart: event.target.value })}
          />
        </section>
      </main>
    );
  }

  return (
    <main className="min-h-[calc(100vh-105px)] bg-slate-100 p-4 text-slate-950">
      <section className="mx-auto max-w-6xl">
        <div className="sticky top-[4.5rem] z-20 mb-4 flex flex-wrap items-center gap-2 rounded-md border border-slate-300 bg-white/95 p-2 shadow-sm backdrop-blur">
          <button className="secondary-button h-10" type="button" onClick={cancelEditor}>
            <ChevronLeft size={18} />
            Back to Library
          </button>
          <button className="primary-button h-10" type="submit" form="song-editor-form">
            <Save size={18} />
            Save
          </button>
          <button className="secondary-button h-10" type="button" onClick={cancelEditor}>
            Cancel
          </button>
          <button className="secondary-button h-10" type="button" onClick={() => setFullScreenEditor(true)}>
            <Expand size={18} />
            Full Screen Editor
          </button>
          <h2 className="ml-auto text-sm font-semibold text-slate-600 sm:text-base">Song Editor</h2>
        </div>
          <form
            id="song-editor-form"
            className="mx-auto grid max-w-6xl gap-4"
            onSubmit={(event) => {
              event.preventDefault();
              void saveDraft();
            }}
          >
            <section className="rounded-md border border-slate-300 bg-white p-4">
              <div className="flex flex-wrap items-start gap-4">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <button
                      className={`inline-flex h-9 w-9 items-center justify-center rounded-full border ${draft.favorite ? 'border-amber-300 bg-amber-50 text-amber-500' : 'border-slate-300 bg-white text-slate-400'}`}
                      type="button"
                      title={draft.favorite ? 'Remove favorite' : 'Add favorite'}
                      onClick={() => setDraft({ ...draft, favorite: !Boolean(draft.favorite) })}
                    >
                      <Star size={20} fill={draft.favorite ? 'currentColor' : 'none'} />
                    </button>
                    <div className="truncate text-2xl font-semibold leading-tight">{draft.title || 'Untitled Song'}</div>
                  </div>
                  <div className="text-base text-slate-600">{draft.artist || 'Unknown artist'}</div>
                  <div className="mt-3 flex flex-wrap gap-2 text-sm">
                    <button className="rounded bg-slate-100 px-3 py-1" type="button" onClick={() => setDetailsOpen(true)}>Key: {draft.key || '-'}</button>
                    <button className="rounded bg-slate-100 px-3 py-1" type="button" onClick={() => setDetailsOpen(true)}>Capo: {draft.capo ?? 0}</button>
                    <button className="rounded bg-slate-100 px-3 py-1" type="button" onClick={() => setDetailsOpen(true)}>BPM: {draft.bpm || '-'}</button>
                    <button className="rounded bg-slate-100 px-3 py-1" type="button" onClick={() => setDetailsOpen(true)}>Duration: {durationDraft || '-'}</button>
                    <button className="rounded bg-slate-100 px-3 py-1" type="button" onClick={() => setDetailsOpen(true)}>Display: {draft.displayPreference === 'chords-over' ? 'Chords Over Lyrics' : 'Inline Chords'}</button>
                  </div>
                </div>
                <button className="secondary-button h-10" type="button" onClick={() => setDetailsOpen((open) => !open)}>
                  {detailsOpen ? <ChevronDown size={18} /> : <ChevronRight size={18} />}
                  Edit Song Details
                </button>
              </div>
            </section>

            <section className="rounded-md border border-slate-300 bg-white">
              <button
                className="flex w-full items-center gap-2 px-4 py-3 text-left font-semibold"
                type="button"
                onClick={() => setDetailsOpen((open) => !open)}
              >
                {detailsOpen ? <ChevronDown size={18} /> : <ChevronRight size={18} />}
                Song Details
              </button>
              {detailsOpen && (
                <div className="grid gap-4 border-t border-slate-200 p-4">
                  <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
                    <Field label="Title" value={draft.title} onChange={(value) => setDraft({ ...draft, title: value })} />
                    <Field label="Subtitle" value={draft.subtitle ?? ''} onChange={(value) => setDraft({ ...draft, subtitle: value })} />
                    <Field label="Artist" value={draft.artist} onChange={(value) => setDraft({ ...draft, artist: value })} />
                    <Field label="Album" value={draft.album ?? ''} onChange={(value) => setDraft({ ...draft, album: value })} />
                    <Field label="Key" value={draft.key} onChange={(value) => setDraft({ ...draft, key: value })} />
                    <Field label="Original Key" value={draft.originalKey ?? ''} onChange={(value) => setDraft({ ...draft, originalKey: value })} />
                    <Field label="Performance Key" value={draft.performanceKey ?? ''} onChange={(value) => setDraft({ ...draft, performanceKey: value, key: value || draft.key })} />
                    <NumberField label="Capo" value={draft.capo} onChange={(value) => setDraft({ ...draft, capo: value })} />
                    <NumberField label="BPM" value={draft.bpm} onChange={(value) => setDraft({ ...draft, bpm: value })} />
                    <DurationField
                      value={durationDraft}
                      error={durationError}
                      onChange={(value) => {
                        setDurationDraft(value);
                        if (durationError && isValidDurationInput(value)) setDurationError('');
                      }}
                      onBlur={() => {
                        if (!isValidDurationInput(durationDraft)) {
                          setDurationError('Use formats like 3:45 or 1:02:30');
                          return;
                        }
                        setDurationError('');
                        setDraft({ ...draft, durationSeconds: parseDurationInput(durationDraft) });
                      }}
                    />
                    <Field label="Time Signature" value={draft.timeSignature} onChange={(value) => setDraft({ ...draft, timeSignature: value })} />
                    <Field label="Genre" value={draft.genre ?? ''} onChange={(value) => setDraft({ ...draft, genre: value })} />
                    <Field label="Tags" value={draft.tags.join(', ')} onChange={(value) => setDraft({ ...draft, tags: value.split(',').map((tag) => tag.trim()).filter(Boolean) })} />
                    <Field label="Difficulty" value={draft.difficulty ?? ''} onChange={(value) => setDraft({ ...draft, difficulty: value })} />
                    <Field label="Vocal Range" value={draft.vocalRange ?? ''} onChange={(value) => setDraft({ ...draft, vocalRange: value })} />
                    <Field label="Vocal Difficulty" value={draft.vocalDifficulty ?? ''} onChange={(value) => setDraft({ ...draft, vocalDifficulty: value })} />
                    <Field label="Tuning" value={draft.tuning ?? ''} onChange={(value) => setDraft({ ...draft, tuning: value })} />
                    <NumberField label="Year" value={draft.year ?? 0} onChange={(value) => setDraft({ ...draft, year: value || undefined })} />
                    <NumberField label="Crowd Score" value={draft.crowdScore ?? 0} onChange={(value) => setDraft({ ...draft, crowdScore: value || undefined })} />
                    <NumberField label="Energy" value={draft.energy ?? 0} onChange={(value) => setDraft({ ...draft, energy: value || undefined })} />
                    <NumberField label="Danceability" value={draft.danceability ?? 0} onChange={(value) => setDraft({ ...draft, danceability: value || undefined })} />
                    <Field label="Vibe" value={draft.vibe ?? ''} onChange={(value) => setDraft({ ...draft, vibe: value })} />
                    <label className="flex min-h-11 items-center gap-2 rounded-md border border-slate-300 bg-white px-3 text-sm font-medium text-slate-700">
                      <input type="checkbox" checked={Boolean(draft.favorite)} onChange={(event) => setDraft({ ...draft, favorite: event.target.checked })} />
                      Favorite song
                    </label>
                    <label className="grid gap-2">
                      <span className="text-sm font-medium text-slate-700">Display</span>
                      <select className="h-11 rounded-md border border-slate-300 bg-white px-3 text-slate-950 outline-none focus:border-teal-500" value={draft.displayPreference ?? 'inline'} onChange={(event) => setDraft({ ...draft, displayPreference: event.target.value as Song['displayPreference'] })}>
                        <option value="inline">Inline chords</option>
                        <option value="chords-over">Chords over lyrics</option>
                      </select>
                    </label>
                  </div>
                  <label className="grid gap-2">
                    <span className="text-sm font-medium text-slate-700">Notes</span>
                    <textarea className="min-h-20 rounded-md border border-slate-300 bg-white p-3 text-slate-950 outline-none focus:border-teal-500" value={draft.notes} onChange={(event) => setDraft({ ...draft, notes: event.target.value })} />
                  </label>
                  <label className="grid gap-2">
                    <span className="text-sm font-medium text-slate-700">Band Member Notes</span>
                    <textarea className="min-h-20 rounded-md border border-slate-300 bg-white p-3 text-slate-950 outline-none focus:border-teal-500" value={draft.bandNotes ?? ''} onChange={(event) => setDraft({ ...draft, bandNotes: event.target.value })} />
                  </label>
                  <RehearsalNotesPanel song={draft} onChange={setDraft} />
                  <div className="flex flex-wrap gap-3 rounded-md border border-slate-300 bg-slate-50 p-3">
                    <button className="primary-button" type="button" onClick={runEnrichmentLookup}>
                      <Sparkles size={18} />
                      Enrich metadata
                    </button>
                    <label className="flex items-center gap-2 text-sm text-slate-700">
                      <input type="checkbox" checked={Boolean(draft.openerCandidate)} onChange={(event) => setDraft({ ...draft, openerCandidate: event.target.checked })} />
                      Opener candidate
                    </label>
                    <label className="flex items-center gap-2 text-sm text-slate-700">
                      <input type="checkbox" checked={Boolean(draft.closerCandidate)} onChange={(event) => setDraft({ ...draft, closerCandidate: event.target.checked })} />
                      Closer candidate
                    </label>
                    {enrichmentStatus && <span className="self-center text-sm text-slate-600">{enrichmentStatus}</span>}
                    {enrichmentError && <span className="self-center text-sm text-red-700">{enrichmentError}</span>}
                  </div>
                  {enrichment && (
                    <EnrichmentPreview
                      result={enrichment}
                      onApplyMissing={() => applyEnrichmentPreview(false)}
                      onApplyAll={() => applyEnrichmentPreview(true)}
                      onCancel={() => setEnrichment(null)}
                    />
                  )}
                </div>
              )}
            </section>

            <section className="rounded-md border border-slate-300 bg-white">
              <button
                className="flex w-full items-center gap-2 px-4 py-3 text-left font-semibold"
                type="button"
                onClick={() => setReferenceAudioOpen((open) => !open)}
              >
                {referenceAudioOpen ? <ChevronDown size={18} /> : <ChevronRight size={18} />}
                Reference Audio
              </button>
              {referenceAudioOpen && (
                <div className="border-t border-slate-200 p-4">
                  <ReferenceAudioControls
                    url={draft.referenceAudioUrl || ''}
                    onChange={(referenceAudioUrl) => setDraft({ ...draft, referenceAudioUrl })}
                    onSave={() => void saveDraft()}
                    urlEditorOnly
                  />
                </div>
              )}
            </section>

            <section className="rounded-md border border-slate-300 bg-white p-3">
              <div className="flex flex-wrap items-center gap-2">
                <h3 className="font-semibold">ChordPro / Chart Editor</h3>
                <div className="flex items-center gap-2 rounded-md border border-slate-200 bg-slate-50 px-3 py-2 text-sm">
                  <span className="font-medium text-slate-700">Chord Font Size</span>
                  <input
                    className="w-28"
                    type="range"
                    min={10}
                    max={48}
                    step={1}
                    value={getEffectiveChordFontSize(performanceState)}
                    onChange={(event) => updateChordFontSize(setPerformanceState, performanceState, Number(event.target.value))}
                  />
                  <span className="w-10 text-right font-semibold">{getEffectiveChordFontSize(performanceState)}px</span>
                </div>
                <button className="secondary-button ml-auto" type="button" onClick={() => setConversionPreview(inlineChordsToChordOverLyrics(draft.chart))}>
                  Convert Inline Chords to Chords Over Lyrics
                </button>
                <button className="secondary-button" type="button" onClick={() => setFullScreenEditor(true)}>
                  <Expand size={18} />
                  Full Screen Editor
                </button>
                <button className="secondary-button" type="button" onClick={markHarmonySelection}>
                  <Music2 size={18} />
                  Mark Harmony
                </button>
                <button className="secondary-button" type="button" onClick={removeHarmonySelection}>
                  Remove Harmony
                </button>
              </div>
              {conversionPreview && (
                <div className="mt-3 grid gap-2">
                  <textarea className="min-h-40 rounded-md border border-slate-300 bg-slate-950 p-3 font-mono text-sm text-slate-100" value={conversionPreview} readOnly />
                  <div className="flex gap-2">
                    <button className="primary-button" type="button" onClick={() => setDraft({ ...draft, chart: conversionPreview, displayPreference: 'chords-over' })}>
                      Apply preview
                    </button>
                    <button className="secondary-button" type="button" onClick={() => setConversionPreview('')}>
                      Cancel preview
                    </button>
                  </div>
                </div>
              )}
              <ReferenceAudioControls
                url={draft.referenceAudioUrl || ''}
                onChange={(referenceAudioUrl) => setDraft({ ...draft, referenceAudioUrl })}
                compact
                miniPlayer
                sticky
              />
              <label className="mt-3 grid gap-2">
                <span className="text-sm font-medium text-slate-700">Lyrics / Chord Chart</span>
                <textarea
                  ref={chartEditorRef}
                  className="min-h-[72vh] rounded-md border border-slate-300 bg-slate-950 p-4 font-mono text-base leading-7 text-slate-100 outline-none focus:border-teal-500"
                  value={draft.chart}
                  spellCheck={false}
                  onSelect={rememberChartSelection}
                  onKeyUp={rememberChartSelection}
                  onMouseUp={rememberChartSelection}
                  onTouchEnd={rememberChartSelection}
                  onChange={(event) => setDraft({ ...draft, chart: event.target.value })}
                />
              </label>
              <RawCurrentSongDebugPanel
                title="Show Raw Current Song"
                song={song}
                draftChart={draft.chart}
              />
            </section>
            <div className="flex flex-wrap gap-2">
              <button className="primary-button" type="submit">
                <Save size={18} />
                Save song
              </button>
              <button className="secondary-button" type="button" onClick={cancelEditor}>
                Cancel
              </button>
              <button className="secondary-button" type="button" onClick={() => onAddToSetlist(draft.id)}>
                <ListMusic size={18} />
                Add to setlist
              </button>
              <button className="danger-button ml-auto" type="button" onClick={() => onDelete(draft.id)}>
                <Trash2 size={18} />
                Delete
              </button>
            </div>
          </form>
      </section>
    </main>
  );
}

function RawCurrentSongDebugPanel({
  title,
  song,
  draftChart
}: {
  title: string;
  song: Song;
  draftChart?: string;
}) {
  const savedChart = song.chart ?? '';
  const savedParsed = song.parsedChordPro?.lines.length ?? parseChordPro(savedChart).lines.length;
  const savedHasHarmony = /\[\/?HARMONY\]/i.test(savedChart);
  const savedHasOohHarmony = /\[HARMONY\]\s*\(?ooh/i.test(savedChart);
  const draftHasHarmony = draftChart === undefined ? undefined : /\[\/?HARMONY\]/i.test(draftChart);
  const draftHasOohHarmony = draftChart === undefined ? undefined : /\[HARMONY\]\s*\(?ooh/i.test(draftChart);

  return (
    <details className="mt-3 rounded-md border border-fuchsia-300 bg-fuchsia-50 p-3 text-sm text-slate-950">
      <summary className="cursor-pointer font-semibold text-fuchsia-900">{title}</summary>
      <div className="mt-3 grid gap-2">
        <div className="grid gap-1 rounded bg-white/70 p-2 font-mono text-xs">
          <span>songId: {song.id}</span>
          <span>updatedAt: {song.updatedAt}</span>
          <span>saved chart has harmony tags: {savedHasHarmony ? 'yes' : 'no'}</span>
          <span>saved chart has ooh harmony: {savedHasOohHarmony ? 'yes' : 'no'}</span>
          <span>saved parsed line count: {savedParsed}</span>
          {draftChart !== undefined && <span>draft chart has harmony tags: {draftHasHarmony ? 'yes' : 'no'}</span>}
          {draftChart !== undefined && <span>draft chart has ooh harmony: {draftHasOohHarmony ? 'yes' : 'no'}</span>}
        </div>
        <label className="grid gap-1">
          <span className="font-semibold">Saved chart</span>
          <textarea className="min-h-40 rounded border border-fuchsia-200 bg-slate-950 p-2 font-mono text-xs text-slate-100" value={savedChart} readOnly />
        </label>
        {draftChart !== undefined && (
          <label className="grid gap-1">
            <span className="font-semibold">Current editor draft</span>
            <textarea className="min-h-40 rounded border border-fuchsia-200 bg-slate-950 p-2 font-mono text-xs text-slate-100" value={draftChart} readOnly />
          </label>
        )}
      </div>
    </details>
  );
}

function ReferenceAudioControls({
  url,
  onChange,
  onSave,
  compact = false,
  miniPlayer = false,
  urlEditorOnly = false,
  sticky = false,
  dense = false
}: {
  url: string;
  onChange: (url: string) => void;
  onSave?: () => void;
  compact?: boolean;
  miniPlayer?: boolean;
  urlEditorOnly?: boolean;
  sticky?: boolean;
  dense?: boolean;
}) {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [playbackRate, setPlaybackRate] = useState(1);
  const [audioError, setAudioError] = useState('');
  const [copyMessage, setCopyMessage] = useState('');
  const trimmedUrl = url.trim();
  const canPlayDirectly = isDirectReferenceAudioUrl(trimmedUrl);
  const urlKindLabel = canPlayDirectly ? 'Playable Audio URL' : 'External Reference Link';
  const shellClassName = [
    compact ? `border-b border-slate-800 bg-slate-900/95 px-2 ${dense ? 'py-1' : 'py-2'} text-slate-100 sm:px-3` : 'grid gap-3',
    sticky ? 'sticky bottom-2 z-20 rounded-md border border-slate-700 shadow-lg backdrop-blur md:bottom-auto md:top-[9rem]' : ''
  ].filter(Boolean).join(' ');

  useEffect(() => {
    setIsPlaying(false);
    setCurrentTime(0);
    setDuration(0);
    setAudioError('');
  }, [trimmedUrl]);

  useEffect(() => {
    if (audioRef.current) audioRef.current.playbackRate = playbackRate;
  }, [playbackRate]);

  async function togglePlay() {
    const audio = audioRef.current;
    if (!audio) return;
    try {
      setAudioError('');
      if (audio.paused) {
        await audio.play();
      } else {
        audio.pause();
      }
    } catch {
      setAudioError('Audio could not be played. Check the URL or browser permissions.');
    }
  }

  function skip(seconds: number) {
    const audio = audioRef.current;
    if (!audio) return;
    audio.currentTime = Math.max(0, Math.min(audio.duration || Number.MAX_SAFE_INTEGER, audio.currentTime + seconds));
  }

  function openReferenceLink() {
    if (!trimmedUrl) return;
    const opened = window.open(trimmedUrl, '_blank', 'noopener,noreferrer');
    if (opened) opened.opener = null;
  }

  async function copyReferenceLink() {
    if (!trimmedUrl) return;
    try {
      await navigator.clipboard.writeText(trimmedUrl);
      setCopyMessage('Reference link copied');
      window.setTimeout(() => setCopyMessage(''), 2200);
    } catch {
      setCopyMessage('Copy failed. Select the URL and copy it manually.');
      window.setTimeout(() => setCopyMessage(''), 3200);
    }
  }

  const externalLinkPanel = (
    <div className={`grid gap-2 rounded-md border p-3 ${compact ? 'border-slate-700 bg-black/30 text-slate-200' : 'border-slate-200 bg-slate-50 text-slate-700'}`}>
      <div className="text-xs font-semibold uppercase tracking-normal opacity-70">External Reference Link</div>
      <p className="text-sm">
        This link cannot be played inside OpenStage. Use a direct audio file URL for the in-app mini-player.
      </p>
      <div className="flex flex-wrap gap-2">
        <button className={compact ? 'stage-menu-button' : 'secondary-button'} type="button" onClick={openReferenceLink}>
          Open Reference Link in New Tab
        </button>
        <button className={compact ? 'stage-menu-button' : 'secondary-button'} type="button" onClick={() => void copyReferenceLink()}>
          Copy Reference Link
        </button>
      </div>
      {copyMessage && <div className="text-sm font-semibold text-teal-600">{copyMessage}</div>}
    </div>
  );

  return (
    <div className={shellClassName}>
      {!miniPlayer && (
        <div className={`grid gap-2 ${compact ? 'md:grid-cols-[1fr_auto] md:items-center' : ''}`}>
          <label className="grid gap-1">
            <span className={`font-medium ${compact ? 'text-xs text-slate-300' : 'text-sm text-slate-700'}`}>{trimmedUrl ? urlKindLabel : 'Reference Audio URL'}</span>
            <input
              className={`h-10 rounded-md border px-3 text-sm outline-none focus:border-teal-500 ${compact ? 'border-slate-700 bg-black text-slate-100' : 'border-slate-300 bg-white text-slate-950'}`}
              value={url}
              placeholder="https://example.com/reference-track.mp3"
              onChange={(event) => onChange(event.target.value)}
            />
          </label>
          <button className={compact ? 'stage-menu-button h-10 self-end' : 'secondary-button h-10 self-end'} type="button" onClick={() => onChange('')} disabled={!trimmedUrl}>
            Clear URL
          </button>
          {onSave && (
            <button className={compact ? 'stage-menu-button h-10 self-end' : 'primary-button h-10 self-end'} type="button" onClick={onSave}>
              <Save size={18} />
              Save with song
            </button>
          )}
        </div>
      )}

      {urlEditorOnly ? (
        trimmedUrl && !canPlayDirectly ? <div className="mt-3">{externalLinkPanel}</div> : null
      ) : !trimmedUrl ? null : canPlayDirectly ? (
        <div className={`grid ${dense ? 'gap-1 rounded-sm border-0 p-0' : 'gap-2 rounded-md border p-2'} ${compact ? 'border-slate-700 bg-black/30' : 'border-slate-200 bg-slate-50'}`}>
          {miniPlayer && !dense && <div className="text-xs font-semibold uppercase tracking-normal opacity-70">Playable Audio URL</div>}
          <audio
            ref={audioRef}
            src={trimmedUrl}
            preload="metadata"
            onPlay={() => setIsPlaying(true)}
            onPause={() => setIsPlaying(false)}
            onEnded={() => setIsPlaying(false)}
            onTimeUpdate={(event) => setCurrentTime(event.currentTarget.currentTime)}
            onLoadedMetadata={(event) => setDuration(Number.isFinite(event.currentTarget.duration) ? event.currentTarget.duration : 0)}
            onError={() => {
              setIsPlaying(false);
              setAudioError('Audio failed to load. Check that the URL points directly to a playable audio file.');
            }}
          />
          <div className={`flex flex-wrap items-center ${dense ? 'gap-1' : 'gap-2'}`}>
            <button className={`${compact ? 'stage-menu-button' : 'secondary-button'} ${dense ? 'h-8 px-2 text-xs' : ''}`} type="button" onClick={togglePlay}>
              {isPlaying ? <Pause size={18} /> : <Play size={18} />}
              {isPlaying ? 'Pause' : 'Play'}
            </button>
            <button className={`${compact ? 'stage-menu-button' : 'secondary-button'} ${dense ? 'h-8 px-2 text-xs' : ''}`} type="button" onClick={() => skip(-10)}>-10 sec</button>
            <button className={`${compact ? 'stage-menu-button' : 'secondary-button'} ${dense ? 'h-8 px-2 text-xs' : ''}`} type="button" onClick={() => skip(10)}>+10 sec</button>
            <span className={`rounded bg-black/10 px-2 py-1 font-semibold ${dense ? 'text-xs' : 'text-sm'}`}>
              {formatReferenceAudioTime(currentTime)} / {duration ? formatReferenceAudioTime(duration) : '--:--'}
            </span>
            <div className="ml-auto flex flex-wrap gap-1">
              {[0.75, 1, 1.25].map((rate) => (
                <button
                  key={rate}
                  className={`rounded border px-2 py-1 text-xs font-semibold ${playbackRate === rate ? 'border-teal-400 bg-teal-600 text-white' : compact ? 'border-slate-700 bg-slate-900 text-slate-100' : 'border-slate-300 bg-white text-slate-700'}`}
                  type="button"
                  onClick={() => setPlaybackRate(rate)}
                >
                  {rate.toFixed(2).replace(/\.00$/, '.0')}x
                </button>
              ))}
            </div>
          </div>
          {audioError && <div className="rounded border border-amber-300 bg-amber-50 px-3 py-2 text-sm font-semibold text-amber-900">{audioError}</div>}
        </div>
      ) : (
        externalLinkPanel
      )}
    </div>
  );
}

function isDirectReferenceAudioUrl(url: string) {
  if (!url) return false;
  return /\.(?:mp3|m4a|wav|webm|ogg)(?:[?#].*)?$/i.test(url);
}

function formatReferenceAudioTime(seconds: number) {
  if (!Number.isFinite(seconds) || seconds < 0) return '0:00';
  const rounded = Math.floor(seconds);
  const minutes = Math.floor(rounded / 60);
  const remainingSeconds = rounded % 60;
  return `${minutes}:${String(remainingSeconds).padStart(2, '0')}`;
}

function EnrichmentPreview({
  result,
  onApplyMissing,
  onApplyAll,
  onCancel
}: {
  result: EnrichmentResult;
  onApplyMissing: () => void;
  onApplyAll: () => void;
  onCancel: () => void;
}) {
  const rows = [...result.proposals, ...result.unavailable];
  return (
    <section className="rounded-md border border-teal-300 bg-white p-3">
      <div className="mb-3 flex flex-wrap items-center gap-2">
        <div>
          <h3 className="font-semibold text-slate-950">Metadata preview</h3>
          <p className="text-sm text-slate-600">Sources tried: {result.sourcesTried.join(', ')}</p>
        </div>
        <button className="primary-button ml-auto" type="button" onClick={onApplyMissing}>
          Apply missing fields
        </button>
        <button className="secondary-button" type="button" onClick={onApplyAll}>
          Apply all
        </button>
        <button className="secondary-button" type="button" onClick={onCancel}>
          Cancel
        </button>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full border-collapse text-sm">
          <thead>
            <tr className="border-b border-slate-200 text-left text-xs uppercase text-slate-500">
              <th className="py-2 pr-3">Field</th>
              <th className="py-2 pr-3">Current</th>
              <th className="py-2 pr-3">Proposed</th>
              <th className="py-2 pr-3">Source</th>
              <th className="py-2 pr-3">Status</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((proposal) => {
              const found = proposal.confidence !== 'unavailable';
              const willFill = found && isMissing(proposal.current);
              return (
                <tr key={`${proposal.field}-${proposal.source}`} className="border-b border-slate-100 align-top">
                  <td className="py-2 pr-3 font-medium">{formatEnrichmentField(proposal.field)}</td>
                  <td className="py-2 pr-3 text-slate-600">{formatEnrichmentValue(proposal.current)}</td>
                  <td className="py-2 pr-3">{found ? formatEnrichmentValue(proposal.proposed) : 'not found'}</td>
                  <td className="py-2 pr-3 text-slate-600">
                    <div>{proposal.source}</div>
                    {proposal.note && <div className="text-xs text-slate-500">{proposal.note}</div>}
                  </td>
                  <td className="py-2 pr-3">
                    {found ? (
                      <span className={willFill ? 'text-teal-700' : 'text-amber-700'}>
                        {willFill ? 'will fill missing value' : 'requires overwrite confirmation'}
                      </span>
                    ) : (
                      <span className="text-slate-500">not found</span>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </section>
  );
}

function QuickEditPanel({
  draft,
  setDraft,
  onSave
}: {
  draft: Song;
  setDraft: (song: Song) => void;
  onSave: (song: Song) => void;
}) {
  return (
    <section className="rounded-md border border-teal-200 bg-teal-50 p-3">
      <div className="mb-3 flex items-center gap-2">
        <h3 className="font-semibold text-teal-950">Quick Edit</h3>
        <button className="primary-button ml-auto" type="button" onClick={() => onSave(draft)}>
          <Save size={18} />
          Save now
        </button>
      </div>
      <div className="grid gap-3 md:grid-cols-4">
        <Field label="Key" value={draft.performanceKey || draft.key} onChange={(value) => setDraft({ ...draft, key: value, performanceKey: value })} />
        <NumberField label="Capo" value={draft.capo} onChange={(value) => setDraft({ ...draft, capo: value })} />
        <NumberField label="BPM" value={draft.bpm} onChange={(value) => setDraft({ ...draft, bpm: value })} />
        <Field label="Difficulty" value={draft.difficulty ?? ''} onChange={(value) => setDraft({ ...draft, difficulty: value })} />
      </div>
    </section>
  );
}

function RehearsalNotesPanel({ song, onChange }: { song: Song; onChange: (song: Song) => void }) {
  const [text, setText] = useState('');
  const notes = song.rehearsalNotes ?? [];

  return (
    <section className="rounded-md border border-slate-300 bg-white p-3">
      <h3 className="font-semibold">Rehearsal Notes</h3>
      <div className="mt-3 flex gap-2">
        <input
          className="h-11 flex-1 rounded-md border border-slate-300 bg-white px-3 text-slate-950 outline-none placeholder:text-slate-400 focus:border-teal-500"
          value={text}
          placeholder="watch drummer cue, hold last chorus, etc."
          onChange={(event) => setText(event.target.value)}
        />
        <button
          className="primary-button"
          type="button"
          onClick={() => {
            if (!text.trim()) return;
            onChange({
              ...song,
              rehearsalNotes: [
                { id: createId('note'), createdAt: new Date().toISOString(), text: text.trim() },
                ...notes
              ]
            });
            setText('');
          }}
        >
          Add
        </button>
      </div>
      <div className="mt-3 grid gap-2">
        {notes.map((note) => (
          <div key={note.id} className="rounded border border-slate-200 bg-slate-50 p-2 text-sm">
            <div className="text-xs text-slate-500">{new Date(note.createdAt).toLocaleString()}</div>
            <div>{note.text}</div>
          </div>
        ))}
      </div>
    </section>
  );
}

function Field({ label, value, onChange }: { label: string; value: string; onChange: (value: string) => void }) {
  return (
    <label className="grid gap-2">
      <span className="text-sm font-medium text-slate-700">{label}</span>
      <input
        className="h-11 rounded-md border border-slate-300 bg-white px-3 text-slate-950 outline-none placeholder:text-slate-400 focus:border-teal-500"
        value={value}
        onChange={(event) => onChange(event.target.value)}
      />
    </label>
  );
}

function NumberField({ label, value, onChange }: { label: string; value: number; onChange: (value: number) => void }) {
  return (
    <label className="grid gap-2">
      <span className="text-sm font-medium text-slate-700">{label}</span>
      <input
        className="h-11 rounded-md border border-slate-300 bg-white px-3 text-slate-950 outline-none placeholder:text-slate-400 focus:border-teal-500"
        type="number"
        value={value}
        onChange={(event) => onChange(Number(event.target.value))}
      />
    </label>
  );
}

function DurationField({
  value,
  error,
  onChange,
  onBlur
}: {
  value: string;
  error: string;
  onChange: (value: string) => void;
  onBlur: () => void;
}) {
  return (
    <label className="grid gap-2">
      <span className="text-sm font-medium text-slate-700">Duration</span>
      <input
        className={`h-11 rounded-md border bg-white px-3 text-slate-950 outline-none placeholder:text-slate-400 focus:border-teal-500 ${
          error ? 'border-red-400' : 'border-slate-300'
        }`}
        inputMode="text"
        placeholder="3:45"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        onBlur={onBlur}
      />
      {error && <span className="text-xs font-medium text-red-700">{error}</span>}
    </label>
  );
}

function SetlistView({
  entries,
  songs,
  savedSetlists,
  currentSetlistId,
  setlistName,
  setSetlistName,
  setlistNotes,
  setSetlistNotes,
  unsavedChanges,
  allowDuplicates,
  setAllowDuplicates,
  totalDuration,
  onSelect,
  onAdd,
  onReorder,
  onRemove,
  onMove,
  onSort,
  onSave,
  onSaveAsNew,
  onNew,
  onOpen,
  onRun,
  onDuplicate,
  onDelete
}: {
  entries: SetlistEntry[];
  songs: Song[];
  savedSetlists: SavedSetlist[];
  currentSetlistId: string | null;
  setlistName: string;
  setSetlistName: (name: string) => void;
  setlistNotes: string;
  setSetlistNotes: (notes: string) => void;
  unsavedChanges: boolean;
  allowDuplicates: boolean;
  setAllowDuplicates: (value: boolean) => void;
  totalDuration: number;
  onSelect: (id: string) => void;
  onAdd: (id: string) => void;
  onReorder: (items: SetlistItem[]) => void;
  onRemove: (itemId: string) => void;
  onMove: (itemId: string, direction: 1 | -1) => void;
  onSort: (sortBy: SetlistSortMode) => void;
  onSave: () => void;
  onSaveAsNew: () => void;
  onNew: () => void;
  onOpen: (setlist: SavedSetlist) => void;
  onRun: (setlist: SavedSetlist) => void;
  onDuplicate: (setlist: SavedSetlist) => void;
  onDelete: (id: string) => void;
}) {
  const [addQuery, setAddQuery] = useState('');
  const [activeTab, setActiveTab] = useState<'builder' | 'saved'>('builder');
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );
  const addedSongIds = new Set(entries.map(({ item }) => item.songId));
  const availableSongs = songs.filter((song) => {
    const matches = `${song.title} ${song.artist} ${song.key} ${song.tags.join(' ')}`.toLowerCase().includes(addQuery.toLowerCase());
    return matches && (allowDuplicates || !addedSongIds.has(song.id));
  });

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const oldIndex = entries.findIndex(({ item }) => item.id === active.id);
    const newIndex = entries.findIndex(({ item }) => item.id === over.id);
    onReorder(arrayMove(entries.map(({ item }) => item), oldIndex, newIndex));
  }

  return (
    <main className="min-h-[calc(100vh-105px)] p-4">
      <div className="mb-4 flex gap-2 border-b border-slate-300">
        <button className={`px-4 py-2 text-sm font-semibold ${activeTab === 'builder' ? 'border-b-2 border-teal-600 text-teal-700' : 'text-slate-600'}`} onClick={() => setActiveTab('builder')}>
          Setlist Builder
        </button>
        <button className={`px-4 py-2 text-sm font-semibold ${activeTab === 'saved' ? 'border-b-2 border-teal-600 text-teal-700' : 'text-slate-600'}`} onClick={() => setActiveTab('saved')}>
          Saved Setlists
        </button>
      </div>

      {activeTab === 'builder' ? (
        <div className="grid gap-4 lg:grid-cols-[1fr_340px]">
          <section className="grid gap-4">
            <div className="rounded-md border border-slate-300 bg-white p-4">
              <div className="grid gap-3 lg:grid-cols-[1fr_auto] lg:items-end">
                <label className="grid gap-1 text-sm font-medium text-slate-700">
                  Setlist Name
                  <input className="input text-lg font-semibold" value={setlistName} onChange={(event) => setSetlistName(event.target.value)} />
                </label>
                <div className="flex flex-wrap gap-2">
                  <button className="primary-button h-10" onClick={onSave}>
                    <Save size={17} /> Save Setlist
                  </button>
                  {currentSetlistId && (
                    <button className="secondary-button h-10" onClick={onSaveAsNew}>
                      Save As New
                    </button>
                  )}
                  <button className="secondary-button h-10" onClick={onNew}>
                    <Plus size={17} /> Clear / New
                  </button>
                </div>
              </div>
              <div className="mt-3 flex flex-wrap items-center gap-3 text-sm text-slate-600">
                <span className="rounded bg-slate-100 px-3 py-1">{entries.length} songs</span>
                <span className="rounded bg-slate-100 px-3 py-1">Total {formatDuration(totalDuration)}</span>
                {unsavedChanges && <span className="rounded bg-amber-100 px-3 py-1 font-semibold text-amber-800">Unsaved changes</span>}
              </div>
              <label className="mt-3 grid gap-1 text-sm font-medium text-slate-700">
                Notes
                <textarea className="input min-h-16" value={setlistNotes} onChange={(event) => setSetlistNotes(event.target.value)} />
              </label>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <span className="text-sm font-semibold text-slate-700">Sort:</span>
              {[
                ['title', 'Title A-Z'],
                ['artist', 'Artist A-Z'],
                ['key', 'Key'],
                ['bpm', 'BPM'],
                ['duration', 'Duration']
              ].map(([value, label]) => (
                <button key={value} className="secondary-button h-9 text-sm" onClick={() => onSort(value as SetlistSortMode)}>
                  {label}
                </button>
              ))}
            </div>

            <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
              <SortableContext items={entries.map(({ item }) => item.id)} strategy={verticalListSortingStrategy}>
                <div className="grid gap-2">
                  {entries.length === 0 && <div className="rounded-md border border-dashed border-slate-300 bg-white p-6 text-center text-slate-600">Add songs to start building this setlist.</div>}
                  {entries.map(({ item, song }, index) => (
                    <SortableSongRow key={item.id} item={item} song={song} index={index} onSelect={onSelect} onRemove={onRemove} onMove={onMove} />
                  ))}
                </div>
              </SortableContext>
            </DndContext>
          </section>

          <aside className="rounded-md border border-slate-300 bg-white p-4">
            <h3 className="mb-3 font-semibold">Add Songs</h3>
            <label className="mb-3 flex h-10 items-center gap-2 rounded-md border border-slate-300 bg-white px-3">
              <Search size={17} className="text-slate-500" />
              <input className="w-full bg-transparent text-sm outline-none" placeholder="Search songs" value={addQuery} onChange={(event) => setAddQuery(event.target.value)} />
            </label>
            <label className="mb-3 flex items-center gap-2 text-sm text-slate-700">
              <input type="checkbox" checked={allowDuplicates} onChange={(event) => setAllowDuplicates(event.target.checked)} />
              Allow duplicates
            </label>
            <div className="grid max-h-[62vh] gap-2 overflow-auto">
              {availableSongs.map((song) => (
                <button key={song.id} className="secondary-button justify-start" onClick={() => onAdd(song.id)}>
                  <Plus size={17} />
                  <span className="truncate">{song.title}</span>
                </button>
              ))}
              {availableSongs.length === 0 && <p className="text-sm text-slate-500">No songs available to add.</p>}
            </div>
          </aside>
        </div>
      ) : (
        <div className="grid gap-3">
          {savedSetlists.map((saved) => (
            <SavedSetlistRow
              key={saved.id}
              setlist={saved}
              songs={songs}
              onOpen={() => {
                onOpen(saved);
                setActiveTab('builder');
              }}
              onRun={() => onRun(saved)}
              onDuplicate={() => onDuplicate(saved)}
              onDelete={() => onDelete(saved.id)}
            />
          ))}
          {savedSetlists.length === 0 && <div className="rounded-md border border-dashed border-slate-300 bg-white p-6 text-center text-slate-600">No saved setlists yet.</div>}
        </div>
      )}
    </main>
  );
}

function SortableSongRow({
  item,
  song,
  index,
  onSelect,
  onRemove,
  onMove
}: {
  item: SetlistItem;
  song?: Song;
  index: number;
  onSelect: (id: string) => void;
  onRemove: (itemId: string) => void;
  onMove: (itemId: string, direction: 1 | -1) => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id: item.id });

  return (
    <div
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition }}
      className="grid grid-cols-[44px_1fr_auto] items-center gap-3 rounded-md border border-slate-300 bg-white p-3"
    >
      <button className="icon-button-dark" {...attributes} {...listeners} title="Drag to reorder">
        <GripVertical size={20} />
      </button>
      <button className="min-w-0 text-left" disabled={!song} onClick={() => song && onSelect(song.id)}>
        <div className="font-semibold">
          {index + 1}. {song?.title ?? 'Missing song'}
        </div>
        <div className={`text-sm ${song ? 'text-slate-600' : 'font-semibold text-red-700'}`}>
          {song ? `${song.artist || 'Unknown artist'} - ${song.key || '-'} - ${song.bpm || '-'} BPM` : `Song ID ${item.songId} is no longer in the library`}
        </div>
      </button>
      <div className="flex items-center gap-1">
        <button className="icon-button-dark" title="Move up" onClick={() => onMove(item.id, -1)}>
          <ChevronLeft className="rotate-90" size={18} />
        </button>
        <button className="icon-button-dark" title="Move down" onClick={() => onMove(item.id, 1)}>
          <ChevronRight className="rotate-90" size={18} />
        </button>
        <button className="icon-button-dark text-red-700" title="Remove from setlist" onClick={() => onRemove(item.id)}>
          <Trash2 size={18} />
        </button>
      </div>
    </div>
  );
}

function SavedSetlistRow({
  setlist,
  songs,
  onOpen,
  onRun,
  onDuplicate,
  onDelete
}: {
  setlist: SavedSetlist;
  songs: Song[];
  onOpen: () => void;
  onRun: () => void;
  onDuplicate: () => void;
  onDelete: () => void;
}) {
  const songMap = new Map(songs.map((song) => [song.id, song]));
  const setlistSongs = setlist.songIds.map((id) => songMap.get(id));
  const missingCount = setlistSongs.filter((song) => !song).length;
  const totalDuration = setlistSongs.reduce((total, song) => total + (song?.durationSeconds ?? 0), 0);

  return (
    <div className="grid gap-3 rounded-md border border-slate-300 bg-white p-4 lg:grid-cols-[1fr_auto] lg:items-center">
      <div>
        <div className="text-lg font-semibold">{setlist.name}</div>
        <div className="mt-1 flex flex-wrap gap-2 text-sm text-slate-600">
          <span>{setlist.songIds.length} songs</span>
          <span>Total {formatDuration(totalDuration)}</span>
          <span>Modified {formatDate(setlist.updatedAt)}</span>
          {missingCount > 0 && <span className="font-semibold text-red-700">{missingCount} missing song{missingCount === 1 ? '' : 's'}</span>}
        </div>
        {setlist.notes && <p className="mt-2 text-sm text-slate-600">{setlist.notes}</p>}
      </div>
      <div className="flex flex-wrap gap-2">
        <button className="secondary-button h-10" onClick={onOpen}>Open/Edit</button>
        <button className="primary-button h-10" onClick={onRun}>
          <Play size={17} /> Run in Stage
        </button>
        <button className="secondary-button h-10" onClick={onDuplicate}>Duplicate</button>
        <button className="secondary-button h-10 text-red-700" onClick={onDelete}>
          <Trash2 size={17} /> Delete
        </button>
      </div>
    </div>
  );
}

function PerformanceView({
  song,
  songs,
  savedSetlists,
  entries,
  stageRef,
  nextSong,
  previousSong,
  navigationLabel,
  navigationPosition,
  activeSetlistName,
  isTransitioningSong,
  state,
  setState,
  setPreset,
  setAutoscrollSpeed,
  onCalculateDuration,
  isAutoscrolling,
  setIsAutoscrolling,
  onToggleAutoscroll,
  autoscrollDebug,
  onPrevious,
  onNext,
  onEdit,
  onStageMode,
  onSettings,
  onDisplays,
  onSelectStageSong,
  onNewSongAction,
  onToggleFavorite,
  onRunStageSetlist,
  onDiagnostics,
  onPedals,
  onImportExport,
  onSync,
  onExit,
  onChangeSongCapo,
  onChangeSongBpm,
  onToggleDisplayPreference,
  onLiveHarmonyEdit,
  onSongShared,
  onScroll,
  onSendReceiver,
  onSendReceiverTestPattern,
  countdownRemaining,
  stageSetlistMode = false
}: {
  song: Song;
  songs: Song[];
  savedSetlists: SavedSetlist[];
  entries: SetlistEntry[];
  stageRef: React.RefObject<HTMLDivElement | null>;
  nextSong?: Song;
  previousSong?: Song;
  navigationLabel: string;
  navigationPosition: string;
  activeSetlistName: string;
  isTransitioningSong: boolean;
  state: PerformanceState;
  setState: (next: Partial<PerformanceState>) => void;
  setPreset: (preset: AutoscrollPreset) => void;
  setAutoscrollSpeed: (speed: number) => void;
  onCalculateDuration: () => void;
  isAutoscrolling: boolean;
  setIsAutoscrolling: (value: boolean) => void;
  onToggleAutoscroll: () => void;
  autoscrollDebug: AutoscrollDebugInfo;
  onPrevious: () => void;
  onNext: () => void;
  onEdit: () => void;
  onStageMode: () => void;
  onSettings: () => void;
  onDisplays: () => void;
  onSelectStageSong: (songId: string, source?: NavigationContext) => void;
  onNewSongAction: (action: NewSongAction) => void;
  onToggleFavorite: (songId: string) => void;
  onRunStageSetlist: (setlist: SavedSetlist) => void;
  onDiagnostics: () => void;
  onPedals: () => void;
  onImportExport: () => void;
  onSync: () => void;
  onExit: () => void;
  onChangeSongCapo: (capo: number) => void;
  onChangeSongBpm: (bpm: number) => void;
  onToggleDisplayPreference: () => void;
  onLiveHarmonyEdit: (operation: StageHarmonyEditOperation, start: number, end: number) => void | Promise<void>;
  onSongShared: (songId: string) => void | Promise<void>;
  onScroll: (scrollTop: number) => void;
  onSendReceiver: () => boolean;
  onSendReceiverTestPattern: () => boolean;
  countdownRemaining: number;
  stageSetlistMode?: boolean;
}) {
  const effectiveCapo = getEffectiveCapo(song, state);
  const externalDisplaySettings = getExternalDisplaySettings(state);
  const lyricFontSize = getEffectiveLyricFontSize(state);
  const lineSpacing = getEffectiveLineSpacing(state);
  const headerFontSize = getEffectiveHeaderFontSize(state);
  const chordFontSize = getEffectiveChordFontSize(state);
  const isPhoneWidth = typeof window !== 'undefined' && window.innerWidth < 600;
  const mobileReflowMode = (state.inlineChordsOnPhone ?? true) && (state.activeProfile === 'iphone' || isPhoneWidth);
  const rendered = renderSong(song, {
    transpose: state.transpose,
    capo: effectiveCapo,
    showNashvilleNumbers: state.showNashvilleNumbers,
    songKey: song.performanceKey || song.key,
    activeProfile: state.activeProfile,
    lyricFontSize,
    lineSpacing,
    chordFontSize,
    headerFontSize,
    songTitleFontSize: getEffectiveSongTitleFontSize(state),
    songArtistFontSize: getEffectiveSongArtistFontSize(state),
    sectionFontSize: getEffectiveSectionFontSize(state),
    sectionSpacingBefore: getEffectiveSectionSpacingBefore(state),
    sectionSpacingAfter: getEffectiveSectionSpacingAfter(state),
    viewportWidth: window.innerWidth,
    displayMode: getDisplayModeLabel(state)
  });
  const chartLines = rendered.lines;
  useEffect(() => {
    if (!externalDisplaySettings.enabled) return;
    saveExternalDisplayPayload({
      song,
      performance: { ...state, externalDisplay: externalDisplaySettings },
      effectiveCapo,
      updatedAt: new Date().toISOString()
    });
  }, [effectiveCapo, externalDisplaySettings, song, state]);
  useEffect(() => {
    useAppStore.getState().updateDiagnostics({ ...rendered.diagnostics, renderCacheSize: getRenderCacheSize() });
  }, [rendered.diagnostics.lastRenderMs, rendered.diagnostics.parsedLineCount]);
  const [activePopover, setActivePopover] = useState<StagePopoverName | null>(null);
  const [formatTab, setFormatTab] = useState<StageFormatTab>('format');
  const [toolbarVisible, setToolbarVisible] = useState(true);
  const [cursorHidden, setCursorHidden] = useState(false);
  const [speedPopoverOpen, setSpeedPopoverOpen] = useState(false);
  const [selectionAction, setSelectionAction] = useState<StageSelectionAction | null>(null);
  const [tempoRunning, setTempoRunning] = useState(false);
  const [activeTempoBeat, setActiveTempoBeat] = useState<number | null>(null);
  const [tempoMessage, setTempoMessage] = useState('');
  const [tempoPanelOpen, setTempoPanelOpen] = useState(false);
  const [tempoCountdownSeconds, setTempoCountdownSeconds] = useState<number | null>(null);
  const [publishingSong, setPublishingSong] = useState(false);
  const [publishResult, setPublishResult] = useState<PublishedSongResult | null>(null);
  const [publishError, setPublishError] = useState('');
  const [stageTempoBpm, setStageTempoBpm] = useState(() => normalizeTempoBpm(song.bpm) ?? 0);
  const [tempoInput, setTempoInput] = useState(() => {
    const bpm = normalizeTempoBpm(song.bpm);
    return bpm ? String(Math.round(bpm)) : '';
  });
  const autoscrollButtonRef = useRef<HTMLButtonElement | null>(null);
  const autoscrollLongPressTimerRef = useRef<number | null>(null);
  const autoscrollLongPressActivatedRef = useRef(false);
  const speedPopoverHideTimerRef = useRef<number | null>(null);
  const tempoIntervalRef = useRef<number | null>(null);
  const tempoMessageTimerRef = useRef<number | null>(null);
  const tempoLongPressTimerRef = useRef<number | null>(null);
  const tempoLongPressActivatedRef = useRef(false);
  const tempoAutoStopTimerRef = useRef<number | null>(null);
  const tempoCountdownTimerRef = useRef<number | null>(null);
  const swipeStartRef = useRef<{ x: number; y: number; target: EventTarget | null } | null>(null);
  const stageTheme = getStageTheme(state.stageTheme);
  const stageBackground = stageTheme.className;
  const chordVerticalOffset = getEffectiveChordVerticalOffset(state);
  const chordFontColor = getEffectiveChordFontColor(state);
  const chordHighlightColor = getEffectiveChordHighlightColor(state);
  const boldChords = getEffectiveBoldChords(state);
  const italicChords = getEffectiveItalicChords(state);
  const showChords = getEffectiveShowChords(state);
  const documentTheme = getDocumentThemePreset(getEffectiveDocumentTheme(state));
  const stageFontFamily = resolveStageFontFamily(getEffectiveStageFontFamily(state));
  const chordFontFamily = getEffectiveUseMonospaceChords(state) ? 'Consolas, "Courier New", monospace' : stageFontFamily;
  const songTitleStyle = buildSongDocumentTextStyle({
    size: getEffectiveSongTitleFontSize(state),
    color: getEffectiveSongTitleColor(state),
    bold: getEffectiveSongTitleBold(state),
    italic: getEffectiveSongTitleItalic(state),
    documentTheme,
    fallbackColor: documentTheme.text
  });
  const songArtistStyle = buildSongDocumentTextStyle({
    size: getEffectiveSongArtistFontSize(state),
    color: getEffectiveSongArtistColor(state),
    bold: getEffectiveSongArtistBold(state),
    italic: getEffectiveSongArtistItalic(state),
    documentTheme,
    fallbackColor: documentTheme.muted
  });
  const sectionFontSize = getEffectiveSectionFontSize(state);
  const sectionFontColor = getEffectiveSectionFontColor(state);
  const sectionBold = getEffectiveSectionBold(state);
  const sectionItalic = getEffectiveSectionItalic(state);
  const sectionUppercase = getEffectiveSectionUppercase(state);
  const sectionSpacingBefore = getEffectiveSectionSpacingBefore(state);
  const sectionSpacingAfter = getEffectiveSectionSpacingAfter(state);
  const showHarmonyCues = getEffectiveShowHarmonyCues(state);
  const harmonyTextColor = getEffectiveHarmonyTextColor(state);
  const harmonyIconColor = getEffectiveHarmonyIconColor(state);
  const harmonyItalic = getEffectiveHarmonyItalic(state);
  const harmonyUnderline = getEffectiveHarmonyUnderline(state);
  const harmonyIconVisible = getEffectiveHarmonyIconVisible(state);
  const visibleStageNotes = filterStageNotes(song.notes);
  const currentScrollSpeed = normalizeAutoscrollSpeedMultiplier(state.autoscrollSpeed);
  const useBottomHarmonyActionBar = shouldUseBottomHarmonyActionBar();
  const isWarmTheme = state.stageTheme === 'coffeehouse';
  const headerText = isWarmTheme ? 'text-[#f4ead2]' : state.theme === 'dark' ? 'text-slate-100' : 'text-slate-950';
  const mutedText = isWarmTheme ? 'text-[#cdbb96]' : state.theme === 'dark' ? 'text-slate-400' : 'text-slate-600';
  const menuSurface = isWarmTheme ? 'border-[#5b452f] bg-[#1b130e]/95 text-[#f4ead2]' : 'border-slate-700 bg-slate-950/95 text-slate-100';
  const toolbarButton = isWarmTheme ? 'border-[#8c6b38] bg-[#2a1d14]/80 text-[#f4ead2] hover:bg-[#3a281b]' : 'border-slate-700 bg-slate-900/80 text-slate-100 hover:bg-slate-800';
  const songBpm = normalizeTempoBpm(song.bpm);
  const activeTempoBpm = normalizeTempoBpm(stageTempoBpm) ?? songBpm;
  const tempoStopAfter10Sec = Boolean(state.tempoStopAfter10Sec);
  const tempoMeterVisible = shouldShowTempoMeter(
    tempoRunning,
    toolbarVisible || Boolean(activePopover) || speedPopoverOpen || Boolean(selectionAction),
    tempoPanelOpen,
    Boolean(tempoMessage)
  );

  const revealMenu = useCallback(() => {
    setToolbarVisible(true);
    setCursorHidden(false);
  }, []);
  const clearTempoInterval = useCallback(() => {
    if (tempoIntervalRef.current !== null) {
      window.clearInterval(tempoIntervalRef.current);
      tempoIntervalRef.current = null;
    }
  }, []);
  const clearTempoAutoStopTimers = useCallback(() => {
    if (tempoAutoStopTimerRef.current !== null) {
      window.clearTimeout(tempoAutoStopTimerRef.current);
      tempoAutoStopTimerRef.current = null;
    }
    if (tempoCountdownTimerRef.current !== null) {
      window.clearInterval(tempoCountdownTimerRef.current);
      tempoCountdownTimerRef.current = null;
    }
    setTempoCountdownSeconds(null);
  }, []);
  const stopTempo = useCallback(() => {
    clearTempoInterval();
    clearTempoAutoStopTimers();
    setTempoRunning(false);
    setActiveTempoBeat(null);
  }, [clearTempoAutoStopTimers, clearTempoInterval]);
  const showTempoMessage = useCallback((message: string) => {
    setTempoMessage(message);
    if (tempoMessageTimerRef.current !== null) window.clearTimeout(tempoMessageTimerRef.current);
    tempoMessageTimerRef.current = window.setTimeout(() => {
      setTempoMessage('');
      tempoMessageTimerRef.current = null;
    }, 2600);
  }, []);
  const toggleTempo = useCallback(() => {
    revealMenu();
    if (tempoRunning) {
      stopTempo();
      return;
    }
    if (!activeTempoBpm) {
      showTempoMessage('No BPM set for this song.');
      return;
    }
    setTempoRunning(true);
  }, [activeTempoBpm, revealMenu, showTempoMessage, stopTempo, tempoRunning]);

  useEffect(() => {
    window.addEventListener('openstage:toggle-tempo-guide', toggleTempo);
    return () => window.removeEventListener('openstage:toggle-tempo-guide', toggleTempo);
  }, [toggleTempo]);

  const clearTempoLongPressTimer = useCallback(() => {
    if (!tempoLongPressTimerRef.current) return;
    window.clearTimeout(tempoLongPressTimerRef.current);
    tempoLongPressTimerRef.current = null;
  }, []);
  const openTempoPanel = useCallback(() => {
    revealMenu();
    setActivePopover(null);
    setSpeedPopoverOpen(false);
    if (speedPopoverHideTimerRef.current) {
      window.clearTimeout(speedPopoverHideTimerRef.current);
      speedPopoverHideTimerRef.current = null;
    }
    setTempoPanelOpen((open) => {
      if (open) return false;
      const bpm = activeTempoBpm ?? minTempoBpm;
      setStageTempoBpm(clampTempoBpm(bpm, 120));
      setTempoInput(String(clampTempoBpm(bpm, 120)));
      setTempoMessage('');
      return true;
    });
  }, [activeTempoBpm, revealMenu]);
  const commitTempoBpm = useCallback((value: number) => {
    const nextBpm = clampTempoBpm(value, activeTempoBpm ?? 120);
    setStageTempoBpm(nextBpm);
    setTempoInput(String(nextBpm));
    setTempoMessage('');
    void onChangeSongBpm(nextBpm);
  }, [activeTempoBpm, onChangeSongBpm]);
  const applyTempoInput = useCallback(() => {
    const value = parseTempoBpmInput(tempoInput);
    if (value === null) {
      showTempoMessage('Enter BPM between 40 and 240.');
      return;
    }
    commitTempoBpm(value);
  }, [commitTempoBpm, showTempoMessage, tempoInput]);
  const handleTempoPointerDown = useCallback((event: React.PointerEvent<HTMLDivElement>) => {
    event.preventDefault();
    event.stopPropagation();
    if (event.pointerType === 'mouse' && event.button !== 0) return;
    clearTempoLongPressTimer();
    tempoLongPressActivatedRef.current = false;
    tempoLongPressTimerRef.current = window.setTimeout(() => {
      tempoLongPressActivatedRef.current = true;
      tempoLongPressTimerRef.current = null;
      openTempoPanel();
    }, 500);
  }, [clearTempoLongPressTimer, openTempoPanel]);
  const handleTempoPointerEnd = useCallback((event: React.PointerEvent<HTMLDivElement>) => {
    event.preventDefault();
    event.stopPropagation();
    clearTempoLongPressTimer();
    if (shouldToggleTempoOnPointerEnd(tempoLongPressActivatedRef.current)) toggleTempo();
    tempoLongPressActivatedRef.current = false;
  }, [clearTempoLongPressTimer, toggleTempo]);
  const handleTempoPointerCancel = useCallback((event: React.PointerEvent<HTMLDivElement>) => {
    event.preventDefault();
    event.stopPropagation();
    clearTempoLongPressTimer();
    tempoLongPressActivatedRef.current = false;
  }, [clearTempoLongPressTimer]);
  const handleTempoContextMenu = useCallback((event: React.MouseEvent<HTMLDivElement>) => {
    event.preventDefault();
    event.stopPropagation();
    tempoLongPressActivatedRef.current = true;
    openTempoPanel();
  }, [openTempoPanel]);
  const closeSpeedPopover = useCallback(() => {
    setSpeedPopoverOpen(false);
    if (speedPopoverHideTimerRef.current) {
      window.clearTimeout(speedPopoverHideTimerRef.current);
      speedPopoverHideTimerRef.current = null;
    }
  }, []);
  const keepSpeedPopoverAwake = useCallback(() => {
    if (speedPopoverHideTimerRef.current) window.clearTimeout(speedPopoverHideTimerRef.current);
    speedPopoverHideTimerRef.current = window.setTimeout(() => {
      setSpeedPopoverOpen(false);
      speedPopoverHideTimerRef.current = null;
    }, 4000);
  }, []);
  const openSpeedPopover = useCallback(() => {
    revealMenu();
    setActivePopover(null);
    setSpeedPopoverOpen(true);
    keepSpeedPopoverAwake();
  }, [keepSpeedPopoverAwake, revealMenu]);
  const clearAutoscrollLongPressTimer = useCallback(() => {
    if (!autoscrollLongPressTimerRef.current) return;
    window.clearTimeout(autoscrollLongPressTimerRef.current);
    autoscrollLongPressTimerRef.current = null;
  }, []);
  const handleAutoscrollPointerDown = useCallback((event: React.PointerEvent<HTMLButtonElement>) => {
    event.stopPropagation();
    if (event.pointerType === 'mouse' && event.button !== 0) return;
    clearAutoscrollLongPressTimer();
    autoscrollLongPressActivatedRef.current = false;
    autoscrollLongPressTimerRef.current = window.setTimeout(() => {
      autoscrollLongPressActivatedRef.current = true;
      autoscrollLongPressTimerRef.current = null;
      openSpeedPopover();
    }, autoscrollLongPressMs);
  }, [clearAutoscrollLongPressTimer, openSpeedPopover]);
  const handleAutoscrollPointerEnd = useCallback((event: React.PointerEvent<HTMLButtonElement>) => {
    event.stopPropagation();
    clearAutoscrollLongPressTimer();
  }, [clearAutoscrollLongPressTimer]);
  const handleAutoscrollContextMenu = useCallback((event: React.MouseEvent<HTMLButtonElement>) => {
    event.preventDefault();
    event.stopPropagation();
    autoscrollLongPressActivatedRef.current = true;
    openSpeedPopover();
  }, [openSpeedPopover]);
  const togglePopover = useCallback((popover: StagePopoverName) => {
    setToolbarVisible(true);
    closeSpeedPopover();
    setActivePopover((current) => current === popover ? null : popover);
  }, [closeSpeedPopover]);
  const openFormatPopover = useCallback((tab: StageFormatTab = 'format') => {
    setFormatTab(tab);
    setToolbarVisible(true);
    closeSpeedPopover();
    setActivePopover((current) => current === 'format' ? null : 'format');
  }, [closeSpeedPopover]);
  const publishCurrentSong = useCallback(async () => {
    if (publishingSong) return;
    setActivePopover(null);
    setPublishError('');
    setPublishingSong(true);

    try {
      const result = await publishSongToOpenStageApi(song);
      setPublishResult({
        title: song.title,
        artist: song.artist,
        shareId: result.shareId,
        shareUrl: result.shareUrl
      });
      await onSongShared(song.id);
    } catch {
      setPublishError('Could not share song. Try again.');
    } finally {
      setPublishingSong(false);
    }
  }, [onSongShared, publishingSong, song]);
  const leaveStageWithShareCheck = useCallback(async (leave: () => void) => {
    if (songChangedSinceLastShared(song)) {
      const shouldShare = window.confirm('This song has changed since it was last shared.\n\nChoose OK to Share Update, or Cancel for Later.');
      if (shouldShare) await publishCurrentSong();
    }
    leave();
  }, [publishCurrentSong, song]);
  const handleStageTouchStart = useCallback((event: React.TouchEvent<HTMLDivElement>) => {
    if (activePopover || selectionAction || isInteractiveSwipeTarget(event.target)) {
      swipeStartRef.current = null;
      return;
    }
    const touch = event.touches[0];
    swipeStartRef.current = touch ? { x: touch.clientX, y: touch.clientY, target: event.target } : null;
  }, [activePopover, selectionAction]);
  const handleStageTouchEnd = useCallback((event: React.TouchEvent<HTMLDivElement>) => {
    window.setTimeout(() => updateStageSelectionFromBrowser(stageRef.current, song, setSelectionAction, { preserveExisting: useBottomHarmonyActionBar }), 0);
    const start = swipeStartRef.current;
    swipeStartRef.current = null;
    if (!start || activePopover || selectionAction || hasActiveStageLyricSelection(stageRef.current) || isInteractiveSwipeTarget(start.target) || isInteractiveSwipeTarget(event.target)) return;

    const touch = event.changedTouches[0];
    if (!touch) return;
    const direction = getStageSwipeDirection({
      startX: start.x,
      startY: start.y,
      endX: touch.clientX,
      endY: touch.clientY
    });
    if (direction === 1) onNext();
    if (direction === -1) onPrevious();
  }, [activePopover, onNext, onPrevious, selectionAction, song, stageRef, useBottomHarmonyActionBar]);

  const handleStageSelectionCommit = useCallback(() => {
    window.setTimeout(() => updateStageSelectionFromBrowser(stageRef.current, song, setSelectionAction), 0);
  }, [song, stageRef]);

  const applyStageHarmonySelection = useCallback(async (operation: StageHarmonyEditOperation) => {
    if (!selectionAction) return;
    if (useBottomHarmonyActionBar && selectionAction.pendingOperation !== operation) {
      setSelectionAction((current) => current ? { ...current, pendingOperation: operation } : current);
      return;
    }
    if (!useBottomHarmonyActionBar && state.stageLocked && !window.confirm('Stage Lock is on. Save this harmony edit to the song chart?')) return;
    await onLiveHarmonyEdit(operation, selectionAction.start, selectionAction.end);
    setSelectionAction(null);
    window.getSelection()?.removeAllRanges();
  }, [onLiveHarmonyEdit, selectionAction, state.stageLocked, useBottomHarmonyActionBar]);

  useEffect(() => {
    const handleSelectionChange = () => {
      window.setTimeout(() => updateStageSelectionFromBrowser(stageRef.current, song, setSelectionAction, { preserveExisting: useBottomHarmonyActionBar }), 0);
    };
    document.addEventListener('selectionchange', handleSelectionChange);
    return () => document.removeEventListener('selectionchange', handleSelectionChange);
  }, [song, stageRef, useBottomHarmonyActionBar]);

  useEffect(() => {
    setSelectionAction(null);
    window.getSelection()?.removeAllRanges();
  }, [song.id]);

  useEffect(() => {
    const nextBpm = songBpm ?? 0;
    setStageTempoBpm(nextBpm);
    setTempoInput(songBpm ? String(Math.round(songBpm)) : '');
  }, [song.id, songBpm]);

  useEffect(() => {
    setTempoPanelOpen(false);
    stopTempo();
    clearTempoLongPressTimer();
  }, [clearTempoLongPressTimer, song.id, stopTempo]);

  useEffect(() => {
    clearTempoInterval();
    if (!tempoRunning || !activeTempoBpm) {
      setActiveTempoBeat(null);
      if (tempoRunning && !activeTempoBpm) setTempoRunning(false);
      return;
    }
    const intervalMs = tempoIntervalMs(activeTempoBpm);
    setActiveTempoBeat(0);
    tempoIntervalRef.current = window.setInterval(() => {
      setActiveTempoBeat((beat) => nextTempoBeat(beat));
    }, intervalMs);
    return clearTempoInterval;
  }, [activeTempoBpm, clearTempoInterval, tempoRunning]);

  useEffect(() => {
    clearTempoAutoStopTimers();
    if (!tempoRunning || !tempoStopAfter10Sec) return;

    const startedAtMs = Date.now();
    setTempoCountdownSeconds(10);
    tempoCountdownTimerRef.current = window.setInterval(() => {
      setTempoCountdownSeconds(nextTempoCountdownSeconds(startedAtMs, Date.now()));
    }, 250);
    tempoAutoStopTimerRef.current = window.setTimeout(() => {
      stopTempo();
    }, 10000);

    return clearTempoAutoStopTimers;
  }, [clearTempoAutoStopTimers, stopTempo, tempoRunning, tempoStopAfter10Sec]);

  useEffect(() => {
    if (activePopover || speedPopoverOpen || tempoPanelOpen || selectionAction) return;
    const timer = window.setTimeout(() => {
      setToolbarVisible(false);
      setCursorHidden(true);
    }, 5000);
    return () => window.clearTimeout(timer);
  }, [activePopover, selectionAction, speedPopoverOpen, tempoPanelOpen, toolbarVisible]);

  useEffect(() => {
    if (!speedPopoverOpen) return;
    keepSpeedPopoverAwake();
    return () => {
      if (speedPopoverHideTimerRef.current) {
        window.clearTimeout(speedPopoverHideTimerRef.current);
        speedPopoverHideTimerRef.current = null;
      }
    };
  }, [keepSpeedPopoverAwake, speedPopoverOpen]);

  useEffect(() => () => {
    clearAutoscrollLongPressTimer();
    clearTempoLongPressTimer();
    clearTempoAutoStopTimers();
    if (speedPopoverHideTimerRef.current) window.clearTimeout(speedPopoverHideTimerRef.current);
    if (tempoMessageTimerRef.current !== null) window.clearTimeout(tempoMessageTimerRef.current);
    clearTempoInterval();
  }, [clearAutoscrollLongPressTimer, clearTempoAutoStopTimers, clearTempoInterval, clearTempoLongPressTimer]);

  return (
    <main
      className={`stage-shell stage-profile-${state.activeProfile} relative h-screen overflow-hidden transition-colors duration-300 ${stageBackground} ${cursorHidden && !activePopover ? 'cursor-none' : ''}`}
      data-stage-profile={state.activeProfile}
      data-mobile-reflow={mobileReflowMode ? 'true' : 'false'}
      data-controls-visible={toolbarVisible || activePopover || speedPopoverOpen || tempoPanelOpen || selectionAction ? 'true' : 'false'}
      style={{ background: documentTheme.background, color: documentTheme.text, fontFamily: stageFontFamily }}
      onPointerMove={revealMenu}
      onPointerDown={revealMenu}
      onMouseUp={handleStageSelectionCommit}
    >
      <header
        className={`stage-top-toolbar fixed left-0 right-0 top-0 z-40 transition-opacity duration-300 ${toolbarVisible || activePopover ? 'opacity-100' : 'pointer-events-none opacity-0'} ${state.minimalStageMode ? 'opacity-0' : ''}`}
        style={{ paddingTop: 'max(0.75rem, env(safe-area-inset-top))' }}
      >
        <div className={`stage-toolbar-inner mx-auto grid max-w-7xl grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-3 px-3 sm:px-5 ${headerText}`} style={{ fontSize: `${headerFontSize}px`, color: documentTheme.text, fontFamily: stageFontFamily }}>
          <div className="stage-left-actions flex items-center gap-1 rounded-full border border-white/10 bg-black/25 p-1 backdrop-blur-md">
            <StageIconButton icon={<Library size={19} />} label={activeSetlistName ? `${activeSetlistName} ▼` : 'Library'} tone={toolbarButton} active={activePopover === 'library'} onClick={() => togglePopover('library')} />
            <StageIconButton icon={<ListMusic size={19} />} label="Setlists" tone={toolbarButton} active={activePopover === 'setlists'} onClick={() => togglePopover('setlists')} />
          </div>

          <div className="stage-song-strip grid min-w-0 grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-2 rounded-full border border-white/10 bg-black/20 px-2 py-1.5 text-center backdrop-blur-md">
            <StageIconButton
              icon={<ChevronLeft size={18} />}
              label="Previous Song"
              tone={toolbarButton}
              disabled={!previousSong || isTransitioningSong}
              onClick={onPrevious}
            />
            <div className="min-w-0 px-1">
              <div className="truncate font-semibold leading-tight" style={{ fontSize: '1em' }}>{song.title}</div>
              <div className={`truncate leading-tight ${mutedText}`} style={{ fontSize: '0.72em', color: documentTheme.muted }}>
                {song.artist || 'Unknown artist'}
              </div>
            </div>
            <StageIconButton
              icon={<ChevronRight size={18} />}
              label="Next Song"
              tone={toolbarButton}
              disabled={!nextSong || isTransitioningSong}
              onClick={onNext}
            />
          </div>

          <div className="stage-right-actions relative flex items-center gap-1 rounded-full border border-white/10 bg-black/25 p-1 backdrop-blur-md">
            <StageIconButton icon={<Gauge size={19} />} label="Tempo" tone={toolbarButton} active={tempoRunning} onClick={toggleTempo} />
            <span className="stage-secondary-action inline-flex">
              <StageIconButton icon={<Pencil size={19} />} label="Edit Song" tone={toolbarButton} onClick={() => void leaveStageWithShareCheck(onEdit)} />
            </span>
            <StageIconButton icon={<Settings size={19} />} label="Format" tone={toolbarButton} active={activePopover === 'format'} onClick={() => openFormatPopover('format')} />
            <span className="stage-secondary-action inline-flex">
              <StageIconButton icon={<Monitor size={19} />} label="External Display" tone={toolbarButton} active={activePopover === 'format' && formatTab === 'external'} onClick={() => openFormatPopover('external')} />
            </span>
            <StageIconButton icon={<MoreHorizontal size={19} />} label="More" tone={toolbarButton} active={activePopover === 'more'} onClick={() => togglePopover('more')} />
          </div>
        </div>
      </header>

      <div
        className={`stage-keycapo-badge pointer-events-none fixed right-4 top-24 z-20 grid gap-1 rounded-md border border-white/10 bg-black/20 px-3 py-2 text-right font-semibold leading-tight backdrop-blur-sm transition-opacity duration-300 sm:right-6 ${toolbarVisible || activePopover ? 'opacity-100' : 'opacity-0'} ${headerText}`}
        style={{ fontSize: `${headerFontSize}px`, color: documentTheme.text, fontFamily: stageFontFamily }}
      >
        <div style={{ fontSize: '0.78em' }}>Key {song.key || '-'}</div>
        <div style={{ fontSize: '0.78em' }}>Capo {effectiveCapo}</div>
      </div>

      <TempoBeatIndicator
        activeBeat={activeTempoBeat}
        message={tempoMessage}
        visible={tempoMeterVisible}
        countdownSeconds={tempoRunning && tempoStopAfter10Sec ? tempoCountdownSeconds : null}
        panelOpen={tempoPanelOpen}
        onPointerDown={handleTempoPointerDown}
        onPointerUp={handleTempoPointerEnd}
        onPointerCancel={handleTempoPointerCancel}
        onContextMenu={handleTempoContextMenu}
      />

      {tempoPanelOpen && (
        <>
          <div className="fixed inset-0 z-40" onPointerDown={() => setTempoPanelOpen(false)} />
          <TempoAdjustmentPanel
            bpm={activeTempoBpm ?? stageTempoBpm}
            inputValue={tempoInput}
            message={tempoMessage}
            stopAfter10Sec={tempoStopAfter10Sec}
            onInputChange={setTempoInput}
            onApplyInput={applyTempoInput}
            onChangeBpm={commitTempoBpm}
            onToggleStopAfter10Sec={(checked) => setState({ tempoStopAfter10Sec: checked })}
          />
        </>
      )}

      {activePopover && (
        <div className="fixed inset-0 z-30" onClick={() => setActivePopover(null)}>
          <StageControlPopover
            active={activePopover}
            formatTab={formatTab}
            setFormatTab={setFormatTab}
            menuSurface={menuSurface}
            songs={songs}
            savedSetlists={savedSetlists}
            activeSetlistName={activeSetlistName}
            activeSetlistSongs={entries.map((entry) => entry.song).filter((entrySong): entrySong is Song => Boolean(entrySong))}
            activeSetlistPosition={activeSetlistName && navigationLabel.startsWith('Setlist:') ? navigationPosition : ''}
            currentSongId={song.id}
            state={state}
            setState={setState}
            setPreset={setPreset}
            setAutoscrollSpeed={setAutoscrollSpeed}
            onCalculateDuration={onCalculateDuration}
            isAutoscrolling={isAutoscrolling}
            onToggleAutoscroll={onToggleAutoscroll}
            onSelectStageSong={(songId, source) => {
              onSelectStageSong(songId, source);
              setActivePopover(null);
            }}
            onNewSongAction={(action) => {
              onNewSongAction(action);
              setActivePopover(null);
            }}
            onToggleFavorite={onToggleFavorite}
            onPublishSong={() => void publishCurrentSong()}
            publishingSong={publishingSong}
            onRunStageSetlist={(setlist) => {
              onRunStageSetlist(setlist);
              setActivePopover(null);
            }}
            effectiveCapo={effectiveCapo}
            onChangeSongCapo={onChangeSongCapo}
            onToggleDisplayPreference={onToggleDisplayPreference}
            displayPreference={song.displayPreference ?? 'inline'}
            chordFontSize={chordFontSize}
            externalDisplaySettings={externalDisplaySettings}
            onEdit={() => void leaveStageWithShareCheck(onEdit)}
            onOpenExternalDisplay={() => openFormatPopover('external')}
            onStageMode={onStageMode}
            onSettings={() => void leaveStageWithShareCheck(onSettings)}
            onDisplays={() => void leaveStageWithShareCheck(onDisplays)}
            onDiagnostics={() => void leaveStageWithShareCheck(onDiagnostics)}
            onPedals={() => void leaveStageWithShareCheck(onPedals)}
            onImportExport={() => void leaveStageWithShareCheck(onImportExport)}
            onSync={() => void leaveStageWithShareCheck(onSync)}
            onSendReceiver={onSendReceiver}
            onSendReceiverTestPattern={onSendReceiverTestPattern}
          />
        </div>
      )}

      {(publishingSong || publishResult || publishError) && (
        <PublishSongModal
          result={publishResult}
          error={publishError}
          publishing={publishingSong}
          onClose={() => {
            if (publishingSong) return;
            setPublishResult(null);
            setPublishError('');
          }}
        />
      )}

      {state.castReceiverEnabled && (
        <div className="pointer-events-none absolute bottom-14 left-5 z-20 rounded-lg border border-teal-300/30 bg-black/25 px-3 py-2 text-xs font-semibold text-teal-100 backdrop-blur-sm">
          <div>External Display Connected</div>
          <div>Last Sync: {state.castReceiverLastSync || 'waiting'}</div>
        </div>
      )}
      <div
        className={`fixed z-40 transition-opacity duration-300 ${toolbarVisible || activePopover || speedPopoverOpen ? 'opacity-100' : 'pointer-events-none opacity-0'}`}
        style={{
          right: 'max(1.25rem, env(safe-area-inset-right))',
          bottom: 'max(1.25rem, env(safe-area-inset-bottom))'
        }}
      >
        <button
          ref={autoscrollButtonRef}
          className={`stage-autoscroll-float ${isAutoscrolling ? 'stage-autoscroll-running' : 'stage-autoscroll-paused'}`}
          type="button"
          title={speedPopoverOpen ? 'Adjust Scroll Speed' : isAutoscrolling ? 'Pause Autoscroll' : 'Start Autoscroll'}
          aria-label={speedPopoverOpen ? 'Adjust Scroll Speed' : isAutoscrolling ? 'Pause Autoscroll' : 'Start Autoscroll'}
          aria-haspopup="dialog"
          aria-expanded={speedPopoverOpen}
          onPointerDown={handleAutoscrollPointerDown}
          onPointerUp={handleAutoscrollPointerEnd}
          onPointerCancel={handleAutoscrollPointerEnd}
          onPointerLeave={handleAutoscrollPointerEnd}
          onContextMenu={handleAutoscrollContextMenu}
          onClick={(event) => {
            event.stopPropagation();
            if (autoscrollLongPressActivatedRef.current) {
              autoscrollLongPressActivatedRef.current = false;
              return;
            }
            onToggleAutoscroll();
          }}
        >
          {isAutoscrolling ? <Pause size={20} /> : <ChevronsDown size={21} />}
        </button>
      </div>
      {speedPopoverOpen && (
        <div className="fixed inset-0 z-50" onPointerDown={closeSpeedPopover}>
          <div
            className={`stage-speed-popover fixed rounded-xl border p-3 shadow-2xl backdrop-blur-md ${menuSurface}`}
            role="dialog"
            aria-label="Adjust Scroll Speed"
            onPointerDown={(event) => {
              event.stopPropagation();
              keepSpeedPopoverAwake();
            }}
            onClick={(event) => {
              event.stopPropagation();
              keepSpeedPopoverAwake();
            }}
          >
            <div className="mb-3 flex items-center justify-between gap-3">
              <div>
                <div className="text-xs font-semibold uppercase tracking-normal text-slate-400">Scroll Speed</div>
                <div className="text-lg font-bold">{currentScrollSpeed.toFixed(2)}x</div>
              </div>
              <Gauge size={22} className="text-teal-300" />
            </div>
            <div className="mb-3 grid grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-2">
              <button
                className="stage-speed-step-button"
                type="button"
                aria-label="Decrease Scroll Speed"
                onClick={() => setAutoscrollSpeed(adjustAutoscrollSpeedMultiplier(currentScrollSpeed, -autoscrollSpeedStep))}
              >
                -
              </button>
              <input
                aria-label="Adjust Scroll Speed"
                type="range"
                min={autoscrollSpeedMin}
                max={autoscrollSpeedMax}
                step={autoscrollSpeedStep}
                value={currentScrollSpeed}
                onChange={(event) => setAutoscrollSpeed(Number(event.target.value))}
              />
              <button
                className="stage-speed-step-button"
                type="button"
                aria-label="Increase Scroll Speed"
                onClick={() => setAutoscrollSpeed(adjustAutoscrollSpeedMultiplier(currentScrollSpeed, autoscrollSpeedStep))}
              >
                +
              </button>
            </div>
            <div className="grid grid-cols-4 gap-1.5">
              {autoscrollSpeedQuickPresets.map((preset) => (
                <button
                  key={preset}
                  className={`rounded-md border px-2 py-2 text-xs font-semibold ${Math.abs(currentScrollSpeed - preset) < 0.001 ? 'border-teal-300 bg-teal-600/70 text-white' : 'border-slate-600 bg-white/5'}`}
                  type="button"
                  onClick={() => setAutoscrollSpeed(preset)}
                >
                  {preset.toFixed(preset % 1 === 0 ? 0 : 2)}x
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
      {selectionAction && (
        <>
          {useBottomHarmonyActionBar && selectionAction.pendingOperation && (
            <div
              className="stage-harmony-confirm-popover fixed z-[70] rounded-2xl border border-amber-200/40 bg-slate-950/95 p-3 text-center text-sm font-semibold text-white shadow-2xl backdrop-blur-md"
              role="dialog"
              aria-label="Confirm harmony edit"
              onPointerDown={(event) => event.stopPropagation()}
            >
              <div className="mb-3 text-amber-100">Confirm edit to song chart?</div>
              {state.showHarmonyDebug && (
                <div className="mb-3 rounded-md border border-indigo-300/30 bg-indigo-300/10 px-2 py-1 text-left text-[0.68rem] text-indigo-100">
                  <div>selected text captured: {selectionAction.selectedText.slice(0, 80)}</div>
                  <div>pending selection exists: yes</div>
                  <div>confirmation visible: yes</div>
                  <div>confirmation action: {selectionAction.pendingOperation}</div>
                </div>
              )}
              <div className="flex justify-center gap-2">
                <button className="rounded-full bg-teal-600 px-4 py-2 text-white hover:bg-teal-500" type="button" onPointerDown={keepStageSelectionButtonPress} onClick={() => void applyStageHarmonySelection(selectionAction.pendingOperation!)}>
                  Apply
                </button>
                <button className="rounded-full border border-slate-500 px-4 py-2 text-slate-200 hover:bg-white/10" type="button" onPointerDown={keepStageSelectionButtonPress} onClick={() => setSelectionAction((current) => current ? { ...current, pendingOperation: undefined } : current)}>
                  Cancel
                </button>
              </div>
            </div>
          )}
          <div
            className={`stage-harmony-selection-popover fixed z-[60] flex gap-2 rounded-full border border-indigo-200/40 bg-slate-950/95 p-1.5 text-sm font-semibold text-white shadow-2xl backdrop-blur-md ${useBottomHarmonyActionBar ? 'stage-harmony-action-bar' : ''}`}
            style={useBottomHarmonyActionBar ? undefined : {
              left: `min(max(0.75rem, ${selectionAction.rect.left + selectionAction.rect.width / 2}px), calc(100vw - 15rem))`,
              top: `max(0.75rem, ${selectionAction.rect.top - 54}px)`
            }}
            onPointerDown={(event) => event.stopPropagation()}
            role="toolbar"
            aria-label="Harmony selection actions"
          >
            {state.showHarmonyDebug && (
              <span className="rounded-full bg-indigo-500/20 px-3 py-2 text-[0.65rem] text-indigo-100">
                captured: {selectionAction.selectedText.slice(0, 32)}
              </span>
            )}
            {!selectionAction.hasHarmony && (
              <button className="rounded-full px-4 py-2 hover:bg-white/10" type="button" onPointerDown={keepStageSelectionButtonPress} onClick={() => void applyStageHarmonySelection('mark')}>
                Mark Harmony
              </button>
            )}
            {selectionAction.hasHarmony && (
              <button className="rounded-full px-4 py-2 hover:bg-white/10" type="button" onPointerDown={keepStageSelectionButtonPress} onClick={() => void applyStageHarmonySelection('remove')}>
                Remove Harmony
              </button>
            )}
            <button className="rounded-full px-4 py-2 text-slate-300 hover:bg-white/10" type="button" onPointerDown={keepStageSelectionButtonPress} onClick={() => { setSelectionAction(null); window.getSelection()?.removeAllRanges(); }}>
              Cancel
            </button>
          </div>
        </>
      )}
      {state.showReadingGuide && (
        <div className="pointer-events-none absolute inset-x-0 top-1/2 z-10 h-20 -translate-y-1/2 border-y border-amber-200/10 bg-amber-200/[0.035]" />
      )}
      <div className="stage-edge-dim pointer-events-none absolute inset-0 z-10" />

      <div
        ref={stageRef}
        className={`stage-scroll h-full overflow-y-auto overflow-x-hidden px-5 pb-36 pt-28 sm:px-10 lg:px-16 ${state.portraitMode ? 'portrait-prompter' : ''}`}
        onScroll={(event) => onScroll(event.currentTarget.scrollTop)}
        onTouchStart={handleStageTouchStart}
        onTouchEnd={handleStageTouchEnd}
      >
        <article
          className={`stage-chart mx-auto font-chart transition-opacity duration-200 ${state.portraitMode ? 'max-w-3xl' : 'max-w-5xl'} ${state.mirroredMode ? 'mirror-stage' : ''} ${state.splitScreen ? 'tablet-columns' : ''} ${isTransitioningSong ? 'opacity-35' : 'opacity-100'}`}
          style={{ fontSize: `${lyricFontSize}px`, lineHeight: state.portraitMode ? 1.62 : 1.52, color: documentTheme.text, fontFamily: stageFontFamily, maxWidth: state.portraitMode ? '48rem' : '64rem' }}
        >
          {state.showHarmonyDebug && <RawCurrentSongDebugPanel title="Show Raw Current Song" song={song} />}
          {visibleStageNotes && <p className="mb-8 text-[0.55em] italic opacity-80">{visibleStageNotes}</p>}
          {chartLines.map((line, index) => (
            <ChordProDisplayLine
              key={`${line.raw}-${index}`}
              line={line}
              transpose={state.transpose}
              showNashville={state.showNashvilleNumbers}
              songKey={song.performanceKey || song.key}
              boldChords={boldChords}
              italicChords={italicChords}
              showChords={showChords}
              chordFontColor={chordFontColor}
              chordHighlightColor={chordHighlightColor}
              sectionFontSize={sectionFontSize}
              sectionFontColor={sectionFontColor}
              sectionBold={sectionBold}
              sectionItalic={sectionItalic}
              sectionUppercase={sectionUppercase}
              sectionSpacingBefore={sectionSpacingBefore}
              sectionSpacingAfter={sectionSpacingAfter}
              songTitleStyle={songTitleStyle}
              songArtistStyle={songArtistStyle}
              showHarmonyCues={showHarmonyCues}
              harmonyTextColor={harmonyTextColor}
              harmonyIconColor={harmonyIconColor}
              harmonyItalic={harmonyItalic}
              harmonyUnderline={harmonyUnderline}
              harmonyIconVisible={harmonyIconVisible}
              displayPreference={song.displayPreference ?? 'inline'}
              lineIndex={index}
              chordFontSize={chordFontSize}
              chordFontFamily={chordFontFamily}
              lyricFontSize={lyricFontSize}
              lineSpacing={lineSpacing}
              chordVerticalOffset={chordVerticalOffset}
              mobileReflowMode={mobileReflowMode}
              showAnchorDebug={Boolean(state.showChordAnchorDebug)}
              showHarmonyDebug={Boolean(state.showHarmonyDebug)}
            />
          ))}
        </article>
      </div>

      {state.showAutoscrollDebug && <AutoscrollDebugPanel debug={autoscrollDebug} />}
    </main>
  );
}

function DisplaysManagerView({
  currentSong,
  state,
  setState,
  onSendReceiver,
  onSendReceiverWithState,
  onSendReceiverTestPattern
}: {
  currentSong?: Song;
  state: PerformanceState;
  setState: (next: Partial<PerformanceState>) => void;
  onSendReceiver: () => boolean;
  onSendReceiverWithState: (nextPerformance: PerformanceState) => boolean;
  onSendReceiverTestPattern: () => boolean;
}) {
  const [receivers, setReceivers] = useState<ReceiverRegistration[]>([]);
  const [selectedReceiver, setSelectedReceiver] = useState<ReceiverRegistration | null>(() => getSavedReceiverSelection());
  const [configuring, setConfiguring] = useState<ReceiverRegistration | null>(null);
  const [status, setStatus] = useState('');
  const receiver = normalizeReceiverDisplaySettings(state.receiverDisplay);

  async function refresh() {
    try {
      setStatus('Loading displays...');
      const nextReceivers = await listReceiverRegistrations();
      setReceivers(nextReceivers);
      setStatus(nextReceivers.length ? '' : 'No FireTV receivers discovered yet.');
      const saved = getSavedReceiverSelection();
      if (saved) {
        const fresh = nextReceivers.find((item) => item.pairingCode === saved.pairingCode);
        setSelectedReceiver(fresh ?? saved);
      }
    } catch (error) {
      setStatus(error instanceof Error ? error.message : String(error));
    }
  }

  useEffect(() => {
    void refresh();
  }, []);

  function connect(receiverRegistration: ReceiverRegistration) {
    const saved = saveReceiverSelection(receiverRegistration);
    setSelectedReceiver(saved);
    setStatus(`${receiverRegistration.name} connected.`);
    window.setTimeout(() => onSendReceiver(), 50);
  }

  function disconnect(receiverRegistration: ReceiverRegistration) {
    if (selectedReceiver?.pairingCode === receiverRegistration.pairingCode) {
      saveReceiverSelection(null);
      setSelectedReceiver(null);
      setStatus(`${receiverRegistration.name} disconnected.`);
    }
  }

  function openConfigure(receiverRegistration: ReceiverRegistration) {
    const saved = saveReceiverSelection(receiverRegistration);
    setSelectedReceiver(saved);
    setConfiguring(receiverRegistration);
    setStatus(`Configuring ${receiverRegistration.name}.`);
    window.setTimeout(() => onSendReceiver(), 50);
  }

  async function rename(receiverRegistration: ReceiverRegistration) {
    const nextName = window.prompt('Rename receiver', receiverRegistration.name)?.trim();
    if (!nextName) return;
    try {
      await updateReceiverRegistration(receiverRegistration.pairingCode, nextName, receiverRegistration.online);
      setStatus(`${nextName} renamed.`);
      await refresh();
    } catch (error) {
      setStatus(error instanceof Error ? error.message : String(error));
    }
  }

  async function remove(receiverRegistration: ReceiverRegistration) {
    try {
      await removeReceiverRegistration(receiverRegistration.pairingCode);
      if (selectedReceiver?.pairingCode === receiverRegistration.pairingCode) {
        saveReceiverSelection(null);
        setSelectedReceiver(null);
      }
      setConfiguring((current) => current?.pairingCode === receiverRegistration.pairingCode ? null : current);
      setStatus(`${receiverRegistration.name} removed.`);
      await refresh();
    } catch (error) {
      setStatus(error instanceof Error ? error.message : String(error));
    }
  }

  function updateReceiverSettings(nextReceiver: Partial<ReceiverDisplaySettings>) {
    const nextDisplay = normalizeReceiverDisplaySettings({ ...receiver, ...nextReceiver });
    const nextState = { ...state, receiverDisplay: nextDisplay };
    setState({ receiverDisplay: nextDisplay });
    if (configuring) {
      saveReceiverSelection(configuring);
      setSelectedReceiver(configuring);
      onSendReceiverWithState(nextState);
    }
  }

  function updatePerformanceSettings(next: Partial<PerformanceState>) {
    const nextState = { ...state, ...next };
    setState(next);
    if (configuring) {
      saveReceiverSelection(configuring);
      setSelectedReceiver(configuring);
      onSendReceiverWithState(nextState);
    }
  }

  const themeLabel = stageThemes.find((theme) => theme.name === state.stageTheme)?.label ?? state.stageTheme;

  return (
    <main className="min-h-screen bg-slate-100 p-4 text-slate-950">
      <div className="mx-auto grid max-w-6xl gap-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-2xl font-semibold">Displays</h2>
            <p className="text-sm text-slate-600">Manage FireTV Receiver displays and per-display setup.</p>
          </div>
          <button className="secondary-button" type="button" onClick={() => void refresh()}>
            <RotateCcw size={17} /> Refresh
          </button>
        </div>
        {status && <div className="rounded-md border border-slate-300 bg-white p-3 text-sm text-slate-700">{status}</div>}
        <section className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          {receivers.map((receiverRegistration) => (
            <article key={receiverRegistration.pairingCode} className="grid gap-3 rounded-md border border-slate-300 bg-white p-4 shadow-sm">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h3 className="text-lg font-semibold">{receiverRegistration.name}</h3>
                  <div className={receiverRegistration.online ? 'text-sm font-semibold text-teal-700' : 'text-sm font-semibold text-slate-500'}>
                    {receiverRegistration.online ? '● Online' : '○ Offline'}
                  </div>
                </div>
                <span className="rounded-md border border-slate-200 bg-slate-50 px-2 py-1 text-xs font-semibold">FireTV</span>
              </div>
              <div className="grid gap-1 text-sm text-slate-700">
                <div>Last Seen: {receiverRegistration.lastSeenAt ? new Date(receiverRegistration.lastSeenAt).toLocaleString() : 'Never'}</div>
                <div>Current Song: {receiverRegistration.currentSongTitle || (selectedReceiver?.pairingCode === receiverRegistration.pairingCode ? currentSong?.title : '') || 'None'}</div>
                <div>Display Mode: {receiverDisplayModeLabel((receiverRegistration.displayMode as ReceiverDisplayMode) || receiver.displayMode)}</div>
                <div>Theme: {stageThemes.find((theme) => theme.name === receiverRegistration.theme)?.label ?? receiverRegistration.theme ?? themeLabel}</div>
                <div>Font Scale: {(receiverRegistration.fontScale ?? receiver.fontScale).toFixed(2)}x</div>
              </div>
              <div className="flex flex-wrap gap-2">
                <button className="secondary-button h-9" type="button" onClick={() => connect(receiverRegistration)}>Connect</button>
                <button className="secondary-button h-9" type="button" onClick={() => disconnect(receiverRegistration)}>Disconnect</button>
                <button className="secondary-button h-9" type="button" onClick={() => void rename(receiverRegistration)}>Rename</button>
                <button className="secondary-button h-9" type="button" onClick={() => openConfigure(receiverRegistration)}>Configure</button>
                <button className="secondary-button h-9 text-red-700" type="button" onClick={() => void remove(receiverRegistration)}>Remove</button>
              </div>
            </article>
          ))}
        </section>
      </div>
      {configuring && (
        <div className="fixed inset-0 z-[90] grid place-items-center bg-slate-950/70 p-4">
          <section className="grid max-h-[calc(100vh-2rem)] w-full max-w-3xl gap-3 overflow-y-auto rounded-md border border-slate-300 bg-white p-4 shadow-2xl">
            <div className="flex items-center justify-between gap-3">
              <div>
                <h3 className="text-xl font-semibold">Configure {configuring.name}</h3>
                <p className="text-sm text-slate-600">Changes publish to this receiver using the current Stage song.</p>
              </div>
              <button className="icon-button" type="button" onClick={() => setConfiguring(null)}><X size={18} /></button>
            </div>
            <div className="grid gap-3 md:grid-cols-2">
              <label className="grid gap-1 text-sm font-semibold">
                Display Mode
                <select className="input" value={receiver.displayMode} onChange={(event) => updateReceiverSettings({ displayMode: event.target.value as ReceiverDisplayMode })}>
                  {receiverDisplayModeOptions.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
                </select>
              </label>
              <label className="grid gap-1 text-sm font-semibold">
                Font Scale {receiver.fontScale.toFixed(2)}x
                <input type="range" min={0.65} max={1.8} step={0.05} value={receiver.fontScale} onChange={(event) => updateReceiverSettings({ fontScale: Number(event.target.value) })} />
              </label>
              <label className="grid gap-1 text-sm font-semibold">
                Safe Margin {receiver.safeMargin}%
                <input type="range" min={0} max={14} step={1} value={receiver.safeMargin} onChange={(event) => updateReceiverSettings({ safeMargin: Number(event.target.value) })} />
              </label>
              <label className="grid gap-1 text-sm font-semibold">
                Theme
                <select className="input" value={state.stageTheme} onChange={(event) => updatePerformanceSettings(stageThemePresetPatch(state, event.target.value as PerformanceState['stageTheme']))}>
                  {stageThemes.map((theme) => <option key={theme.name} value={theme.name}>{theme.label}</option>)}
                </select>
              </label>
              <button className="secondary-button justify-start" type="button" onClick={() => updateReceiverSettings({ blackBackground: !receiver.blackBackground })}>
                Background: {receiver.blackBackground ? 'Black' : 'Theme'}
              </button>
              <button className="secondary-button justify-start" type="button" onClick={() => updatePerformanceSettings(showChordsUpdate(state, !getEffectiveShowChords(state)))}>
                Hide Chords: {getEffectiveShowChords(state) ? 'Off' : 'On'}
              </button>
              <button className="secondary-button justify-start" type="button" onClick={() => updatePerformanceSettings(showHarmonyCuesUpdate(state, !getEffectiveShowHarmonyCues(state)))}>
                Show Harmony: {getEffectiveShowHarmonyCues(state) ? 'On' : 'Off'}
              </button>
              <button className="secondary-button justify-start" type="button" onClick={() => updateReceiverSettings({ showDiagnostics: !receiver.showDiagnostics })}>
                Diagnostics: {receiver.showDiagnostics ? 'On' : 'Off'}
              </button>
            </div>
            <div className="flex flex-wrap gap-2">
              <button className="primary-button" type="button" onClick={onSendReceiver}>Send Current Song</button>
              <button className="secondary-button" type="button" onClick={onSendReceiverTestPattern}>Test Pattern</button>
            </div>
          </section>
        </div>
      )}
    </main>
  );
}

function ExternalDisplayControls({
  state,
  setState,
  onSendReceiver,
  onSendReceiverTestPattern,
  onOpenDisplayManager
}: {
  state: PerformanceState;
  setState: (next: Partial<PerformanceState>) => void;
  onSendReceiver: () => boolean;
  onSendReceiverTestPattern: () => boolean;
  onOpenDisplayManager: () => void;
}) {
  const settings = getExternalDisplaySettings(state);
  const receiver = normalizeReceiverDisplaySettings(state.receiverDisplay);
  const [selectedReceiver, setSelectedReceiver] = useState<ReceiverRegistration | null>(() => {
    const saved = getSavedReceiverSelection();
    if (saved) return saved;
    const pairingCode = getHostedReceiverRoomCode();
    return pairingCode ? { pairingCode, name: 'FireTV Receiver', lastSeenAt: '', online: false } : null;
  });
  const [receiverDialogOpen, setReceiverDialogOpen] = useState(false);
  const [availableReceivers, setAvailableReceivers] = useState<ReceiverRegistration[]>([]);
  const [receiverListStatus, setReceiverListStatus] = useState('');
  const [pairNewReceiver, setPairNewReceiver] = useState(false);
  const [pairingCodeInput, setPairingCodeInput] = useState('');
  const [receiverStatus, setReceiverStatus] = useState<RemoteDisplayStatus>('disconnected');
  const [receiverMessage, setReceiverMessage] = useState('');
  const [status, setStatus] = useState('');
  const receiverSettingsMountedRef = useRef(false);
  const updateSettings = (next: Partial<PerformanceState['externalDisplay']>) =>
    setState({ externalDisplay: { ...settings, ...next } });
  const updateReceiver = (next: Partial<ReceiverDisplaySettings>) =>
    setState({ receiverDisplay: normalizeReceiverDisplaySettings({ ...receiver, ...next }) });
  const activateAirPlayPortrait = () => setState({ externalDisplay: appleTvPortraitPrompterSettings(settings) });
  const outputStatus = status || (settings.enabled ? 'External output connected' : 'Open the external output first to preview changes.');

  useEffect(() => subscribeRemoteDisplayControllerStatus(setReceiverStatus), []);

  useEffect(() => {
    if (!receiverSettingsMountedRef.current) {
      receiverSettingsMountedRef.current = true;
      return;
    }
    const timer = window.setTimeout(() => {
      onSendReceiver();
    }, 50);
    return () => window.clearTimeout(timer);
  }, [receiver.displayMode, receiver.blackBackground, receiver.fontScale, receiver.safeMargin, receiver.showDiagnostics]);

  function flashReceiverMessage(message: string) {
    setReceiverMessage(message);
    window.setTimeout(() => setReceiverMessage(''), 2400);
  }

  function selectReceiver(receiverRegistration: ReceiverRegistration) {
    const saved = saveReceiverSelection(receiverRegistration);
    setSelectedReceiver(saved);
    setReceiverDialogOpen(false);
    setPairNewReceiver(false);
    setPairingCodeInput('');
    flashReceiverMessage(saved ? `${saved.name} selected` : 'Receiver cleared');
    window.setTimeout(() => {
      onSendReceiver();
    }, 50);
  }

  function clearReceiverSelection() {
    saveReceiverSelection(null);
    setSelectedReceiver(null);
    flashReceiverMessage('Receiver selection cleared');
  }

  async function refreshReceivers() {
    try {
      setReceiverListStatus('Loading receivers...');
      const receivers = await listReceiverRegistrations();
      setAvailableReceivers(receivers);
      setReceiverListStatus(receivers.length ? '' : 'No receivers found yet.');
    } catch (error) {
      setReceiverListStatus(error instanceof Error ? error.message : String(error));
    }
  }

  async function pairReceiverByCode() {
    try {
      setReceiverListStatus('Pairing receiver...');
      const receiverRegistration = await fetchReceiverRegistration(pairingCodeInput);
      selectReceiver(receiverRegistration);
      setReceiverListStatus('');
    } catch (error) {
      setReceiverListStatus(error instanceof Error ? error.message : String(error));
    }
  }

  useEffect(() => {
    if (receiverDialogOpen) void refreshReceivers();
  }, [receiverDialogOpen]);

  async function launchExternalDisplay() {
    updateSettings({ enabled: true });
    try {
      const result = await openExternalPrompter();
      setStatus(
        result === 'presentation-api'
          ? 'External presentation started'
          : result === 'window'
            ? 'Prompter window opened'
            : 'Popup blocked - use mirror fallback'
      );
    } catch (error) {
      setStatus('External display unavailable - mirror fallback active');
      reportError('External display launch failed', error);
    }
  }

  const currentDisplay = selectedReceiver?.name || 'No display selected';

  return (
    <div className="stage-format-receiver-only grid gap-3 rounded-md border border-slate-700 bg-slate-950 p-3 text-xs">
      <div className="grid gap-3 rounded-md border border-sky-300/30 bg-sky-300/10 p-3 text-sky-50">
        <div className="grid gap-2">
          <div className="text-[0.65rem] font-semibold uppercase tracking-wide text-slate-300">External Display</div>
          <div className="rounded-md border border-sky-200/20 bg-slate-950/70 p-3">
            <div className="text-slate-300">Current Display</div>
            <div className="text-base font-semibold text-white">{currentDisplay}</div>
          </div>
          <button className="stage-menu-button justify-start" type="button" onClick={onOpenDisplayManager}>
            <Monitor size={18} /> Open Display Manager
          </button>
        </div>
      </div>
      <div className="hidden">
      <div className="grid gap-3 rounded-md border border-sky-300/30 bg-sky-300/10 p-3 text-sky-50">
        <div className="flex items-start justify-between gap-3">
          <div>
            <div className="font-semibold text-white">FireTV Receiver</div>
            <div className="text-slate-300">Open /receiver on the FireTV and enter its pairing code here.</div>
          </div>
          <span className="rounded-full border border-sky-300/40 bg-black/30 px-2 py-1 text-[0.65rem] font-semibold">
            {remoteDisplayStatusLabel(receiverStatus)}
          </span>
        </div>
        <div className="grid gap-2 sm:grid-cols-2">
          <label className="grid gap-1">
            Display Mode
            <select
              className="input bg-slate-900 text-white"
              value={receiver.displayMode}
              onChange={(event) => updateReceiver({ displayMode: event.target.value as ReceiverDisplayMode })}
            >
              {receiverDisplayModeOptions.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
            </select>
          </label>
          <label className="grid gap-1">
            Font Scale {receiver.fontScale.toFixed(2)}x
            <input type="range" min={0.65} max={1.8} step={0.05} value={receiver.fontScale} onChange={(event) => updateReceiver({ fontScale: Number(event.target.value) })} />
          </label>
        </div>
        <div className="grid gap-2 rounded-md border border-sky-200/20 bg-black/20 p-2">
          <div className="text-[0.65rem] font-semibold uppercase tracking-wide text-slate-300">External Display</div>
          <div className="flex items-center justify-between gap-3 rounded-md border border-sky-200/20 bg-slate-950/70 p-3">
            <div>
              <div className="text-slate-300">Current Receiver</div>
              <div className="text-base font-semibold text-white">{selectedReceiver?.name || 'No receiver selected'}</div>
            </div>
            <button className="stage-menu-button" type="button" onClick={() => setReceiverDialogOpen(true)}>
              <Monitor size={18} /> Change Receiver
            </button>
          </div>
          <div className="text-slate-300">Normal mode uses Supabase Realtime. The local WebSocket relay is debug-only with /receiver?transport=ws.</div>
          {receiverDialogOpen && (
            <div className="fixed inset-0 z-[80] grid place-items-center bg-black/70 p-4">
              <div className="grid w-full max-w-md gap-3 rounded-md border border-sky-300/30 bg-slate-950 p-4 text-slate-100 shadow-2xl">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="text-lg font-semibold text-white">Change Receiver</div>
                    <div className="text-slate-400">Choose a discovered FireTV receiver or pair a new one.</div>
                  </div>
                  <button className="stage-menu-button" type="button" onClick={() => setReceiverDialogOpen(false)}>
                    <X size={18} />
                  </button>
                </div>
                <div className="grid max-h-72 gap-2 overflow-y-auto">
                  {availableReceivers.map((receiverRegistration) => (
                    <button
                      key={receiverRegistration.pairingCode}
                      className={`flex items-center justify-between rounded-md border px-3 py-3 text-left ${selectedReceiver?.pairingCode === receiverRegistration.pairingCode ? 'border-teal-300 bg-teal-300/10' : 'border-slate-700 bg-black/20'}`}
                      type="button"
                      onClick={() => selectReceiver(receiverRegistration)}
                    >
                      <span>
                        <span className="block text-sm font-semibold text-white">{receiverRegistration.name}</span>
                      </span>
                      <span className={receiverRegistration.online ? 'text-teal-200' : 'text-slate-500'}>
                        {receiverRegistration.online ? '● Online' : '○ Offline'}
                      </span>
                    </button>
                  ))}
                </div>
                {receiverListStatus && <div className="rounded-md border border-slate-700 bg-black/20 p-2 text-slate-300">{receiverListStatus}</div>}
                {pairNewReceiver ? (
                  <div className="grid gap-2 rounded-md border border-slate-700 bg-black/20 p-3">
                    <label className="grid gap-1">
                      Pairing Code
                      <input
                        className="input bg-slate-900 font-mono text-white"
                        placeholder="ABCD1234"
                        value={pairingCodeInput}
                        maxLength={8}
                        onChange={(event) => setPairingCodeInput(event.target.value.toUpperCase().replace(/[^A-Z0-9]/g, ''))}
                      />
                    </label>
                    <button className="stage-menu-button" type="button" onClick={pairReceiverByCode}>
                      Save Receiver
                    </button>
                  </div>
                ) : (
                  <button className="stage-menu-button justify-start" type="button" onClick={() => setPairNewReceiver(true)}>
                    <Plus size={18} /> Pair New Receiver
                  </button>
                )}
                <div className="flex flex-wrap gap-2">
                  <button className="stage-menu-button" type="button" onClick={() => void refreshReceivers()}>
                    <RotateCcw size={18} /> Refresh
                  </button>
                  <button className="stage-menu-button" type="button" onClick={clearReceiverSelection}>
                    <X size={18} /> Clear Receiver
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
        <label className="grid gap-1">
          Safe Margin {receiver.safeMargin}%
          <input type="range" min={0} max={14} step={1} value={receiver.safeMargin} onChange={(event) => updateReceiver({ safeMargin: Number(event.target.value) })} />
        </label>
        <div className="flex flex-wrap gap-2">
          <button className="stage-menu-button" type="button" onClick={() => updateReceiver({ blackBackground: !receiver.blackBackground })}>
            <Moon size={18} /> Black Background {receiver.blackBackground ? 'On' : 'Off'}
          </button>
          <button className="stage-menu-button" type="button" onClick={() => updateReceiver({ showDiagnostics: !receiver.showDiagnostics })}>
            <Monitor size={18} /> {receiver.showDiagnostics ? 'Hide Receiver Diagnostics' : 'Show Receiver Diagnostics'}
          </button>
          <button className="stage-menu-button" type="button" onClick={() => {
            const sent = onSendReceiver();
            flashReceiverMessage(sent ? 'Current song sent to receiver' : 'Receiver update queued');
          }}>
            <Share2 size={18} /> Send Current Song
          </button>
          <button className="stage-menu-button" type="button" onClick={() => {
            const sent = onSendReceiverTestPattern();
            flashReceiverMessage(sent ? 'Test pattern sent' : 'Test pattern queued');
          }}>
            <Gauge size={18} /> Test Pattern
          </button>
        </div>
        <div className="rounded-md border border-sky-200/20 bg-black/20 p-2 text-slate-200">
          <div>Receiver URL: <span className="font-mono">/receiver</span></div>
          <div>Local debug URL: <span className="font-mono">/receiver?transport=ws&amp;remoteWs={getRemoteDisplayUrl()}</span></div>
          <div>Mode: {receiverDisplayModeLabel(receiver.displayMode)}</div>
          {receiverMessage && <div className="font-semibold text-teal-100">{receiverMessage}</div>}
        </div>
        <div className="rounded-md border border-sky-200/20 bg-black/20 p-2 text-slate-300">
          FireTV Receiver is the active external display system. Legacy Apple TV controls are hidden.
        </div>
      </div>
      <div className="grid gap-2">
        <div className="flex items-start justify-between gap-2">
          <div>
            <div className="font-semibold text-white">External Display</div>
            <div className="text-slate-400">
              Presentation API {supportsPresentationApi() ? 'available' : 'unavailable'} / window {supportsExternalWindow() ? 'available' : 'blocked'}
            </div>
          </div>
          <div className={`rounded-full border px-2 py-1 text-[0.65rem] font-semibold ${settings.enabled ? 'border-teal-400/50 bg-teal-400/10 text-teal-100' : 'border-amber-300/40 bg-amber-300/10 text-amber-100'}`}>
            {outputStatus}
          </div>
        </div>
        <div className="grid gap-2 rounded-md border border-teal-300/30 bg-teal-300/10 p-3 text-teal-50">
          <div className="flex items-center justify-between gap-3">
            <div>
              <div className="font-semibold">Cast Receiver Test</div>
              <div className="text-slate-300">Publishes the current Stage song for /cast-receiver polling.</div>
            </div>
            <button className="stage-menu-button" type="button" onClick={() => setState({ castReceiverEnabled: !state.castReceiverEnabled })}>
              External Display {state.castReceiverEnabled ? 'ON' : 'OFF'}
            </button>
          </div>
          <div className="rounded-md border border-teal-200/20 bg-black/20 p-2">
            <div>{state.castReceiverEnabled ? 'External Display Connected' : 'External Display Off'}</div>
            <div>Last Sync: {state.castReceiverLastSync || 'waiting'}</div>
          </div>
        </div>
        <div className="rounded-md border border-slate-700 bg-black/20 p-3 text-slate-300">
          <div>Step 1: Open External Prompter Output</div>
          <div>Step 2: AirPlay that output to Apple TV</div>
          <div>Step 3: Use the controls below to adjust rotation, zoom, offset, and safe margins</div>
        </div>
      </div>
      <div className="grid gap-2 sm:grid-cols-3">
        <button className="stage-menu-button" type="button" onClick={launchExternalDisplay}>
          <Monitor size={18} /> Open External Prompter Output
        </button>
        <button className="stage-menu-button" type="button" onClick={() => updateSettings({ enabled: true, showCalibration: true, fillScreenTest: false })}>
          <Gauge size={18} /> Start Calibration
        </button>
        <button className="stage-menu-button" type="button" onClick={() => updateSettings({ enabled: true, fillScreenTest: !settings.fillScreenTest, showCalibration: true })}>
          <Expand size={18} /> Fill Screen Test
        </button>
      </div>
      <button className="stage-menu-button" onClick={() => updateSettings({ enabled: !settings.enabled })}>
        {settings.enabled ? 'External Mode On' : 'External Mode Off'}
      </button>
      <label className="grid gap-1">
        External Display Mode
        <select
          className="input bg-slate-900 text-white"
          value={settings.outputMode}
          onChange={(event) => {
            const outputMode = event.target.value as PerformanceState['externalDisplay']['outputMode'];
            if (outputMode === 'airplay-portrait-fill') {
              setState({ externalDisplay: appleTvPortraitPrompterSettings(settings) });
            } else {
              updateSettings({ outputMode: 'standard', profileName: 'Standard External Display' });
            }
          }}
        >
          <option value="standard">Standard External Display</option>
          <option value="airplay-portrait-fill">AirPlay Portrait Fill</option>
        </select>
      </label>
      <button className="stage-menu-button" type="button" onClick={activateAirPlayPortrait}>
        Apple TV Portrait Prompter Profile
      </button>
      <label className="grid gap-1">
        Rotation
        <select className="input bg-slate-900 text-white" value={settings.rotation} onChange={(event) => updateSettings({ rotation: event.target.value as PerformanceState['externalDisplay']['rotation'] })}>
          <option value="normal">Normal</option>
          <option value="cw-90">90° clockwise</option>
          <option value="ccw-90">90° counterclockwise</option>
          <option value="rotate-180">180°</option>
        </select>
      </label>
      <label className="grid gap-1">
        Scale
        <select className="input bg-slate-900 text-white" value={settings.scaleMode} onChange={(event) => updateSettings({ scaleMode: event.target.value as PerformanceState['externalDisplay']['scaleMode'] })}>
          <option value="fit">Fit</option>
          <option value="fill">Fill</option>
          <option value="manual">Manual zoom</option>
        </select>
      </label>
      {settings.scaleMode === 'manual' && (
        <label className="grid gap-1">
          Manual Zoom {Math.round(settings.manualZoom * 100)}%
          <input type="range" min={0.35} max={3} step={0.05} value={settings.manualZoom} onChange={(event) => updateSettings({ manualZoom: Number(event.target.value) })} />
        </label>
      )}
      {settings.scaleMode !== 'manual' && (
        <label className="grid gap-1">
          Zoom Trim {Math.round(settings.manualZoom * 100)}%
          <input type="range" min={0.75} max={1.5} step={0.025} value={settings.manualZoom} onChange={(event) => updateSettings({ manualZoom: Number(event.target.value) })} />
        </label>
      )}
      <label className="grid gap-1">
        Horizontal Offset {settings.offsetX.toFixed(1)}vw
        <input type="range" min={-25} max={25} step={0.5} value={settings.offsetX} onChange={(event) => updateSettings({ offsetX: Number(event.target.value) })} />
      </label>
      <label className="grid gap-1">
        Vertical Offset {settings.offsetY.toFixed(1)}vh
        <input type="range" min={-25} max={25} step={0.5} value={settings.offsetY} onChange={(event) => updateSettings({ offsetY: Number(event.target.value) })} />
      </label>
      <label className="grid gap-1">
        Safe margin {settings.safeMargin}%
        <input type="range" min={0} max={20} step={1} value={settings.safeMargin} onChange={(event) => updateSettings({ safeMargin: Number(event.target.value) })} />
      </label>
      <div className="grid gap-2 sm:grid-cols-2">
        <button className="stage-menu-button" onClick={() => updateSettings({ enabled: true, showCalibration: !settings.showCalibration })}>
          Calibration Overlay {settings.showCalibration ? 'On' : 'Off'}
        </button>
        <button className="stage-menu-button" onClick={() => updateSettings({ enabled: true, fillScreenTest: !settings.fillScreenTest, showCalibration: true })}>
          Fill Screen Test {settings.fillScreenTest ? 'On' : 'Off'}
        </button>
      </div>
      <div className="rounded-md border border-slate-700 bg-black/20 p-2 text-slate-300">
        Profile: {settings.profileName}
      </div>
      {!settings.enabled && <div className="text-amber-200">Open the external output first to preview changes.</div>}
      {!supportsPresentationApi() && <div className="text-slate-400">Safari fallback: use AirPlay mirroring, then apply rotation/scale here.</div>}
      <div className="text-slate-400">Rotation and scale apply only to the external prompter output, not this iPad Stage view.</div>
      </div>
    </div>
  );
}

function StageIconButton({
  icon,
  label,
  tone,
  active = false,
  disabled = false,
  onClick
}: {
  icon: React.ReactNode;
  label: string;
  tone: string;
  active?: boolean;
  disabled?: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      className={`inline-flex h-11 w-11 items-center justify-center rounded-full border transition duration-150 disabled:cursor-not-allowed disabled:opacity-35 ${tone} ${active ? 'ring-2 ring-amber-300/70' : ''}`}
      title={label}
      aria-label={label}
      disabled={disabled}
      onClick={(event) => {
        event.stopPropagation();
        onClick();
      }}
    >
      {icon}
    </button>
  );
}

function TempoBeatIndicator({
  activeBeat,
  message,
  visible,
  countdownSeconds,
  panelOpen,
  onPointerDown,
  onPointerUp,
  onPointerCancel,
  onContextMenu
}: {
  activeBeat: number | null;
  message: string;
  visible: boolean;
  countdownSeconds: number | null;
  panelOpen: boolean;
  onPointerDown: (event: React.PointerEvent<HTMLDivElement>) => void;
  onPointerUp: (event: React.PointerEvent<HTMLDivElement>) => void;
  onPointerCancel: (event: React.PointerEvent<HTMLDivElement>) => void;
  onContextMenu: (event: React.MouseEvent<HTMLDivElement>) => void;
}) {
  return (
    <div
      className={`stage-tempo-indicator fixed z-40 flex items-center transition-opacity duration-200 ${visible ? 'opacity-100' : 'pointer-events-none opacity-0'}`}
      aria-live="polite"
      onPointerDown={onPointerDown}
      onPointerUp={onPointerUp}
      onPointerCancel={onPointerCancel}
      onContextMenu={onContextMenu}
    >
      <div
        className="stage-tempo-pill flex touch-none select-none flex-col items-center justify-center rounded-full border border-white/15 bg-black/55 shadow-xl backdrop-blur-md"
        aria-label={activeBeat === null ? 'Tempo inactive' : `Beat ${activeBeat + 1}`}
      >
        {[0, 1, 2, 3].map((beat) => {
          const tone = tempoDotTone(beat, activeBeat);
          return (
            <span
              key={beat}
              className={`stage-tempo-dot rounded-full transition-colors duration-100 ${
                tone === 'gold'
                  ? 'bg-amber-300 shadow-[0_0_15px_rgba(252,211,77,0.75)]'
                  : tone === 'purple'
                    ? 'bg-violet-400 shadow-[0_0_15px_rgba(167,139,250,0.7)]'
                    : 'bg-slate-500/45'
              }`}
            />
          );
        })}
      </div>
      {countdownSeconds !== null && (
        <span className="stage-tempo-countdown ml-2 rounded-full border border-white/15 bg-black/60 px-2 py-1 text-[0.68rem] font-bold text-amber-100 shadow-lg backdrop-blur-md">
          {countdownSeconds}s
        </span>
      )}
      {message && <span className="stage-tempo-message ml-2 rounded-full border border-amber-200/20 bg-black/60 px-3 py-1.5 text-[0.7rem] font-semibold text-amber-100 shadow-lg backdrop-blur-md">{message}</span>}
    </div>
  );
}

function TempoAdjustmentPanel({
  bpm,
  inputValue,
  message,
  stopAfter10Sec,
  onInputChange,
  onApplyInput,
  onChangeBpm,
  onToggleStopAfter10Sec
}: {
  bpm: number | null;
  inputValue: string;
  message: string;
  stopAfter10Sec: boolean;
  onInputChange: (value: string) => void;
  onApplyInput: () => void;
  onChangeBpm: (bpm: number) => void;
  onToggleStopAfter10Sec: (checked: boolean) => void;
}) {
  const currentBpm = clampTempoBpm(bpm, 120);
  return (
    <div
      className="stage-tempo-panel fixed z-50 rounded-2xl border border-white/15 bg-black/75 p-2.5 text-center text-slate-100 shadow-2xl backdrop-blur-md"
      onPointerDown={(event) => event.stopPropagation()}
    >
      <div className="mb-2 grid gap-0.5">
        <div className="text-[0.65rem] font-semibold uppercase tracking-wide text-slate-400">Tempo BPM</div>
        <div className="text-lg font-bold leading-tight">{currentBpm} BPM</div>
      </div>
      <div className="flex items-center justify-center gap-2">
        <input
          className="stage-tempo-slider"
          aria-label="Tempo Slider"
          type="range"
          min={minTempoBpm}
          max={maxTempoBpm}
          step={1}
          value={currentBpm}
          onChange={(event) => onChangeBpm(Number(event.target.value))}
        />
        <div className="flex flex-col items-center gap-1">
          <button className="stage-tempo-step-button" type="button" aria-label="Increase Tempo" onClick={() => onChangeBpm(stepTempoBpm(currentBpm, 1))}>+</button>
          <input
            className="h-11 w-14 rounded-xl border border-white/15 bg-white/10 px-1.5 text-center text-base font-semibold text-white outline-none focus:border-amber-300"
            aria-label="Tempo BPM"
            inputMode="numeric"
            value={inputValue}
            onChange={(event) => {
              onInputChange(event.target.value);
              const value = parseTempoBpmInput(event.target.value);
              if (value !== null) onChangeBpm(value);
            }}
            onBlur={onApplyInput}
            onKeyDown={(event) => {
              if (event.key === 'Enter') onApplyInput();
            }}
          />
          <button className="stage-tempo-step-button" type="button" aria-label="Decrease Tempo" onClick={() => onChangeBpm(stepTempoBpm(currentBpm, -1))}>-</button>
        </div>
      </div>
      <label className="mt-2 flex min-h-11 items-center justify-center gap-2 text-sm font-medium text-white">
        <input
          className="h-4 w-4 shrink-0 accent-blue-500 outline outline-1 outline-white/80"
          type="checkbox"
          checked={stopAfter10Sec}
          onChange={(event) => onToggleStopAfter10Sec(event.target.checked)}
        />
        <span className="leading-tight">Stop after 10 sec</span>
      </label>
      {message && <div className="mt-2 max-w-44 text-xs font-semibold text-amber-100">{message}</div>}
    </div>
  );
}

function PublishSongModal({
  result,
  error,
  publishing,
  onClose
}: {
  result: PublishedSongResult | null;
  error: string;
  publishing: boolean;
  onClose: () => void;
}) {
  const [copyMessage, setCopyMessage] = useState('');
  const canShare = Boolean(result && typeof navigator !== 'undefined' && 'share' in navigator);

  async function copyLink() {
    if (!result) return;

    try {
      await navigator.clipboard.writeText(result.shareUrl);
      setCopyMessage('Link copied.');
    } catch {
      setCopyMessage('Copy failed. Select the link manually.');
    }
  }

  async function copyShareCode() {
    if (!result) return;

    try {
      await navigator.clipboard.writeText(result.shareId);
      setCopyMessage('Share code copied.');
    } catch {
      setCopyMessage('Copy failed. Select the share code manually.');
    }
  }

  async function shareLink() {
    if (!result || !canShare) return;

    try {
      await navigator.share({
        title: 'OpenStage Song',
        text: `${result.title} by ${result.artist || 'Unknown artist'}`,
        url: result.shareUrl
      });
    } catch {
      // Native share cancellation should not become an app error.
    }
  }

  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center bg-black/45 px-4 py-6 backdrop-blur-sm" onClick={onClose}>
      <section
        className="w-full max-w-md rounded-xl border border-slate-600 bg-slate-950 p-5 text-slate-100 shadow-2xl"
        role="dialog"
        aria-modal="true"
        aria-label={result ? 'Song Shared' : publishing ? 'Sharing Song' : 'Share Error'}
        onClick={(event) => event.stopPropagation()}
      >
        {publishing && (
          <div className="grid gap-3 text-center">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full border border-teal-300/40 bg-teal-300/10 text-teal-200">
              <Upload size={22} />
            </div>
            <h2 className="text-xl font-semibold">Sharing song...</h2>
          </div>
        )}

        {!publishing && result && (
          <div className="grid gap-4">
            <div>
              <div className="flex items-center gap-2 text-teal-200">
                <CheckCircle size={22} />
                <h2 className="text-xl font-semibold text-white">Share Song</h2>
              </div>
              <p className="mt-2 text-sm text-slate-300">
                {result.title}{result.artist ? ` by ${result.artist}` : ''}
              </p>
            </div>
            <div>
              <label className="mb-1 block text-xs font-semibold uppercase tracking-normal text-slate-400">Share Code</label>
              <div className="rounded-md border border-teal-400/40 bg-teal-300/10 p-4 text-center font-mono text-3xl font-bold tracking-[0.18em] text-teal-100">
                {result.shareId}
              </div>
            </div>
            <div>
              <label className="mb-1 block text-xs font-semibold uppercase tracking-normal text-slate-400">Share URL</label>
              <div className="break-all rounded-md border border-slate-700 bg-black/25 p-3 font-mono text-sm text-teal-100">
                {result.shareUrl}
              </div>
            </div>
            {copyMessage && <div className="rounded-md border border-teal-300/30 bg-teal-300/10 px-3 py-2 text-sm font-semibold text-teal-100">{copyMessage}</div>}
            <div className="flex flex-wrap justify-end gap-2">
              {canShare && (
                <button className="stage-menu-button" type="button" onClick={shareLink}>
                  <Share2 size={18} /> Share Link
                </button>
              )}
              <button className="stage-menu-button" type="button" onClick={copyShareCode}>
                <Copy size={18} /> Copy Share Code
              </button>
              <button className="stage-menu-button" type="button" onClick={copyLink}>
                <Copy size={18} /> Copy Link
              </button>
              <button className="stage-menu-button" type="button" onClick={onClose}>
                <X size={18} /> Close
              </button>
            </div>
          </div>
        )}

        {!publishing && error && (
          <div className="grid gap-4">
            <div className="flex items-center gap-2 text-amber-200">
              <AlertTriangle size={22} />
              <h2 className="text-xl font-semibold text-white">Share Failed</h2>
            </div>
            <p className="text-sm text-slate-200">{error}</p>
            <div className="flex justify-end">
              <button className="stage-menu-button" type="button" onClick={onClose}>
                <X size={18} /> Close
              </button>
            </div>
          </div>
        )}
      </section>
    </div>
  );
}

function StageControlPopover({
  active,
  formatTab,
  setFormatTab,
  menuSurface,
  songs,
  savedSetlists,
  activeSetlistName,
  activeSetlistSongs,
  activeSetlistPosition,
  currentSongId,
  state,
  setState,
  setPreset,
  setAutoscrollSpeed,
  onCalculateDuration,
  isAutoscrolling,
  onToggleAutoscroll,
  onSelectStageSong,
  onNewSongAction,
  onToggleFavorite,
  onPublishSong,
  publishingSong,
  onRunStageSetlist,
  effectiveCapo,
  onChangeSongCapo,
  onToggleDisplayPreference,
  displayPreference,
  chordFontSize,
  externalDisplaySettings,
  onEdit,
  onOpenExternalDisplay,
  onStageMode,
  onSettings,
  onDisplays,
  onDiagnostics,
  onPedals,
  onImportExport,
  onSync,
  onSendReceiver,
  onSendReceiverTestPattern
}: {
  active: StagePopoverName;
  formatTab: StageFormatTab;
  setFormatTab: (tab: StageFormatTab) => void;
  menuSurface: string;
  songs: Song[];
  savedSetlists: SavedSetlist[];
  activeSetlistName: string;
  activeSetlistSongs: Song[];
  activeSetlistPosition: string;
  currentSongId: string;
  state: PerformanceState;
  setState: (next: Partial<PerformanceState>) => void;
  setPreset: (preset: AutoscrollPreset) => void;
  setAutoscrollSpeed: (speed: number) => void;
  onCalculateDuration: () => void;
  isAutoscrolling: boolean;
  onToggleAutoscroll: () => void;
  onSelectStageSong: (songId: string, source?: NavigationContext) => void;
  onNewSongAction: (action: NewSongAction) => void;
  onToggleFavorite: (songId: string) => void;
  onPublishSong: () => void;
  publishingSong: boolean;
  onRunStageSetlist: (setlist: SavedSetlist) => void;
  effectiveCapo: number;
  onChangeSongCapo: (capo: number) => void;
  onToggleDisplayPreference: () => void;
  displayPreference: Song['displayPreference'];
  chordFontSize: number;
  externalDisplaySettings: PerformanceState['externalDisplay'];
  onEdit: () => void;
  onOpenExternalDisplay: () => void;
  onStageMode: () => void;
  onSettings: () => void;
  onDisplays: () => void;
  onDiagnostics: () => void;
  onPedals: () => void;
  onImportExport: () => void;
  onSync: () => void;
  onSendReceiver: () => boolean;
  onSendReceiverTestPattern: () => boolean;
}) {
  const [libraryQuery, setLibraryQuery] = useState('');
  const [libraryScope, setLibraryScope] = useState<'setlist' | 'all'>(activeSetlistSongs.length > 0 ? 'setlist' : 'all');
  const [newSongMenuOpen, setNewSongMenuOpen] = useState(false);
  const [selectedDisplayProfile, setSelectedDisplayProfile] = useState<DeviceProfile>(state.activeProfile);
  const [profileMessage, setProfileMessage] = useState('');
  const popoverPosition = active === 'library' || active === 'setlists' ? 'left-3 sm:left-5' : 'right-3 sm:right-5';
  const documentTheme = getDocumentThemePreset(getEffectiveDocumentTheme(state));
  const stageFontFamily = resolveStageFontFamily(getEffectiveStageFontFamily(state));
  const chordFontFamily = getEffectiveUseMonospaceChords(state) ? 'Consolas, "Courier New", monospace' : stageFontFamily;
  const previewChordColor = resolveChordFontColor(getEffectiveChordFontColor(state));
  const currentStageSong = songs.find((song) => song.id === currentSongId);
  const hasActiveSetlist = activeSetlistSongs.length > 0 && Boolean(activeSetlistName);
  const librarySourceSongs = hasActiveSetlist && libraryScope === 'setlist' ? activeSetlistSongs : songs;
  const filteredStageSongs = useMemo(() => {
    const query = libraryQuery.trim().toLowerCase();
    const matches = !query
      ? librarySourceSongs
      : librarySourceSongs.filter((song) =>
        [song.title, song.artist, song.key, String(song.bpm || ''), song.tags.join(' ')]
        .join(' ')
        .toLowerCase()
        .includes(query)
      );
    if (hasActiveSetlist && libraryScope === 'setlist') return matches;
    return [...matches].sort((left, right) => {
      if (Boolean(left.favorite) !== Boolean(right.favorite)) return left.favorite ? -1 : 1;
      return left.title.localeCompare(right.title);
    });
  }, [hasActiveSetlist, libraryQuery, libraryScope, librarySourceSongs]);
  const favoriteStageSongs = libraryScope === 'all' ? filteredStageSongs.filter((song) => song.favorite) : [];
  const regularStageSongs = libraryScope === 'all' ? filteredStageSongs.filter((song) => !song.favorite) : filteredStageSongs;
  const activeProfileValues = {
    lyric: getEffectiveLyricFontSize(state),
    chord: getEffectiveChordFontSize(state),
    title: getEffectiveSongTitleFontSize(state),
    artist: getEffectiveSongArtistFontSize(state),
    section: getEffectiveSectionFontSize(state),
    header: getEffectiveHeaderFontSize(state),
    lineSpacing: getEffectiveLineSpacing(state),
    sectionBefore: getEffectiveSectionSpacingBefore(state),
    sectionAfter: getEffectiveSectionSpacingAfter(state)
  };

  useEffect(() => {
    setSelectedDisplayProfile(state.activeProfile);
  }, [state.activeProfile]);

  useEffect(() => {
    if (active !== 'library') return;
    setLibraryScope(hasActiveSetlist ? 'setlist' : 'all');
    setLibraryQuery('');
  }, [active, hasActiveSetlist, activeSetlistName]);

  function applySelectedProfile() {
    setState(applyDisplayProfilePatch(state, selectedDisplayProfile));
    setProfileMessage(`Applied ${displayProfileLabel(selectedDisplayProfile)} profile`);
  }

  function saveSelectedProfile() {
    setState(saveCurrentSettingsAsDisplayProfilePatch(state, selectedDisplayProfile));
    setProfileMessage(`Saved current settings as ${displayProfileLabel(selectedDisplayProfile)} profile`);
  }

  const isFormatPopover = active === 'format';

  return (
    <aside
      className={`stage-popover fixed ${popoverPosition} top-20 z-50 w-[min(24rem,calc(100vw-1.5rem))] rounded-lg border shadow-2xl backdrop-blur-md ${menuSurface} ${isFormatPopover ? 'stage-format-popover flex flex-col overflow-hidden p-0' : 'p-3'}`}
      data-stage-popover={active}
      onClick={(event) => event.stopPropagation()}
    >
      {active === 'library' && (
        <div className="grid gap-3">
          <div className="flex items-center justify-between gap-3">
            <StagePopoverTitle title={hasActiveSetlist && libraryScope === 'setlist' ? activeSetlistName : 'Library'} />
            {hasActiveSetlist && activeSetlistPosition && (
              <span className="rounded-full border border-white/10 bg-black/30 px-2 py-1 text-[0.7rem] font-semibold text-slate-200">
                Song {activeSetlistPosition}
              </span>
            )}
          </div>
          <div className="relative">
            <button
              className="flex h-11 w-full items-center justify-center gap-2 rounded-md bg-teal-600 px-3 text-sm font-semibold text-white hover:bg-teal-500"
              type="button"
              onClick={() => setNewSongMenuOpen((open) => !open)}
            >
              <Plus size={17} /> New Song
            </button>
            {newSongMenuOpen && (
              <NewSongMenu
                align="left"
                onSelect={(action) => {
                  setNewSongMenuOpen(false);
                  onNewSongAction(action);
                }}
              />
            )}
          </div>
          {hasActiveSetlist && (
            <button
              className="flex w-full items-center gap-2 rounded-md border border-slate-700/70 bg-black/20 px-3 py-2 text-left text-sm font-semibold hover:bg-white/10"
              type="button"
              onClick={() => {
                setLibraryScope((scope) => (scope === 'setlist' ? 'all' : 'setlist'));
                setLibraryQuery('');
              }}
            >
              <ChevronLeft size={17} />
              {libraryScope === 'setlist' ? 'All Songs' : `Back to ${activeSetlistName}`}
            </button>
          )}
          <label className="flex h-11 items-center gap-2 rounded-md border border-slate-700 bg-black/20 px-3">
            <Search size={17} />
            <input
              className="w-full bg-transparent text-sm text-inherit outline-none placeholder:text-slate-400"
              placeholder="Search songs"
              value={libraryQuery}
              onChange={(event) => setLibraryQuery(event.target.value)}
            />
          </label>
          <div className="max-h-[60vh] overflow-auto rounded-md border border-slate-700/70">
            {hasActiveSetlist && libraryScope === 'setlist' && (
              <div className="sticky top-0 z-10 bg-black/60 px-3 py-1 text-[0.65rem] font-semibold uppercase tracking-normal text-amber-200 backdrop-blur">
                {activeSetlistName}
              </div>
            )}
            {favoriteStageSongs.length > 0 && <div className="sticky top-0 z-10 bg-black/60 px-3 py-1 text-[0.65rem] font-semibold uppercase tracking-normal text-amber-200 backdrop-blur">Favorites</div>}
            {favoriteStageSongs.map((stageSong) => (
              <StageLibrarySongButton
                key={stageSong.id}
                song={stageSong}
                currentSongId={currentSongId}
                onSelectStageSong={(songId) => onSelectStageSong(songId, 'library')}
                onToggleFavorite={onToggleFavorite}
              />
            ))}
            {regularStageSongs.length > 0 && (
              <div className="sticky top-0 z-10 bg-black/60 px-3 py-1 text-[0.65rem] font-semibold uppercase tracking-normal text-slate-300 backdrop-blur">
                {hasActiveSetlist && libraryScope === 'setlist' ? 'Active Set' : 'All Songs'}
              </div>
            )}
            {regularStageSongs.map((stageSong) => (
              <StageLibrarySongButton
                key={stageSong.id}
                song={stageSong}
                currentSongId={currentSongId}
                onSelectStageSong={(songId) => onSelectStageSong(songId, hasActiveSetlist && libraryScope === 'setlist' ? 'setlist' : 'library')}
                onToggleFavorite={onToggleFavorite}
                showCurrentMarker={hasActiveSetlist && libraryScope === 'setlist'}
              />
            ))}
            {filteredStageSongs.length === 0 && <div className="p-4 text-center text-sm text-slate-400">No songs found.</div>}
          </div>
          {hasActiveSetlist && libraryScope === 'setlist' && activeSetlistPosition && (
            <div className="rounded-md border border-slate-700/70 bg-black/20 px-3 py-2 text-center text-xs font-semibold text-slate-300">
              {activeSetlistPosition}
            </div>
          )}
        </div>
      )}

      {active === 'setlists' && (
        <div className="grid gap-3">
          <StagePopoverTitle title="Setlists" />
          <div className="max-h-[60vh] overflow-auto rounded-md border border-slate-700/70">
            {savedSetlists.map((setlist) => (
              <button
                key={setlist.id}
                className="grid w-full gap-1 border-b border-slate-700/50 px-3 py-3 text-left text-sm hover:bg-white/10"
                type="button"
                onClick={() => onRunStageSetlist(setlist)}
              >
                <span className="font-semibold">{setlist.name}</span>
                <span className="text-xs opacity-70">{setlist.songIds.length} songs / Modified {formatDate(setlist.updatedAt)}</span>
              </button>
            ))}
            {savedSetlists.length === 0 && <div className="p-4 text-center text-sm text-slate-400">No saved setlists yet.</div>}
          </div>
        </div>
      )}

      {active === 'format' && (
        <div className="stage-format-panel flex min-h-0 flex-1 flex-col">
          <div className="stage-format-header shrink-0 border-b border-slate-700/70 px-3 py-3">
            <StagePopoverTitle title="Format" />
          </div>
          <div className="stage-format-content min-h-0 flex-1 overflow-y-auto px-3 py-3">
            {formatTab === 'document' && (
              <div className="grid gap-3">
                <div className="grid gap-3 rounded-md border border-amber-300/30 bg-amber-300/10 p-3">
                  <div className="flex items-center justify-between gap-2">
                    <StagePopoverTitle title="Display Profile" />
                    <span className="rounded-full border border-amber-200/30 bg-black/20 px-2 py-1 text-[0.7rem] font-semibold text-amber-100">
                      Active Profile: {displayProfileLabel(state.activeProfile)}
                    </span>
                  </div>
                  <label className="grid gap-1 text-sm">
                    <span className="font-semibold text-slate-300">Profile</span>
                    <select
                      className="input bg-slate-900 text-white"
                      value={selectedDisplayProfile}
                      onChange={(event) => setSelectedDisplayProfile(event.target.value as DeviceProfile)}
                    >
                      {displayProfileOptions.map((profile) => (
                        <option key={profile.value} value={profile.value}>{profile.label}</option>
                      ))}
                    </select>
                  </label>
                  <div className="grid gap-2 sm:grid-cols-2">
                    <button
                      className="stage-menu-button"
                      type="button"
                      onClick={applySelectedProfile}
                    >
                      Apply Profile
                    </button>
                    <button
                      className="stage-menu-button"
                      type="button"
                      onClick={saveSelectedProfile}
                    >
                      Save Current Settings as This Profile
                    </button>
                  </div>
                  {profileMessage && <div className="rounded-md border border-teal-300/40 bg-teal-300/10 px-3 py-2 text-sm font-semibold text-teal-100">{profileMessage}</div>}
                  <div className="grid grid-cols-2 gap-2 rounded-md border border-slate-700/70 bg-black/20 p-2 text-[0.72rem] text-slate-200">
                    <div>Active Profile: <span className="font-semibold text-white">{displayProfileLabel(state.activeProfile)}</span></div>
                    <div>Lyric Font Size: <span className="font-semibold text-white">{activeProfileValues.lyric}px</span></div>
                    <div>Chord Font Size: <span className="font-semibold text-white">{activeProfileValues.chord}px</span></div>
                    <div>Title Font Size: <span className="font-semibold text-white">{activeProfileValues.title}px</span></div>
                    <div>Artist Font Size: <span className="font-semibold text-white">{activeProfileValues.artist}px</span></div>
                    <div>Header Font Size: <span className="font-semibold text-white">{activeProfileValues.header}px</span></div>
                    <div>Line Spacing: <span className="font-semibold text-white">{activeProfileValues.lineSpacing.toFixed(2)}</span></div>
                    <div>Section Spacing: <span className="font-semibold text-white">{activeProfileValues.sectionBefore}/{activeProfileValues.sectionAfter}</span></div>
                  </div>
                  <label className="flex items-center justify-between gap-3 rounded-md border border-slate-700/70 bg-black/20 px-3 py-2 text-sm">
                    <span>
                      <span className="block font-semibold text-white">Inline Chords on Phone</span>
                      <span className="block text-xs text-slate-400">Wraps long iPhone chart lines inside the screen.</span>
                    </span>
                    <input
                      type="checkbox"
                      checked={state.inlineChordsOnPhone ?? true}
                      onChange={(event) => setState({ inlineChordsOnPhone: event.target.checked })}
                    />
                  </label>
                </div>
                <div className="grid gap-2">
                  <div className="text-xs font-semibold uppercase tracking-normal text-slate-400">Document Appearance</div>
                  <div className="grid grid-cols-2 gap-2">
                    {documentThemeOptions.map((theme) => (
                      <button
                        key={theme.value}
                        className={`rounded-md border p-2 text-left text-xs transition ${getEffectiveDocumentTheme(state) === theme.value ? 'border-amber-300 ring-1 ring-amber-300/50' : 'border-slate-700 hover:bg-white/10'}`}
                        type="button"
                        onClick={() => setState(documentThemeUpdate(state, theme.value))}
                      >
                        <span className="mb-1 block h-7 rounded border border-black/15" style={{ background: theme.background }} />
                        <span className="block font-semibold">{theme.label}</span>
                        <span className="block opacity-70">{theme.description}</span>
                      </button>
                    ))}
                  </div>
                </div>
                <label className="grid gap-1 text-sm">
                  <span className="text-xs font-semibold uppercase tracking-normal text-slate-400">Font Family</span>
                  <select
                    className="input bg-slate-900 text-white"
                    value={getEffectiveStageFontFamily(state)}
                    onChange={(event) => setState(stageFontFamilyUpdate(state, event.target.value as PerformanceState['stageFontFamily']))}
                  >
                    {stageFontFamilyOptions.map((font) => (
                      <option key={font.value} value={font.value}>{font.label}</option>
                    ))}
                  </select>
                </label>
                <button className="stage-menu-button" type="button" onClick={() => setState(useMonospaceChordsUpdate(state, !getEffectiveUseMonospaceChords(state)))}>
                  Use Monospace Chords {getEffectiveUseMonospaceChords(state) ? 'On' : 'Off'}
                </button>
                <div
                  className="rounded-md border p-3"
                  style={{
                    background: documentTheme.background,
                    color: documentTheme.text,
                    borderColor: documentTheme.muted,
                    fontFamily: stageFontFamily
                  }}
                >
                  <div style={{ color: resolveSectionFontColor(getEffectiveSectionFontColor(state)), fontWeight: getEffectiveSectionBold(state) ? 800 : 500, fontStyle: getEffectiveSectionItalic(state) ? 'italic' : undefined }}>
                    {getEffectiveSectionUppercase(state) ? 'VERSE:' : 'Verse:'}
                  </div>
                  <div className="mt-2 whitespace-pre">
                    <span style={{ color: previewChordColor, fontFamily: chordFontFamily, fontWeight: getEffectiveBoldChords(state) ? 700 : 500 }}>[C]</span>
                    {' Sample lyric line'}
                  </div>
                <div className="whitespace-pre">
                  <span style={{ color: previewChordColor, fontFamily: chordFontFamily, fontWeight: getEffectiveBoldChords(state) ? 700 : 500 }}>[G]</span>
                  {' Another lyric line'}
                </div>
                <div className="relative mt-2 whitespace-pre">
                  {getEffectiveShowHarmonyCues(state) && getEffectiveHarmonyIconVisible(state) && <HarmonyCueIcon color={resolveHarmonyColor(getEffectiveHarmonyIconColor(state))} />}
                  {renderLyricTextWithHarmony('Lead line with [HARMONY]harmony phrase[/HARMONY]', {
                    showHarmonyCues: getEffectiveShowHarmonyCues(state),
                    harmonyStyle: {
                      color: resolveHarmonyColor(getEffectiveHarmonyTextColor(state)),
                      fontStyle: getEffectiveHarmonyItalic(state) ? 'italic' : undefined,
                      textDecorationLine: getEffectiveHarmonyUnderline(state) ? 'underline' : undefined,
                      textDecorationThickness: getEffectiveHarmonyUnderline(state) ? '0.08em' : undefined,
                      textUnderlineOffset: getEffectiveHarmonyUnderline(state) ? '0.16em' : undefined
                    },
                    showHarmonyDebug: Boolean(state.showHarmonyDebug)
                  })}
                </div>
                </div>
                <button className="stage-menu-button" type="button" onClick={() => setState({ minimalStageMode: !state.minimalStageMode })}>
                  Minimal Mode {state.minimalStageMode ? 'On' : 'Off'}
                </button>
                <button className="stage-menu-button" type="button" onClick={() => setState({ showChordAnchorDebug: !state.showChordAnchorDebug })}>
                  Anchor Debug {state.showChordAnchorDebug ? 'On' : 'Off'}
                </button>
              </div>
            )}
            {formatTab === 'format' && (
              <div className="grid gap-3">
                <Stepper label="Lyric Font Size" value={getEffectiveLyricFontSize(state)} min={24} max={76} onChange={(fontSize) => setState(lyricFontSizeUpdate(state, fontSize))} />
                <Stepper label="Header Font Size" value={getEffectiveHeaderFontSize(state)} min={12} max={34} onChange={(fontSize) => setState(headerFontSizeUpdate(state, fontSize))} />
                <div className="grid gap-2 rounded-md border border-slate-700/70 bg-black/20 p-3">
                  <div className="text-xs font-semibold uppercase tracking-normal text-slate-400">Song Title</div>
                  <Stepper label="Title Font Size" value={getEffectiveSongTitleFontSize(state)} min={20} max={96} onChange={(fontSize) => setState(songTitleFontSizeUpdate(state, fontSize))} />
                  <ColorSwatchGroup
                    title="Title Color"
                    options={songDocumentColorOptions}
                    value={getEffectiveSongTitleColor(state)}
                    onChange={(value) => setState(songTitleColorUpdate(state, value))}
                  />
                  <div className="grid grid-cols-2 gap-2">
                    <button className="stage-menu-button" type="button" onClick={() => setState(songTitleBoldUpdate(state, !getEffectiveSongTitleBold(state)))}>
                      Title Bold {getEffectiveSongTitleBold(state) ? 'On' : 'Off'}
                    </button>
                    <button className="stage-menu-button" type="button" onClick={() => setState(songTitleItalicUpdate(state, !getEffectiveSongTitleItalic(state)))}>
                      Title Italic {getEffectiveSongTitleItalic(state) ? 'On' : 'Off'}
                    </button>
                  </div>
                </div>
                <div className="grid gap-2 rounded-md border border-slate-700/70 bg-black/20 p-3">
                  <div className="text-xs font-semibold uppercase tracking-normal text-slate-400">Artist</div>
                  <Stepper label="Artist Font Size" value={getEffectiveSongArtistFontSize(state)} min={14} max={72} onChange={(fontSize) => setState(songArtistFontSizeUpdate(state, fontSize))} />
                  <ColorSwatchGroup
                    title="Artist Color"
                    options={songDocumentColorOptions}
                    value={getEffectiveSongArtistColor(state)}
                    onChange={(value) => setState(songArtistColorUpdate(state, value))}
                  />
                  <div className="grid grid-cols-2 gap-2">
                    <button className="stage-menu-button" type="button" onClick={() => setState(songArtistBoldUpdate(state, !getEffectiveSongArtistBold(state)))}>
                      Artist Bold {getEffectiveSongArtistBold(state) ? 'On' : 'Off'}
                    </button>
                    <button className="stage-menu-button" type="button" onClick={() => setState(songArtistItalicUpdate(state, !getEffectiveSongArtistItalic(state)))}>
                      Artist Italic {getEffectiveSongArtistItalic(state) ? 'On' : 'Off'}
                    </button>
                  </div>
                </div>
                <Stepper label="Chord Font Size" value={chordFontSize} min={10} max={48} onChange={(nextSize) => updateChordFontSize(setState, state, nextSize)} />
                <DecimalStepper label="Line Spacing" value={getEffectiveLineSpacing(state)} min={0.75} max={2} step={0.05} onChange={(spacing) => setState(lineSpacingUpdate(state, spacing))} />
              </div>
            )}
            {formatTab === 'chords' && (
              <div className="grid gap-3">
                <Stepper label="Transpose" value={state.transpose} min={-11} max={11} onChange={(transpose) => setState({ transpose })} />
                <Stepper label="Capo" value={effectiveCapo} min={0} max={12} onChange={onChangeSongCapo} />
                <button className="stage-menu-button" type="button" onClick={() => setState({ showNashvilleNumbers: !state.showNashvilleNumbers })}>
                  Nashville Numbers {state.showNashvilleNumbers ? 'On' : 'Off'}
                </button>
                <button className="stage-menu-button" type="button" onClick={() => setState(showChordsUpdate(state, !getEffectiveShowChords(state)))}>
                  Show Chords {getEffectiveShowChords(state) ? 'On' : 'Off'}
                </button>
                <button className="stage-menu-button" type="button" onClick={onToggleDisplayPreference}>
                  Mode: {displayPreference === 'chords-over' ? 'Chords Over Lyrics' : 'Inline Chords'}
                </button>
                <ColorSwatchGroup
                  title="Chord Highlight"
                  options={chordHighlightOptions}
                  value={getEffectiveChordHighlightColor(state)}
                  onChange={(value) => setState(chordHighlightColorUpdate(state, value))}
                />
                <ColorSwatchGroup
                  title="Chord Font Color"
                  options={chordFontColorOptions}
                  value={getEffectiveChordFontColor(state)}
                  onChange={(value) => setState(chordFontColorUpdate(state, value))}
                />
                <button className="stage-menu-button" type="button" onClick={() => setState(boldChordsUpdate(state, !getEffectiveBoldChords(state)))}>
                  Chord Bold {getEffectiveBoldChords(state) ? 'On' : 'Off'}
                </button>
                <button className="stage-menu-button" type="button" onClick={() => setState(italicChordsUpdate(state, !getEffectiveItalicChords(state)))}>
                  Chord Italic {getEffectiveItalicChords(state) ? 'On' : 'Off'}
                </button>
              </div>
            )}
            {formatTab === 'harmony' && (
              <div className="grid gap-3">
                <button className="stage-menu-button" type="button" onClick={() => setState(showHarmonyCuesUpdate(state, !getEffectiveShowHarmonyCues(state)))}>
                  Show Harmony Cues {getEffectiveShowHarmonyCues(state) ? 'On' : 'Off'}
                </button>
                <ColorSwatchGroup
                  title="Harmony Text Color"
                  options={harmonyColorOptions}
                  value={getEffectiveHarmonyTextColor(state)}
                  onChange={(value) => setState(harmonyTextColorUpdate(state, value))}
                />
                <ColorSwatchGroup
                  title="Harmony Icon Color"
                  options={harmonyColorOptions}
                  value={getEffectiveHarmonyIconColor(state)}
                  onChange={(value) => setState(harmonyIconColorUpdate(state, value))}
                />
                <button className="stage-menu-button" type="button" onClick={() => setState(harmonyItalicUpdate(state, !getEffectiveHarmonyItalic(state)))}>
                  Harmony Italic {getEffectiveHarmonyItalic(state) ? 'On' : 'Off'}
                </button>
                <button className="stage-menu-button" type="button" onClick={() => setState(harmonyUnderlineUpdate(state, !getEffectiveHarmonyUnderline(state)))}>
                  Harmony Underline {getEffectiveHarmonyUnderline(state) ? 'On' : 'Off'}
                </button>
                <button className="stage-menu-button" type="button" onClick={() => setState(harmonyIconVisibleUpdate(state, !getEffectiveHarmonyIconVisible(state)))}>
                  Harmony Icon {getEffectiveHarmonyIconVisible(state) ? 'On' : 'Off'}
                </button>
                <button className="stage-menu-button" type="button" onClick={() => setState({ showHarmonyDebug: !state.showHarmonyDebug })}>
                  Harmony Debug {state.showHarmonyDebug ? 'On' : 'Off'}
                </button>
              </div>
            )}
            {formatTab === 'sections' && (
              <div className="grid gap-3">
                <Stepper label="Section Font Size" value={getEffectiveSectionFontSize(state)} min={14} max={64} onChange={(size) => setState(sectionFontSizeUpdate(state, size))} />
                <ColorSwatchGroup
                  title="Section Font Color"
                  options={sectionFontColorOptions}
                  value={getEffectiveSectionFontColor(state)}
                  onChange={(value) => setState(sectionFontColorUpdate(state, value))}
                />
                <button className="stage-menu-button" type="button" onClick={() => setState(sectionBoldUpdate(state, !getEffectiveSectionBold(state)))}>
                  Section Bold {getEffectiveSectionBold(state) ? 'On' : 'Off'}
                </button>
                <button className="stage-menu-button" type="button" onClick={() => setState(sectionItalicUpdate(state, !getEffectiveSectionItalic(state)))}>
                  Section Italic {getEffectiveSectionItalic(state) ? 'On' : 'Off'}
                </button>
                <button className="stage-menu-button" type="button" onClick={() => setState(sectionUppercaseUpdate(state, !getEffectiveSectionUppercase(state)))}>
                  Section Uppercase {getEffectiveSectionUppercase(state) ? 'On' : 'Off'}
                </button>
                <Stepper label="Spacing Before" value={getEffectiveSectionSpacingBefore(state)} min={0} max={96} onChange={(spacing) => setState(sectionSpacingBeforeUpdate(state, spacing))} />
                <Stepper label="Spacing After" value={getEffectiveSectionSpacingAfter(state)} min={0} max={64} onChange={(spacing) => setState(sectionSpacingAfterUpdate(state, spacing))} />
              </div>
            )}
            {formatTab === 'display' && (
              <div className="grid gap-3">
                <div className="grid grid-cols-2 gap-2">
                  {stageThemes.map((theme) => (
                    <button
                      key={theme.name}
                      className={`stage-menu-button ${state.stageTheme === theme.name ? 'border-amber-300 text-amber-100' : ''}`}
                      onClick={() => setState(stageThemePresetPatch(state, theme.name))}
                      type="button"
                    >
                      {theme.label}
                    </button>
                  ))}
                </div>
                <button className="stage-menu-button" type="button" onClick={() => setState({ portraitMode: !state.portraitMode })}>
                  Portrait {state.portraitMode ? 'On' : 'Off'}
                </button>
                <button className="stage-menu-button" type="button" onClick={() => setState({ mirroredMode: !state.mirroredMode })}>
                  Mirror {state.mirroredMode ? 'On' : 'Off'}
                </button>
                <button className="stage-menu-button" type="button" onClick={onStageMode}>
                  <Expand size={18} /> Fullscreen
                </button>
              </div>
            )}
            {formatTab === 'autoscroll' && (
              <div className="grid gap-3">
                <button className="stage-menu-button" type="button" onClick={onToggleAutoscroll}>
                  {isAutoscrolling ? <Pause size={18} /> : <Play size={18} />}
                  {isAutoscrolling ? 'Pause Autoscroll' : 'Start Autoscroll'}
                </button>
                <button className="stage-menu-button" type="button" onClick={onCalculateDuration}>
                  <Gauge size={18} /> BPM Estimate
                </button>
                <label className="grid gap-1 text-sm">
                  <span>Scroll Speed: {normalizeAutoscrollSpeedMultiplier(state.autoscrollSpeed).toFixed(2)}x</span>
                  <input type="range" min={0.25} max={3} step={0.05} value={normalizeAutoscrollSpeedMultiplier(state.autoscrollSpeed)} onChange={(event) => setAutoscrollSpeed(Number(event.target.value))} />
                </label>
                <button className="stage-menu-button" type="button" onClick={() => setState({ showReadingGuide: !state.showReadingGuide })}>
                  Reading Guide {state.showReadingGuide ? 'On' : 'Off'}
                </button>
                <div className="flex flex-wrap gap-2 text-xs">
                  {(['slow', 'medium', 'fast'] as const).map((preset) => (
                    <button
                      key={preset}
                      className={`rounded-md border px-3 py-2 ${state.autoscrollPreset === preset ? 'border-teal-400 bg-teal-700 text-white' : 'border-slate-600'}`}
                      onClick={() => setPreset(preset)}
                      type="button"
                    >
                      {preset}
                    </button>
                  ))}
                </div>
              </div>
            )}
            {formatTab === 'external' && (
              <ExternalDisplayControls
                state={{ ...state, externalDisplay: externalDisplaySettings }}
                setState={setState}
                onSendReceiver={onSendReceiver}
                onSendReceiverTestPattern={onSendReceiverTestPattern}
                onOpenDisplayManager={onDisplays}
              />
            )}
          </div>
          <div className="stage-format-tabbar grid shrink-0 grid-cols-4 gap-1 border-t border-slate-700 px-3 pb-[max(0.5rem,env(safe-area-inset-bottom))] pt-2 sm:grid-cols-8">
            <StageTabButton icon={<FileJson size={16} />} label="Document" active={formatTab === 'document'} onClick={() => setFormatTab('document')} />
            <StageTabButton icon={<Settings size={16} />} label="Format" active={formatTab === 'format'} onClick={() => setFormatTab('format')} />
            <StageTabButton icon={<ListMusic size={16} />} label="Chords" active={formatTab === 'chords'} onClick={() => setFormatTab('chords')} />
            <StageTabButton icon={<Music2 size={16} />} label="Harmony" active={formatTab === 'harmony'} onClick={() => setFormatTab('harmony')} />
            <StageTabButton icon={<Sparkles size={16} />} label="Sections" active={formatTab === 'sections'} onClick={() => setFormatTab('sections')} />
            <StageTabButton icon={<Sun size={16} />} label="Display" active={formatTab === 'display'} onClick={() => setFormatTab('display')} />
            <StageTabButton icon={<Gauge size={16} />} label="Scroll" active={formatTab === 'autoscroll'} onClick={() => setFormatTab('autoscroll')} />
            <StageTabButton icon={<Monitor size={16} />} label="External" active={formatTab === 'external'} onClick={() => setFormatTab('external')} />
          </div>
        </div>
      )}

      {active === 'more' && (
        <div className="grid gap-3">
          <StagePopoverTitle title="More" />
          {currentStageSong && (
            <>
              <button className="stage-menu-button" type="button" onClick={() => onToggleFavorite(currentStageSong.id)}>
                <Star size={18} fill={currentStageSong.favorite ? 'currentColor' : 'none'} />
                {currentStageSong.favorite ? 'Remove Favorite' : 'Add Favorite'}
              </button>
              <button className="stage-menu-button" type="button" onClick={onPublishSong} disabled={publishingSong}>
                <Share2 size={18} /> {publishingSong ? 'Sharing song...' : 'Share Song'}
              </button>
            </>
          )}
          <button className="stage-menu-button stage-phone-only" type="button" onClick={onEdit}>
            <Pencil size={18} /> Edit Song
          </button>
          <button className="stage-menu-button stage-phone-only" type="button" onClick={onOpenExternalDisplay}>
            <Monitor size={18} /> External Display
          </button>
          <button className="stage-menu-button" type="button" onClick={onSettings}>
            <Settings size={18} /> Settings
          </button>
          <button className="stage-menu-button" type="button" onClick={onDiagnostics}>
            <Gauge size={18} /> Diagnostics
          </button>
          <button className="stage-menu-button" type="button" onClick={onPedals}>
            <Settings size={18} /> Pedals
          </button>
          <button className="stage-menu-button" type="button" onClick={onImportExport}>
            <Upload size={18} /> Import / Export
          </button>
          <button className="stage-menu-button" type="button" onClick={onSync}>
            <LogIn size={18} /> Sync
          </button>
        </div>
      )}
    </aside>
  );
}

function StageLibrarySongButton({
  song,
  currentSongId,
  onSelectStageSong,
  onToggleFavorite,
  showCurrentMarker = false
}: {
  song: Song;
  currentSongId: string;
  onSelectStageSong: (songId: string) => void;
  onToggleFavorite: (songId: string) => void;
  showCurrentMarker?: boolean;
}) {
  const selected = song.id === currentSongId;
  return (
    <button
      className={`grid w-full grid-cols-[1fr_auto] items-center gap-3 border-b border-slate-700/50 px-3 py-3 text-left text-sm hover:bg-white/10 ${selected ? 'bg-amber-300/10 text-amber-100' : ''}`}
      type="button"
      onClick={() => onSelectStageSong(song.id)}
    >
      <span className="flex min-w-0 items-center gap-2">
        <span
          className={`inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${song.favorite ? 'text-amber-300' : 'text-slate-400 hover:text-amber-300'}`}
          title={song.favorite ? 'Remove favorite' : 'Add favorite'}
          onClick={(event) => {
            event.preventDefault();
            event.stopPropagation();
            onToggleFavorite(song.id);
          }}
        >
          <Star size={17} fill={song.favorite ? 'currentColor' : 'none'} />
        </span>
        <span className="min-w-0">
          <span className="block truncate font-semibold">{selected && showCurrentMarker ? `▶ ${song.title}` : song.title}</span>
          <span className="block truncate text-xs opacity-70">{song.artist || 'Unknown artist'}</span>
        </span>
      </span>
      <span className="text-right text-xs opacity-80">
        <span className="block">Key {song.key || '-'}</span>
        <span className="block">{song.bpm || '-'} BPM</span>
      </span>
    </button>
  );
}

function StagePopoverTitle({ title }: { title: string }) {
  return <div className="text-xs font-semibold uppercase tracking-normal text-slate-400">{title}</div>;
}

function isInteractiveSwipeTarget(target: EventTarget | null) {
  return target instanceof HTMLElement && Boolean(target.closest('button, input, textarea, select, option, label, [role="button"], [data-stage-control]'));
}

function keepStageSelectionButtonPress(event: React.PointerEvent<HTMLButtonElement>) {
  event.preventDefault();
  event.stopPropagation();
}

function shouldUseBottomHarmonyActionBar() {
  if (typeof window === 'undefined' || typeof navigator === 'undefined') return false;
  const ua = navigator.userAgent || '';
  const isiOS = /iPad|iPhone|iPod/i.test(ua) || (/Macintosh/i.test(ua) && navigator.maxTouchPoints > 1);
  const coarseTouch = window.matchMedia?.('(pointer: coarse)').matches ?? false;
  const mobileWidth = window.matchMedia?.('(max-width: 900px)').matches ?? false;
  return isiOS || (coarseTouch && mobileWidth);
}

function hasActiveStageLyricSelection(stageElement: HTMLElement | null) {
  const selection = window.getSelection();
  if (!selection || selection.isCollapsed || !stageElement) return false;
  return stageElement.contains(selection.anchorNode) && stageElement.contains(selection.focusNode);
}

function updateStageSelectionFromBrowser(
  stageElement: HTMLElement | null,
  song: Song,
  setSelectionAction: React.Dispatch<React.SetStateAction<StageSelectionAction | null>>,
  options: { preserveExisting?: boolean } = {}
) {
  const selection = window.getSelection();
  if (!selection || selection.isCollapsed || !stageElement || !stageElement.contains(selection.anchorNode) || !stageElement.contains(selection.focusNode)) {
    setSelectionAction((current) => options.preserveExisting && current ? current : null);
    return;
  }

  const range = selection.rangeCount > 0 ? selection.getRangeAt(0) : null;
  const selectedText = selection.toString();
  if (!range || !selectedText.trim()) {
    setSelectionAction((current) => options.preserveExisting && current ? current : null);
    return;
  }

  const start = sourcePointFromSelectionBoundary(range.startContainer, range.startOffset);
  const end = sourcePointFromSelectionBoundary(range.endContainer, range.endOffset);
  if (start === null || end === null) {
    setSelectionAction((current) => options.preserveExisting && current ? current : null);
    return;
  }

  const sourceStart = Math.min(start, end);
  const sourceEnd = Math.max(start, end);
  if (sourceStart === sourceEnd) {
    setSelectionAction((current) => options.preserveExisting && current ? current : null);
    return;
  }

  const rect = range.getBoundingClientRect();
  setSelectionAction({
    start: sourceStart,
    end: sourceEnd,
    selectedText,
    songId: song.id,
    rect: {
      left: rect.left,
      top: rect.top,
      width: rect.width,
      height: rect.height
    },
    hasHarmony: isRangeInsideHarmonyMarkup(song.chart, sourceStart, sourceEnd)
  });
}

function sourcePointFromSelectionBoundary(node: Node, offset: number) {
  if (node.nodeType === Node.TEXT_NODE) {
    const element = node.parentElement?.closest<HTMLElement>('[data-stage-lyric="true"][data-source-start][data-source-end]');
    if (!element) return null;
    const sourceStart = Number(element.dataset.sourceStart);
    const sourceEnd = Number(element.dataset.sourceEnd);
    if (!Number.isFinite(sourceStart) || !Number.isFinite(sourceEnd)) return null;
    return Math.max(sourceStart, Math.min(sourceEnd, sourceStart + offset));
  }

  if (node instanceof HTMLElement) {
    const child = node.childNodes[Math.max(0, Math.min(offset, node.childNodes.length - 1))];
    const element = (child instanceof HTMLElement ? child : child?.parentElement)?.closest<HTMLElement>('[data-stage-lyric="true"][data-source-start][data-source-end]');
    if (!element) return null;
    const sourceStart = Number(element.dataset.sourceStart);
    const sourceEnd = Number(element.dataset.sourceEnd);
    if (!Number.isFinite(sourceStart) || !Number.isFinite(sourceEnd)) return null;
    return offset >= node.childNodes.length ? sourceEnd : sourceStart;
  }

  return null;
}

function isIPhoneViewport() {
  if (typeof window === 'undefined') return false;
  const ua = navigator.userAgent || '';
  const isIPhoneUa = /iPhone|iPod/i.test(ua);
  const isNarrowTouchScreen = window.matchMedia('(max-width: 600px) and (pointer: coarse)').matches;
  return isIPhoneUa || isNarrowTouchScreen;
}

function displayProfileLabel(profile: DeviceProfile) {
  return displayProfileOptions.find((option) => option.value === profile)?.label ?? profile;
}

function profileSettingsPatch(
  state: PerformanceState,
  profile: DeviceProfile,
  values: DisplayProfileSizing
): Partial<PerformanceState> {
  return {
    activeProfile: profile,
    fontSize: values.lyricFontSize,
    fontSizesByProfile: { ...(state.fontSizesByProfile ?? {}), [profile]: values.lyricFontSize },
    chordFontSize: values.chordFontSize,
    chordFontSizesByProfile: { ...(state.chordFontSizesByProfile ?? {}), [profile]: values.chordFontSize },
    songTitleFontSize: values.titleFontSize,
    songTitleFontSizesByProfile: { ...(state.songTitleFontSizesByProfile ?? {}), [profile]: values.titleFontSize },
    songArtistFontSize: values.artistFontSize,
    songArtistFontSizesByProfile: { ...(state.songArtistFontSizesByProfile ?? {}), [profile]: values.artistFontSize },
    sectionFontSize: values.sectionFontSize,
    sectionFontSizesByProfile: { ...(state.sectionFontSizesByProfile ?? {}), [profile]: values.sectionFontSize },
    headerFontSize: values.headerFontSize,
    headerFontSizesByProfile: { ...(state.headerFontSizesByProfile ?? {}), [profile]: values.headerFontSize },
    lineSpacing: values.lineSpacing,
    lineSpacingsByProfile: { ...(state.lineSpacingsByProfile ?? {}), [profile]: values.lineSpacing },
    sectionSpacingBefore: values.sectionSpacingBefore,
    sectionSpacingBeforeByProfile: { ...(state.sectionSpacingBeforeByProfile ?? {}), [profile]: values.sectionSpacingBefore },
    sectionSpacingAfter: values.sectionSpacingAfter,
    sectionSpacingAfterByProfile: { ...(state.sectionSpacingAfterByProfile ?? {}), [profile]: values.sectionSpacingAfter },
    splitScreen: profile === 'ipad-landscape' ? state.splitScreen : false
  };
}

function applyDisplayProfilePatch(state: PerformanceState, profile: DeviceProfile): Partial<PerformanceState> {
  return profileSettingsPatch(state, profile, displayProfileDefaults[profile]);
}

function saveCurrentSettingsAsDisplayProfilePatch(state: PerformanceState, profile: DeviceProfile): Partial<PerformanceState> {
  return profileSettingsPatch(state, profile, {
    lyricFontSize: getEffectiveLyricFontSize(state),
    chordFontSize: getEffectiveChordFontSize(state),
    titleFontSize: getEffectiveSongTitleFontSize(state),
    artistFontSize: getEffectiveSongArtistFontSize(state),
    sectionFontSize: getEffectiveSectionFontSize(state),
    headerFontSize: getEffectiveHeaderFontSize(state),
    lineSpacing: getEffectiveLineSpacing(state),
    sectionSpacingBefore: getEffectiveSectionSpacingBefore(state),
    sectionSpacingAfter: getEffectiveSectionSpacingAfter(state)
  });
}

function StageTabButton({
  icon,
  label,
  active,
  onClick
}: {
  icon: React.ReactNode;
  label: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      className={`grid min-h-14 place-items-center rounded-md border px-1 py-2 text-[0.65rem] font-semibold transition ${active ? 'border-amber-300 bg-amber-300/15 text-amber-100' : 'border-slate-700 bg-white/5 text-slate-300 hover:bg-white/10'}`}
      type="button"
      onClick={onClick}
      title={label}
    >
      {icon}
      <span className="mt-1 truncate">{label}</span>
    </button>
  );
}

function ColorSwatchGroup({
  title,
  options,
  value,
  onChange
}: {
  title: string;
  options: Array<{ value: string; label: string; color: string }>;
  value: string;
  onChange: (value: string) => void;
}) {
  const isCustom = value.startsWith('#');
  return (
    <div className="grid gap-2">
      <div className="text-xs font-semibold uppercase tracking-normal text-slate-400">{title}</div>
      <div className="flex flex-wrap gap-2">
        {options.map((option) => (
          <button
            key={option.value}
            className={`h-8 w-8 rounded-full border ${value === option.value ? 'ring-2 ring-amber-300' : ''}`}
            type="button"
            title={option.label}
            aria-label={option.label}
            style={{ background: option.color === 'transparent' ? 'transparent' : option.color }}
            onClick={() => onChange(option.value)}
          />
        ))}
        <label className={`h-8 w-8 cursor-pointer rounded-full border bg-gradient-to-br from-white via-fuchsia-300 to-sky-400 ${isCustom ? 'ring-2 ring-amber-300' : ''}`} title="Custom color">
          <input className="sr-only" type="color" value={isCustom ? value : '#d9ad65'} onChange={(event) => onChange(event.target.value)} />
        </label>
      </div>
    </div>
  );
}

function ExternalPrompterApp() {
  const [payload, setPayload] = useState<ExternalDisplayPayload | null>(() => loadExternalDisplayPayload());
  const [viewport, setViewport] = useState(() => ({
    width: typeof window === 'undefined' ? 1280 : window.innerWidth,
    height: typeof window === 'undefined' ? 720 : window.innerHeight
  }));

  useEffect(() => {
    const handleStorage = (event: StorageEvent) => {
      if (event.key === 'openstage-external-display-payload') setPayload(loadExternalDisplayPayload());
    };
    window.addEventListener('storage', handleStorage);

    let channel: BroadcastChannel | null = null;
    try {
      channel = new BroadcastChannel('openstage-external-display');
      channel.onmessage = (event) => setPayload(event.data as ExternalDisplayPayload);
    } catch {
      channel = null;
    }

    const timer = window.setInterval(() => setPayload(loadExternalDisplayPayload()), 1000);
    const handleResize = () => setViewport({ width: window.innerWidth, height: window.innerHeight });
    window.addEventListener('resize', handleResize);
    return () => {
      window.removeEventListener('storage', handleStorage);
      window.removeEventListener('resize', handleResize);
      channel?.close();
      window.clearInterval(timer);
    };
  }, []);

  if (!payload) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-black p-6 text-center text-amber-100">
        <div>
          <h1 className="text-3xl font-semibold">OpenStage External Display</h1>
          <p className="mt-3 text-slate-300">Waiting for the iPad control surface to send a Stage chart.</p>
        </div>
      </main>
    );
  }

  const settings = getExternalDisplaySettings(payload.performance);
  const lyricFontSize = getEffectiveLyricFontSize(payload.performance);
  const lineSpacing = getEffectiveLineSpacing(payload.performance);
  const chordFontSize = getEffectiveChordFontSize(payload.performance);
  const documentTheme = getDocumentThemePreset(getEffectiveDocumentTheme(payload.performance));
  const stageFontFamily = resolveStageFontFamily(getEffectiveStageFontFamily(payload.performance));
  const chordFontFamily = getEffectiveUseMonospaceChords(payload.performance) ? 'Consolas, "Courier New", monospace' : stageFontFamily;
  const songTitleStyle = buildSongDocumentTextStyle({
    size: getEffectiveSongTitleFontSize(payload.performance),
    color: getEffectiveSongTitleColor(payload.performance),
    bold: getEffectiveSongTitleBold(payload.performance),
    italic: getEffectiveSongTitleItalic(payload.performance),
    documentTheme,
    fallbackColor: documentTheme.text
  });
  const songArtistStyle = buildSongDocumentTextStyle({
    size: getEffectiveSongArtistFontSize(payload.performance),
    color: getEffectiveSongArtistColor(payload.performance),
    bold: getEffectiveSongArtistBold(payload.performance),
    italic: getEffectiveSongArtistItalic(payload.performance),
    documentTheme,
    fallbackColor: documentTheme.muted
  });
  const chordVerticalOffset = getEffectiveChordVerticalOffset(payload.performance);
  const chordFontColor = getEffectiveChordFontColor(payload.performance);
  const chordHighlightColor = getEffectiveChordHighlightColor(payload.performance);
  const boldChords = getEffectiveBoldChords(payload.performance);
  const italicChords = getEffectiveItalicChords(payload.performance);
  const showChords = getEffectiveShowChords(payload.performance);
  const sectionFontSize = getEffectiveSectionFontSize(payload.performance);
  const sectionFontColor = getEffectiveSectionFontColor(payload.performance);
  const sectionBold = getEffectiveSectionBold(payload.performance);
  const sectionItalic = getEffectiveSectionItalic(payload.performance);
  const sectionUppercase = getEffectiveSectionUppercase(payload.performance);
  const sectionSpacingBefore = getEffectiveSectionSpacingBefore(payload.performance);
  const sectionSpacingAfter = getEffectiveSectionSpacingAfter(payload.performance);
  const showHarmonyCues = getEffectiveShowHarmonyCues(payload.performance);
  const harmonyTextColor = getEffectiveHarmonyTextColor(payload.performance);
  const harmonyIconColor = getEffectiveHarmonyIconColor(payload.performance);
  const harmonyItalic = getEffectiveHarmonyItalic(payload.performance);
  const harmonyUnderline = getEffectiveHarmonyUnderline(payload.performance);
  const harmonyIconVisible = getEffectiveHarmonyIconVisible(payload.performance);
  const rendered = renderSong(payload.song, {
    transpose: payload.performance.transpose,
    capo: payload.effectiveCapo,
    showNashvilleNumbers: payload.performance.showNashvilleNumbers,
    songKey: payload.song.performanceKey || payload.song.key,
    activeProfile: payload.performance.activeProfile,
    lyricFontSize,
    lineSpacing,
    chordFontSize,
    headerFontSize: getEffectiveHeaderFontSize(payload.performance),
    songTitleFontSize: getEffectiveSongTitleFontSize(payload.performance),
    songArtistFontSize: getEffectiveSongArtistFontSize(payload.performance),
    sectionFontSize: getEffectiveSectionFontSize(payload.performance),
    sectionSpacingBefore: getEffectiveSectionSpacingBefore(payload.performance),
    sectionSpacingAfter: getEffectiveSectionSpacingAfter(payload.performance),
    viewportWidth: window.innerWidth,
    displayMode: getDisplayModeLabel(payload.performance)
  });
  const layout = calculateExternalPrompterLayout(settings, viewport.width, viewport.height);

  return (
    <main
      className={`${getStageTheme(payload.performance.stageTheme).className} relative h-screen w-screen overflow-hidden`}
      style={{ background: documentTheme.background, color: documentTheme.text, fontFamily: stageFontFamily }}
    >
      {settings.showCalibration && <ExternalCalibrationOverlay settings={settings} layout={layout} />}
      <div className="external-prompter-viewport absolute inset-0 flex items-center justify-center overflow-hidden">
        <div
          className="absolute left-1/2 top-1/2 flex items-center justify-center"
          style={{
            transform: layout.offsetTransform,
            transformOrigin: 'center center'
          }}
        >
          <div
            className="external-prompter-output flex items-center justify-center"
            style={{
              width: `${layout.contentWidth}px`,
              height: `${layout.contentHeight}px`,
              padding: `${settings.safeMargin}vmin`,
              boxSizing: 'border-box',
              transform: layout.contentTransform,
              transformOrigin: 'center center'
            }}
          >
            {settings.fillScreenTest ? (
              <ExternalFillScreenTest settings={settings} layout={layout} />
            ) : (
              <article
                className="stage-chart font-chart whitespace-pre-wrap"
                style={{
                  fontSize: `${lyricFontSize}px`,
                  lineHeight: 1.52,
                  color: documentTheme.text,
                  fontFamily: stageFontFamily,
                  width: '100%',
                  maxWidth: '100%',
                  maxHeight: '100%',
                  overflow: 'hidden'
                }}
              >
                {rendered.lines.map((line, index) => (
                  <ChordProDisplayLine
                    key={`${line.raw}-${index}`}
                    line={line}
                    transpose={payload.performance.transpose}
                    showNashville={payload.performance.showNashvilleNumbers}
                    songKey={payload.song.performanceKey || payload.song.key}
                    boldChords={boldChords}
                    italicChords={italicChords}
                    showChords={showChords}
                    chordFontColor={chordFontColor}
                    chordHighlightColor={chordHighlightColor}
                    sectionFontSize={sectionFontSize}
                    sectionFontColor={sectionFontColor}
                    sectionBold={sectionBold}
                    sectionItalic={sectionItalic}
                    sectionUppercase={sectionUppercase}
                    sectionSpacingBefore={sectionSpacingBefore}
                    sectionSpacingAfter={sectionSpacingAfter}
                    songTitleStyle={songTitleStyle}
                    songArtistStyle={songArtistStyle}
                    showHarmonyCues={showHarmonyCues}
                    harmonyTextColor={harmonyTextColor}
                    harmonyIconColor={harmonyIconColor}
                    harmonyItalic={harmonyItalic}
                    harmonyUnderline={harmonyUnderline}
                    harmonyIconVisible={harmonyIconVisible}
                    displayPreference={payload.song.displayPreference ?? 'inline'}
                    lineIndex={index}
                    chordFontSize={chordFontSize}
                    chordFontFamily={chordFontFamily}
                    lyricFontSize={lyricFontSize}
                    lineSpacing={lineSpacing}
                    chordVerticalOffset={chordVerticalOffset}
                    mobileReflowMode={viewport.width < 600}
                    showAnchorDebug={Boolean(payload.performance.showChordAnchorDebug)}
                    showHarmonyDebug={Boolean(payload.performance.showHarmonyDebug)}
                  />
                ))}
              </article>
            )}
          </div>
        </div>
      </div>
    </main>
  );
}

function ExternalCalibrationOverlay({
  settings,
  layout
}: {
  settings: PerformanceState['externalDisplay'];
  layout: ReturnType<typeof calculateExternalPrompterLayout>;
}) {
  return (
    <div className="pointer-events-none absolute inset-0 z-20 text-amber-200">
      <div
        className="absolute border border-amber-300/80"
        style={{
          inset: `${settings.safeMargin}%`
        }}
      />
      <div className="absolute inset-x-0 top-1/2 border-t border-amber-300/70" />
      <div className="absolute inset-y-0 left-1/2 border-l border-amber-300/70" />
      <div className="absolute left-2 top-2 h-12 w-12 border-l-4 border-t-4 border-amber-300"><span className="absolute left-2 top-2 text-xs font-bold">TL</span></div>
      <div className="absolute right-2 top-2 h-12 w-12 border-r-4 border-t-4 border-amber-300"><span className="absolute right-2 top-2 text-xs font-bold">TR</span></div>
      <div className="absolute bottom-2 left-2 h-12 w-12 border-b-4 border-l-4 border-amber-300"><span className="absolute bottom-2 left-2 text-xs font-bold">BL</span></div>
      <div className="absolute bottom-2 right-2 h-12 w-12 border-b-4 border-r-4 border-amber-300"><span className="absolute bottom-2 right-2 text-xs font-bold">BR</span></div>
      <div className="absolute left-1/2 top-4 max-w-[92vw] -translate-x-1/2 rounded bg-black/75 px-3 py-2 text-center text-sm leading-snug">
        <div>{settings.profileName} / {settings.rotation} / {settings.scaleMode}</div>
        <div>zoom {Math.round(layout.scale * 100)}% / safe {settings.safeMargin}% / offset {settings.offsetX.toFixed(1)}vw, {settings.offsetY.toFixed(1)}vh</div>
      </div>
    </div>
  );
}

function ExternalFillScreenTest({
  settings,
  layout
}: {
  settings: PerformanceState['externalDisplay'];
  layout: ReturnType<typeof calculateExternalPrompterLayout>;
}) {
  return (
    <div className="grid h-full w-full place-items-center bg-black text-amber-100">
      <div className="grid h-full w-full place-items-center border-[1.5vmin] border-amber-300 bg-gradient-to-br from-slate-950 via-slate-900 to-black p-[4vmin]">
        <div className="grid h-full w-full place-items-center border border-amber-200/70 text-center">
          <div className="rounded bg-black/60 px-5 py-4 text-[4vmin] font-bold leading-tight">
            <div>FILL SCREEN TEST</div>
            <div className="text-[0.48em] font-semibold text-amber-200">
              {settings.rotation} / {settings.scaleMode} / {Math.round(layout.scale * 100)}%
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function buildSongDocumentTextStyle({
  size,
  color,
  bold,
  italic,
  documentTheme,
  fallbackColor
}: {
  size: number;
  color: string;
  bold: boolean;
  italic: boolean;
  documentTheme: { text: string; muted: string };
  fallbackColor: string;
}): React.CSSProperties {
  return {
    fontSize: `${size}px`,
    color: resolveSongDocumentColor(color, documentTheme, fallbackColor),
    fontWeight: bold ? 800 : 500,
    fontStyle: italic ? 'italic' : undefined
  };
}

function resolveSongDocumentColor(value: string, documentTheme: { text: string; muted: string }, fallbackColor: string) {
  if (value === 'document') return documentTheme.text;
  if (value === 'muted') return documentTheme.muted;
  return resolveSectionFontColor(value) || fallbackColor;
}

function AutoscrollDebugPanel({ debug }: { debug: AutoscrollDebugInfo }) {
  return (
    <div className="fixed bottom-3 right-3 z-[65] max-w-xs rounded-md border border-amber-300 bg-slate-950/95 p-3 text-xs text-amber-50 shadow-xl">
      <div className="mb-2 font-semibold text-amber-200">Autoscroll Debug</div>
      <div>running: {debug.isRunning ? 'yes' : 'no'}</div>
      <div>raf id: {debug.activeRafId ?? 'none'}</div>
      <div>target: {debug.targetType}</div>
      <div>scrollTop: {debug.currentScrollTop.toFixed(2)}</div>
      <div>previous: {debug.previousScrollTop.toFixed(2)}</div>
      <div>viewport height: {debug.viewportHeight}</div>
      <div>scrollHeight: {debug.scrollHeight}</div>
      <div>clientHeight: {debug.clientHeight}</div>
      <div>maxScroll: {debug.maxScroll.toFixed(2)}</div>
      <div>scrollable distance: {debug.maxScroll.toFixed(2)}</div>
      <div>mode: {debug.durationSource}</div>
      <div>speed source: {debug.speedSource}</div>
      <div>display: {debug.displayMode}</div>
      <div>device profile: {debug.deviceProfile}</div>
      <div>orientation: {debug.orientation}</div>
      <div>BPM: {debug.bpm ?? '-'}</div>
      <div>beats: {debug.estimatedBeats?.toFixed(1) ?? '-'}</div>
      <div>estimated: {debug.estimatedDurationSeconds ? formatDuration(debug.estimatedDurationSeconds) : '-'}</div>
      <div>pace: {debug.readingPaceMultiplier.toFixed(2)}</div>
      <div>duration: {debug.durationSeconds ?? '-'}</div>
      <div>selected duration: {debug.selectedDurationSeconds ? formatDuration(debug.selectedDurationSeconds) : '-'}</div>
      <div>base px/sec: {debug.basePixelsPerSecond.toFixed(2)}</div>
      <div>multiplier: {debug.scrollSpeedMultiplier.toFixed(2)}x</div>
      <div>portrait factor: {debug.portraitSpeedFactor.toFixed(2)}x</div>
      <div>final px/sec: {debug.finalPixelsPerSecond.toFixed(2)}</div>
      <div>px/sec: {debug.pixelsPerSecond.toFixed(2)}</div>
      <div>elapsed: {debug.elapsedSeconds.toFixed(3)}s</div>
      <div>frames: {debug.frameCount}</div>
      <div>last frame: {debug.lastFrameAgeMs.toFixed(0)}ms</div>
      <div>last scroll: {debug.lastScrollChangeAgeMs.toFixed(0)}ms</div>
      <div>status: {debug.frameStatus}</div>
      <div>stop: {debug.stopReason}</div>
    </div>
  );
}

function StageSetlistBar({
  song,
  nextSong,
  previousSong,
  onNext,
  onPrevious,
  navigationLabel,
  stageSetlistMode,
  countdownRemaining,
  isTransitioningSong
}: {
  song: Song;
  nextSong?: Song;
  previousSong?: Song;
  onNext: () => void;
  onPrevious: () => void;
  navigationLabel: string;
  stageSetlistMode: boolean;
  countdownRemaining: number;
  isTransitioningSong: boolean;
}) {
  return (
    <div className={`grid gap-3 ${stageSetlistMode ? 'md:grid-cols-[1fr_1fr_auto]' : 'md:grid-cols-[1fr_auto]'}`}>
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
        <Metric label="Mode" value={navigationLabel} />
        <Metric label="Current" value={song.title} />
        <Metric label="Key" value={song.key || '-'} />
        <Metric label="Capo" value={String(song.capo)} />
        <Metric label="BPM" value={song.bpm ? String(song.bpm) : '-'} />
        <Metric label="Duration" value={formatDuration(song.durationSeconds)} />
      </div>
      {stageSetlistMode && (
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
          <Metric label="Next" value={nextSong?.title ?? 'End'} />
          <Metric label="Key" value={nextSong?.key || '-'} />
          <Metric label="Capo" value={nextSong ? String(nextSong.capo) : '-'} />
          <Metric label="BPM" value={nextSong?.bpm ? String(nextSong.bpm) : '-'} />
          <Metric label="Gap" value={countdownRemaining > 0 ? `${countdownRemaining}s` : '-'} />
        </div>
      )}
      <div className="flex flex-wrap gap-2">
        <button className="secondary-button h-14 min-w-28 text-base disabled:opacity-35" disabled={!previousSong || isTransitioningSong} onClick={onPrevious}>
          <ChevronLeft size={20} />
          Previous
        </button>
        <button className="primary-button h-14 min-w-36 text-base disabled:opacity-35" disabled={!nextSong || isTransitioningSong} onClick={onNext}>
          Next Song
          <ChevronRight size={20} />
        </button>
      </div>
    </div>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md border border-slate-700/40 bg-slate-950/10 px-3 py-2">
      <div className="text-[0.65rem] uppercase tracking-normal text-slate-400">{label}</div>
      <div className="truncate text-sm font-semibold">{value}</div>
    </div>
  );
}

function PerformanceControlPanel({
  state,
  setState,
  setPreset,
  setAutoscrollSpeed,
  onCalculateDuration
}: {
  state: PerformanceState;
  setState: (next: Partial<PerformanceState>) => void;
  setPreset: (preset: AutoscrollPreset) => void;
  setAutoscrollSpeed: (speed: number) => void;
  onCalculateDuration: () => void;
}) {
  return (
    <div className="grid gap-3 lg:grid-cols-[auto_auto_1fr_auto]">
      <label className="grid gap-1 text-sm">
        <span className="font-semibold text-slate-300">Device Profile</span>
        <select
          className="h-10 rounded-md border border-slate-700 bg-slate-950 px-3 text-white"
          value={state.activeProfile}
          onChange={(event) => setState({ activeProfile: event.target.value as DeviceProfile })}
        >
          <option value="desktop">Desktop</option>
          <option value="ipad-portrait">iPad Portrait</option>
          <option value="ipad-landscape">iPad Landscape</option>
          <option value="iphone">iPhone</option>
          <option value="prompter-display">Prompter Display</option>
        </select>
      </label>
      <div className="flex flex-wrap gap-2">
        <Stepper label="Transpose" value={state.transpose} min={-11} max={11} onChange={(transpose) => setState({ transpose })} />
        <Stepper label="Lyric Font Size" value={state.fontSize} min={24} max={76} onChange={(fontSize) => setState({ fontSize })} />
        <Stepper label="Chord Font Size" value={getEffectiveChordFontSize(state)} min={10} max={48} onChange={(chordFontSize) => updateChordFontSize(setState, state, chordFontSize)} />
        <Stepper label="Chord Vertical Offset" value={getEffectiveChordVerticalOffset(state)} min={-16} max={16} onChange={(chordVerticalOffset) => updateChordVerticalOffset(setState, state, chordVerticalOffset)} />
      </div>
      <div className="flex flex-wrap gap-2">
        <button className="stage-toggle" title="Dark mode" onClick={() => setState({ theme: state.theme === 'dark' ? 'light' : 'dark' })}>
          {state.theme === 'dark' ? <Moon size={18} /> : <Sun size={18} />}
          {state.theme}
        </button>
        <button className="stage-toggle" title="Portrait prompter" onClick={() => setState({ portraitMode: !state.portraitMode })}>
          <Monitor size={18} />
          Portrait {state.portraitMode ? 'on' : 'off'}
        </button>
        <button className="stage-toggle" title="Mirror for beam splitter glass" onClick={() => setState({ mirroredMode: !state.mirroredMode })}>
          <RotateCcw size={18} />
          Mirror {state.mirroredMode ? 'on' : 'off'}
        </button>
        <button className="stage-toggle" title="Nashville Number System" onClick={() => setState({ showNashvilleNumbers: !state.showNashvilleNumbers })}>
          # Nashville {state.showNashvilleNumbers ? 'on' : 'off'}
        </button>
        <button className="stage-toggle" title="Section sidebar" onClick={() => setState({ showSectionSidebar: !state.showSectionSidebar })}>
          Sections {state.showSectionSidebar ? 'on' : 'off'}
        </button>
        <button className="stage-toggle" title="Split tablet columns" onClick={() => setState({ splitScreen: !state.splitScreen })}>
          Split {state.splitScreen ? 'on' : 'off'}
        </button>
      </div>
      <div className="grid gap-2">
        <div className="flex flex-wrap items-center gap-2 text-xs">
          {[
            ['manual-duration', 'Manual duration'],
            ['bpm-estimate', 'BPM-based estimate'],
            ['manual-speed', 'Manual speed slider']
          ].map(([mode, label]) => (
            <button
              key={mode}
              className={`rounded-md border px-3 py-2 ${state.autoscrollDurationMode === mode ? 'border-teal-500 bg-teal-700 text-white' : 'border-slate-600'}`}
              onClick={() => setState({ autoscrollDurationMode: mode as PerformanceState['autoscrollDurationMode'] })}
              type="button"
            >
              {label}
            </button>
          ))}
          <button className="rounded-md border border-amber-400 px-3 py-2 text-amber-100" type="button" onClick={onCalculateDuration}>
            Calculate Duration from BPM
          </button>
        </div>
        <div className="flex flex-wrap items-center gap-2 text-xs">
          <span className="font-semibold text-slate-300">Reading Pace</span>
          {[
            ['slower', 'Slower'],
            ['normal', 'Normal'],
            ['faster', 'Faster']
          ].map(([pace, label]) => (
            <button
              key={pace}
              className={`rounded-md border px-3 py-2 ${state.readingPace === pace ? 'border-teal-500 bg-teal-700 text-white' : 'border-slate-600'}`}
              onClick={() => setState({ readingPace: pace as ReadingPace })}
              type="button"
            >
              {label}
            </button>
          ))}
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Gauge size={18} className="text-teal-500" />
          {(['slow', 'medium', 'fast'] as const).map((preset) => (
            <button
              key={preset}
              className={`rounded-md border px-3 py-2 text-sm ${state.autoscrollPreset === preset ? 'border-teal-500 bg-teal-700 text-white' : 'border-slate-600'}`}
              onClick={() => setPreset(preset)}
            >
              {preset}
            </button>
          ))}
        </div>
        <label className="grid gap-1 text-sm">
          <span>Scroll Speed: {normalizeAutoscrollSpeedMultiplier(state.autoscrollSpeed).toFixed(2)}x</span>
          <input
            type="range"
            min={0.25}
            max={3}
            step={0.05}
            value={normalizeAutoscrollSpeedMultiplier(state.autoscrollSpeed)}
            onChange={(event) => setAutoscrollSpeed(Number(event.target.value))}
          />
        </label>
      </div>
      <label className="grid gap-1 text-sm">
        <span>Countdown between songs: {state.countdownSeconds}s</span>
        <input
          type="range"
          min={0}
          max={90}
          step={5}
          value={state.countdownSeconds}
          onChange={(event) => setState({ countdownSeconds: Number(event.target.value) })}
        />
      </label>
    </div>
  );
}

type LyricSourceRange = {
  start: number;
  end: number;
  sourceStart: number;
  sourceEnd: number;
};

function ChordProDisplayLine({
  line,
  transpose,
  showNashville,
  songKey,
  boldChords,
  italicChords,
  showChords,
  chordFontColor,
  chordHighlightColor,
  sectionFontSize,
  sectionFontColor,
  sectionBold,
  sectionItalic,
  sectionUppercase,
  sectionSpacingBefore,
  sectionSpacingAfter,
  songTitleStyle,
  songArtistStyle,
  showHarmonyCues,
  harmonyTextColor,
  harmonyIconColor,
  harmonyItalic,
  harmonyUnderline,
  harmonyIconVisible,
  showHarmonyDebug,
  displayPreference,
  lineIndex,
  chordFontSize,
  chordFontFamily,
  lyricFontSize,
  lineSpacing,
  chordVerticalOffset,
  mobileReflowMode,
  showAnchorDebug
}: {
  line: RenderedLine;
  transpose: number;
  showNashville: boolean;
  songKey: string;
  boldChords: boolean;
  italicChords: boolean;
  showChords: boolean;
  chordFontColor: string;
  chordHighlightColor: string;
  sectionFontSize: number;
  sectionFontColor: string;
  sectionBold: boolean;
  sectionItalic: boolean;
  sectionUppercase: boolean;
  sectionSpacingBefore: number;
  sectionSpacingAfter: number;
  songTitleStyle: React.CSSProperties;
  songArtistStyle: React.CSSProperties;
  showHarmonyCues: boolean;
  harmonyTextColor: string;
  harmonyIconColor: string;
  harmonyItalic: boolean;
  harmonyUnderline: boolean;
  harmonyIconVisible: boolean;
  showHarmonyDebug: boolean;
  displayPreference: Song['displayPreference'];
  lineIndex: number;
  chordFontSize: number;
  chordFontFamily: string;
  lyricFontSize: number;
  lineSpacing: number;
  chordVerticalOffset: number;
  mobileReflowMode: boolean;
  showAnchorDebug: boolean;
}) {
  const resolvedChordColor = resolveRenderableColor(chordFontColor, resolveChordFontColor);
  const resolvedHighlightColor = resolveChordHighlightColor(chordHighlightColor);
  const hasHighlight = resolvedHighlightColor !== 'transparent';
  const chordStyle: React.CSSProperties = {
    fontSize: `${chordFontSize}px`,
    fontFamily: chordFontFamily,
    lineHeight: 1.15,
    color: resolvedChordColor,
    backgroundColor: hasHighlight ? resolvedHighlightColor : undefined,
    borderRadius: hasHighlight ? '0.18em' : undefined,
    padding: hasHighlight ? '0 0.12em' : undefined,
    fontStyle: italicChords ? 'italic' : undefined
  };
  const chordClassName = `stage-chord ${boldChords ? 'font-bold' : 'font-semibold'}`;
  const rowSpacingPx = chartRowSpacingPx(lyricFontSize, lineSpacing);
  const rowSpacingStyle: React.CSSProperties = { marginBottom: `${rowSpacingPx}px` };
  const lyricLineStyle: React.CSSProperties = {
    minHeight: `${Math.max(0.75, chartLineHeightEm(lineSpacing))}em`,
    lineHeight: chartLineHeightEm(lineSpacing)
  };
  const sectionStyle: React.CSSProperties = {
    color: resolveRenderableColor(sectionFontColor, resolveSectionFontColor),
    fontSize: `${sectionFontSize}px`,
    marginTop: `${Math.round(sectionSpacingBefore * lineSpacing)}px`,
    marginBottom: `${Math.round(sectionSpacingAfter * lineSpacing)}px`,
    fontWeight: sectionBold ? 800 : 500,
    fontStyle: sectionItalic ? 'italic' : undefined,
    textTransform: sectionUppercase ? 'uppercase' : 'none'
  };
  const harmonyStyle: React.CSSProperties = {
    color: showHarmonyCues ? resolveRenderableColor(harmonyTextColor, resolveHarmonyColor) : undefined,
    fontStyle: showHarmonyCues && harmonyItalic ? 'italic' : undefined,
    textDecorationLine: showHarmonyCues && harmonyUnderline ? 'underline' : undefined,
    textDecorationThickness: showHarmonyCues && harmonyUnderline ? '0.08em' : undefined,
    textUnderlineOffset: showHarmonyCues && harmonyUnderline ? '0.16em' : undefined
  };
  const resolvedHarmonyIconColor = resolveRenderableColor(harmonyIconColor, resolveHarmonyColor);

  if (line.type === 'blank') return <div data-line-index={lineIndex} style={{ height: `${Math.max(0.5, 1.35 * lineSpacing)}em` }} />;

  if (line.type === 'comment') {
    return <div data-line-index={lineIndex} className="mt-4 text-[0.55em] italic text-amber-100" style={rowSpacingStyle}>{line.text}</div>;
  }

  if (line.type === 'section') {
    if (line.boundary === 'end') return null;
    return renderStageSectionLabel(line.section, lineIndex, sectionStyle);
  }

  if (line.type === 'song-title') {
    return (
      <div
        data-line-index={lineIndex}
        data-song-document-role="title"
        data-song-document-font-size={songTitleStyle.fontSize?.toString() ?? ''}
        className="mb-1 whitespace-normal leading-tight tracking-normal"
        style={songTitleStyle}
      >
        {line.value}
      </div>
    );
  }

  if (line.type === 'song-artist') {
    return (
      <div
        data-line-index={lineIndex}
        data-song-document-role="artist"
        data-song-document-font-size={songArtistStyle.fontSize?.toString() ?? ''}
        className="mb-6 whitespace-normal leading-snug tracking-normal"
        style={songArtistStyle}
      >
        {line.value}
      </div>
    );
  }

  if (line.type === 'directive') {
    if (isHiddenStageDirective(line.name)) return null;
    const visibleDirectives = new Set(['subtitle', 'album']);
    if (!visibleDirectives.has(line.name) || !line.value) return null;
    return <div data-line-index={lineIndex} className="text-[0.5em] uppercase tracking-normal text-slate-400">{line.value}</div>;
  }

  if (line.type === 'chord-over') {
    if (isHiddenStageTextLine(`${line.chordLine}\n${line.lyricLine}`)) return null;
    if (!line.lyricLine) {
      if (!showChords) return null;
      const chordRowHeight = Math.ceil(chordFontSize * 1.25);
      if (mobileReflowMode) {
        return (
          <div data-line-index={lineIndex} className="stage-mobile-chord-row font-mono" style={{ minHeight: `${chordRowHeight}px`, lineHeight: `${chordRowHeight}px`, ...rowSpacingStyle }}>
            {line.chordLine && <div>{renderMobileStandaloneChordRow(line.chordLine, chordClassName, chordStyle)}</div>}
          </div>
        );
      }
      return (
        <div data-line-index={lineIndex} className="stage-standalone-chord-row font-mono" style={{ minHeight: `${chordRowHeight}px`, lineHeight: `${chordRowHeight}px`, ...rowSpacingStyle }}>
          {line.chordLine && renderStandaloneChordRow(line.chordLine, chordClassName, chordStyle)}
        </div>
      );
    }
    const anchoredLine = chordOverTextToAnchoredLine(line.chordLine, line.lyricLine);
    const chordOverSourceRanges = buildLyricSourceRangesFromRawText(line.lyricLine, line.lyricSourceStart);
    if (mobileReflowMode) {
      return (
        <MobileReflowChordLine
          anchoredLine={anchoredLine}
          sourceRanges={chordOverSourceRanges}
          lineIndex={lineIndex}
          chordClassName={chordClassName}
          chordStyle={chordStyle}
          lyricLineStyle={lyricLineStyle}
          rowSpacingStyle={rowSpacingStyle}
          showChords={showChords}
          showHarmonyCues={showHarmonyCues}
          harmonyStyle={harmonyStyle}
          harmonyIconColor={resolvedHarmonyIconColor}
          harmonyIconVisible={harmonyIconVisible}
          showHarmonyDebug={showHarmonyDebug}
        />
      );
    }
    return (
      <AnchoredChordDisplayLine
        anchoredLine={anchoredLine}
        sourceRanges={chordOverSourceRanges}
        lineIndex={lineIndex}
        chordClassName={chordClassName}
        chordStyle={chordStyle}
        chordFontSize={chordFontSize}
        lyricFontSize={lyricFontSize}
        lineSpacing={lineSpacing}
        chordVerticalOffset={chordVerticalOffset}
        showAnchorDebug={showAnchorDebug}
        showChords={showChords}
        showHarmonyCues={showHarmonyCues}
        harmonyStyle={harmonyStyle}
        harmonyIconColor={resolvedHarmonyIconColor}
        harmonyIconVisible={harmonyIconVisible}
        showHarmonyDebug={showHarmonyDebug}
      />
    );
  }

  const rawLineText = line.tokens.map((token) => token.display).join('');
  const plainLineState = lyricTextHarmonyState(rawLineText);
  const plainLineText = plainLineState.text;
  const hasChordTokens = line.tokens.some((token) => token.type === 'chord');
  if (isHiddenStageTextLine(plainLineText)) return null;
  if (!hasChordTokens && isStageSectionLabelText(plainLineText)) {
    return renderStageSectionLabel(plainLineText, lineIndex, sectionStyle);
  }

  if (displayPreference === 'chords-over') {
    const anchoredLine = chordTokensToAnchoredLine(line.tokens);
    const tokenSourceRanges = buildLyricSourceRangesFromRenderedTokens(line.tokens);
    if (anchoredLine.anchors.length > 0) {
      if (mobileReflowMode) {
        return (
          <MobileReflowChordLine
            anchoredLine={anchoredLine}
            sourceRanges={tokenSourceRanges}
            lineIndex={lineIndex}
            chordClassName={chordClassName}
            chordStyle={chordStyle}
            lyricLineStyle={lyricLineStyle}
            rowSpacingStyle={rowSpacingStyle}
            showChords={showChords}
            showHarmonyCues={showHarmonyCues}
            harmonyStyle={harmonyStyle}
            harmonyIconColor={resolvedHarmonyIconColor}
            harmonyIconVisible={harmonyIconVisible}
            showHarmonyDebug={showHarmonyDebug}
          />
        );
      }
      return (
        <AnchoredChordDisplayLine
          anchoredLine={anchoredLine}
          sourceRanges={tokenSourceRanges}
          lineIndex={lineIndex}
          chordClassName={chordClassName}
          chordStyle={chordStyle}
          chordFontSize={chordFontSize}
          lyricFontSize={lyricFontSize}
          lineSpacing={lineSpacing}
          chordVerticalOffset={chordVerticalOffset}
          showAnchorDebug={showAnchorDebug}
          showChords={showChords}
          showHarmonyCues={showHarmonyCues}
          harmonyStyle={harmonyStyle}
          harmonyIconColor={resolvedHarmonyIconColor}
          harmonyIconVisible={harmonyIconVisible}
          showHarmonyDebug={showHarmonyDebug}
        />
      );
    }
  }

  const inlineAnchoredLine = chordTokensToAnchoredLine(line.tokens);
  const inlineSourceRanges = buildLyricSourceRangesFromRenderedTokens(line.tokens);
  if (inlineAnchoredLine.anchors.length > 0) {
    if (mobileReflowMode) {
      return (
        <MobileReflowChordLine
          anchoredLine={inlineAnchoredLine}
          sourceRanges={inlineSourceRanges}
          lineIndex={lineIndex}
          chordClassName={chordClassName}
          chordStyle={chordStyle}
          lyricLineStyle={lyricLineStyle}
          rowSpacingStyle={rowSpacingStyle}
          showChords={showChords}
          showHarmonyCues={showHarmonyCues}
          harmonyStyle={harmonyStyle}
          harmonyIconColor={resolvedHarmonyIconColor}
          harmonyIconVisible={harmonyIconVisible}
          showHarmonyDebug={showHarmonyDebug}
        />
      );
    }
    return (
      <AnchoredChordDisplayLine
        anchoredLine={inlineAnchoredLine}
        sourceRanges={inlineSourceRanges}
        lineIndex={lineIndex}
        chordClassName={chordClassName}
        chordStyle={chordStyle}
        chordFontSize={chordFontSize}
        lyricFontSize={lyricFontSize}
        lineSpacing={lineSpacing}
        chordVerticalOffset={chordVerticalOffset}
        showAnchorDebug={showAnchorDebug}
        showChords={showChords}
        showHarmonyCues={showHarmonyCues}
        harmonyStyle={harmonyStyle}
        harmonyIconColor={resolvedHarmonyIconColor}
        harmonyIconVisible={harmonyIconVisible}
        showHarmonyDebug={showHarmonyDebug}
      />
    );
  }

  return (
    <div data-line-index={lineIndex} className="stage-plain-lyric-line relative" style={lyricLineStyle}>
      {showHarmonyCues && harmonyIconVisible && plainLineState.hasHarmony && <HarmonyCueIcon color={resolvedHarmonyIconColor} />}
      {renderSelectableLyricTextWithHarmony(rawLineText, {
        sourceRanges: buildLyricSourceRangesFromRenderedTokens(line.tokens),
        showHarmonyCues,
        harmonyStyle,
        showHarmonyDebug
      })}
    </div>
  );
}

function renderSelectableLyricTextWithHarmony(
  text: string,
  options: LyricTextWithHarmonyOptions & { sourceRanges?: LyricSourceRange[] }
) {
  const lyricState = lyricTextHarmonyState(text, options.harmonyRanges);
  const boundaries = Array.from(new Set([
    0,
    lyricState.text.length,
    ...lyricState.ranges.flatMap((range) => [range.start, range.end]),
    ...(options.sourceRanges ?? []).flatMap((range) => [range.start, range.end])
  ])).sort((left, right) => left - right);

  if (boundaries.length <= 2 && !options.sourceRanges?.length) {
    return renderLyricTextWithHarmony(text, options);
  }

  return boundaries.slice(0, -1).map((start, index) => {
    const end = boundaries[index + 1];
    if (start >= end) return null;
    const sourceRange = sourceRangeForSlice(options.sourceRanges, start, end);
    const harmonyRanges = sliceHarmonyRanges(lyricState.ranges, start, end);
    const dataProps = sourceRange
      ? {
          'data-stage-lyric': 'true',
          'data-source-start': String(sourceRange.sourceStart + (start - sourceRange.start)),
          'data-source-end': String(sourceRange.sourceStart + (end - sourceRange.start))
        }
      : {};
    return (
      <span key={`selectable-${start}-${end}-${index}`} {...dataProps}>
        {renderLyricTextWithHarmony(lyricState.text.slice(start, end), {
          harmonyRanges,
          showHarmonyCues: options.showHarmonyCues,
          harmonyStyle: options.harmonyStyle,
          showHarmonyDebug: options.showHarmonyDebug
        })}
      </span>
    );
  });
}

function sourceRangeForSlice(ranges: LyricSourceRange[] | undefined, start: number, end: number) {
  return ranges?.find((range) => start >= range.start && end <= range.end);
}

function buildLyricSourceRangesFromRenderedTokens(tokens: Array<{ type: 'text' | 'chord'; value: string; display: string; sourceStart?: number }>) {
  const ranges: LyricSourceRange[] = [];
  let visibleCursor = 0;
  tokens.forEach((token) => {
    if (token.type !== 'text') return;
    const built = buildLyricSourceRangesFromRawText(token.display, token.sourceStart, visibleCursor);
    if (built) ranges.push(...built);
    visibleCursor += lyricTextHarmonyState(token.display).text.length;
  });
  return ranges;
}

function buildLyricSourceRangesFromRawText(rawText: string, sourceStart: number | undefined, visibleOffset = 0) {
  if (typeof sourceStart !== 'number') return undefined;
  const ranges: LyricSourceRange[] = [];
  let visibleCursor = visibleOffset;
  let rawIndex = 0;

  while (rawIndex < rawText.length) {
    const remaining = rawText.slice(rawIndex).toUpperCase();
    if (remaining.startsWith('[HARMONY]')) {
      rawIndex += '[HARMONY]'.length;
      continue;
    }
    if (remaining.startsWith('[/HARMONY]')) {
      rawIndex += '[/HARMONY]'.length;
      continue;
    }
    const rawStart = rawIndex;
    let text = '';
    while (rawIndex < rawText.length) {
      const next = rawText.slice(rawIndex).toUpperCase();
      if (next.startsWith('[HARMONY]') || next.startsWith('[/HARMONY]')) break;
      text += rawText[rawIndex];
      rawIndex += 1;
    }
    if (text.length > 0) {
      ranges.push({
        start: visibleCursor,
        end: visibleCursor + text.length,
        sourceStart: sourceStart + rawStart,
        sourceEnd: sourceStart + rawIndex
      });
      visibleCursor += text.length;
    }
  }

  return mergeAdjacentLyricSourceRanges(ranges);
}

function mergeAdjacentLyricSourceRanges(ranges: LyricSourceRange[]) {
  const merged: LyricSourceRange[] = [];
  ranges.forEach((range) => {
    const previous = merged[merged.length - 1];
    if (previous && previous.end === range.start && previous.sourceEnd === range.sourceStart) {
      previous.end = range.end;
      previous.sourceEnd = range.sourceEnd;
      return;
    }
    merged.push({ ...range });
  });
  return merged;
}

function renderStandaloneChordRow(line: string, chordClassName: string, chordStyle: React.CSSProperties) {
  return line.trim().split(/\s+/).filter(Boolean).map((part, index) => {
    if (!part) return null;
    if (!isStageChordToken(part)) return <span key={`${part}-${index}`}>{part}</span>;
    return (
      <span key={`${part}-${index}`} className={chordClassName} style={chordStyle}>
        {part}
      </span>
    );
  });
}

function renderMobileStandaloneChordRow(line: string, chordClassName: string, chordStyle: React.CSSProperties) {
  return line.trim().split(/\s+/).filter(Boolean).map((part, index) => {
    if (!isStageChordToken(part)) return <span key={`${part}-${index}`}>{part}</span>;
    return (
      <span key={`${part}-${index}`} className={chordClassName} style={chordStyle}>
        {part}
      </span>
    );
  });
}

function MobileReflowChordLine({
  anchoredLine,
  sourceRanges,
  lineIndex,
  chordClassName,
  chordStyle,
  lyricLineStyle,
  rowSpacingStyle,
  showChords,
  showHarmonyCues,
  harmonyStyle,
  harmonyIconColor,
  harmonyIconVisible,
  showHarmonyDebug
}: {
  anchoredLine: AnchoredChordLine;
  sourceRanges?: LyricSourceRange[];
  lineIndex: number;
  chordClassName: string;
  chordStyle: React.CSSProperties;
  lyricLineStyle: React.CSSProperties;
  rowSpacingStyle: React.CSSProperties;
  showChords: boolean;
  showHarmonyCues: boolean;
  harmonyStyle: React.CSSProperties;
  harmonyIconColor: string;
  harmonyIconVisible: boolean;
  showHarmonyDebug: boolean;
}) {
  const lyricState = lyricTextHarmonyState(anchoredLine.lyricLine, anchoredLine.harmonyRanges);
  const groupedAnchors = new Map<number, string[]>();
  anchoredLine.anchors.forEach((anchor) => {
    const index = Math.max(0, Math.min(anchoredLine.lyricLine.length, anchor.index));
    groupedAnchors.set(index, [...(groupedAnchors.get(index) ?? []), anchor.chord]);
  });

  const boundaries = Array.from(new Set([
    0,
    anchoredLine.lyricLine.length,
    ...groupedAnchors.keys(),
    ...lyricState.ranges.flatMap((range) => [range.start, range.end])
  ])).sort((left, right) => left - right);
  const nodes: React.ReactNode[] = [];

  boundaries.forEach((boundary, index) => {
    const nextBoundary = boundaries[index + 1];
    if (nextBoundary === undefined || boundary >= nextBoundary) return;
    nodes.push(
      <span key={`text-${boundary}-${nextBoundary}`}>
        {renderSelectableLyricTextWithHarmony(anchoredLine.lyricLine.slice(boundary, nextBoundary), {
          harmonyRanges: sliceHarmonyRanges(lyricState.ranges, boundary, nextBoundary),
          sourceRanges: sliceLyricSourceRanges(sourceRanges, boundary, nextBoundary),
          showHarmonyCues,
          harmonyStyle,
          showHarmonyDebug
        })}
      </span>
    );
  });

  if (nodes.length === 0) nodes.push(<span key="empty">&nbsp;</span>);

  return (
    <div data-line-index={lineIndex} className="stage-mobile-reflow-line relative min-w-0 max-w-full break-words" style={{ ...lyricLineStyle, ...rowSpacingStyle }}>
      {showChords && anchoredLine.anchors.length > 0 && (
        <div className="stage-mobile-compact-chord-row font-mono">
          {anchoredLine.anchors.map((anchor, index) => (
            <span key={`${anchor.chord}-${anchor.index}-${index}`} className={chordClassName} style={chordStyle}>
              {anchor.chord}
            </span>
          ))}
        </div>
      )}
      <div className="stage-mobile-lyric-row">
        {showHarmonyCues && harmonyIconVisible && lyricState.hasHarmony && <HarmonyCueIcon color={harmonyIconColor} />}
        {nodes}
      </div>
    </div>
  );
}

function renderStageSectionLabel(label: string, lineIndex: number, style: React.CSSProperties) {
  return (
    <div data-line-index={lineIndex} className="stage-section" style={style}>
      {label}
    </div>
  );
}

function HarmonyCueIcon({ color, top, inline = true }: { color: string; top?: number | string; inline?: boolean }) {
  if (inline) {
    return (
      <Music2
        className="pointer-events-none mr-[0.28em] inline-block h-[0.78em] w-[0.78em] align-[-0.08em]"
        style={{
          color,
          filter: 'drop-shadow(0 0 0.28em rgba(99,102,241,0.24))'
        }}
        aria-hidden="true"
      />
    );
  }

  return (
    <Music2
      className="pointer-events-none absolute h-[0.78em] w-[0.78em]"
      style={{
        color,
        top: top ?? '50%',
        right: 'calc(100% + 0.28em)',
        transform: 'translateY(-50%)',
        filter: 'drop-shadow(0 0 0.28em rgba(99,102,241,0.24))'
      }}
      aria-hidden="true"
    />
  );
}

function isHiddenStageDirective(name: string) {
  return /^midi(?:-index)?$/i.test(name.trim());
}

function isHiddenStageTextLine(text: string) {
  const trimmed = text.trim();
  return isHiddenStageMetadataLabel(trimmed) || /^\{\s*midi(?:-index)?\s*:/i.test(trimmed);
}

function filterStageNotes(notes: string) {
  return notes
    .split(/\r?\n/)
    .filter((line) => !/^source file\s*:/i.test(line.trim()))
    .join('\n')
    .trim();
}

function isStageSectionLabelText(text: string) {
  const trimmed = text.trim();
  if (isHiddenStageMetadataLabel(trimmed)) return false;
  return trimmed.length > 1 && trimmed.endsWith(':');
}

function isHiddenStageMetadataLabel(text: string) {
  return /^(?:midi(?:-index)?|key|capo|source file|tempo|bpm)\s*:/i.test(text);
}

function isStageChordToken(value: string) {
  if (/^(?:\|+|:+|\|:|:\||%|x\d+)$/i.test(value)) return false;
  return /^[|:({\[]*[A-G](?:#|b)?(?:m(?!aj)|maj|min|dim|aug|sus|add|\d|[#b()+-])*?(?:\/[A-G](?:#|b)?(?:m(?!aj)|maj|min|dim|aug|sus|add|\d|[#b()+-])*)?[|:)}\]]*$/i.test(value);
}

function AnchoredChordDisplayLine({
  anchoredLine,
  sourceRanges,
  lineIndex,
  chordClassName,
  chordStyle,
  chordFontSize,
  lyricFontSize,
  lineSpacing,
  chordVerticalOffset,
  showAnchorDebug,
  showChords,
  showHarmonyCues,
  harmonyStyle,
  harmonyIconColor,
  harmonyIconVisible,
  showHarmonyDebug
}: {
  anchoredLine: AnchoredChordLine;
  sourceRanges?: LyricSourceRange[];
  lineIndex: number;
  chordClassName: string;
  chordStyle: React.CSSProperties;
  chordFontSize: number;
  lyricFontSize: number;
  lineSpacing: number;
  chordVerticalOffset: number;
  showAnchorDebug: boolean;
  showChords: boolean;
  showHarmonyCues: boolean;
  harmonyStyle: React.CSSProperties;
  harmonyIconColor: string;
  harmonyIconVisible: boolean;
  showHarmonyDebug: boolean;
}) {
  const { lyricLineHeight, lyricTop, rowSpacing, totalLineHeight } = anchoredChordLineLayout(lyricFontSize, chordFontSize, lineSpacing);
  const markerRefs = useRef(new Map<number, HTMLSpanElement>());
  const wrapperRef = useRef<HTMLDivElement | null>(null);
  const lineBoxRef = useRef<HTMLDivElement | null>(null);
  const lyricRef = useRef<HTMLDivElement | null>(null);
  const [anchorPositions, setAnchorPositions] = useState<Record<number, { left: number; top: number }>>({});
  const [measuredLineHeight, setMeasuredLineHeight] = useState(totalLineHeight);
  const [availableWidth, setAvailableWidth] = useState(0);
  const anchorKey = anchoredLine.anchors.map((anchor) => `${anchor.index}:${anchor.chord}`).join('|');
  const anchorIndexes = useMemo(
    () => Array.from(new Set(anchoredLine.anchors.map((anchor) => anchor.index))).sort((a, b) => a - b),
    [anchorKey]
  );
  const wrappedLines = useMemo(
    () => wrapAnchoredLineForStage(
      anchoredLine,
      sourceRanges,
      availableWidth,
      `${lyricFontSize}px ${stageChartMeasureFontFamily()}`
    ),
    [anchoredLine, sourceRanges, availableWidth, lyricFontSize]
  );

  useLayoutEffect(() => {
    const updateWidth = () => {
      const width = wrapperRef.current?.clientWidth ?? lineBoxRef.current?.clientWidth ?? 0;
      setAvailableWidth((current) => (Math.abs(current - width) < 1 ? current : width));
    };
    updateWidth();

    if (typeof ResizeObserver === 'undefined') {
      window.addEventListener('resize', updateWidth);
      window.addEventListener('orientationchange', updateWidth);
      return () => {
        window.removeEventListener('resize', updateWidth);
        window.removeEventListener('orientationchange', updateWidth);
      };
    }

    const observer = new ResizeObserver(updateWidth);
    if (wrapperRef.current) observer.observe(wrapperRef.current);
    if (lineBoxRef.current) observer.observe(lineBoxRef.current);
    window.addEventListener('orientationchange', updateWidth);
    return () => {
      observer.disconnect();
      window.removeEventListener('orientationchange', updateWidth);
    };
  }, [lyricFontSize, chordFontSize, lineSpacing]);

  const measureAnchors = useCallback(() => {
    const nextPositions: Record<number, { left: number; top: number }> = {};
    anchorIndexes.forEach((index) => {
      const marker = markerRefs.current.get(index);
      const lineBox = lineBoxRef.current;
      if (!marker) return;
      const markerRect = marker.getClientRects()[0] ?? marker.getBoundingClientRect();
      const lineRect = lineBox?.getBoundingClientRect();
      const left = lineRect ? markerRect.left - lineRect.left : marker.offsetLeft;
      const wrappedLyricTop = lineRect ? markerRect.top - lineRect.top - lyricTop : marker.offsetTop;
      nextPositions[index] = {
        left: Math.max(0, left),
        top: Math.max(0, wrappedLyricTop + chordVerticalOffset)
      };
    });
    setAnchorPositions((current) => (sameAnchorPositions(current, nextPositions) ? current : nextPositions));
    const lyricHeight = lyricRef.current?.scrollHeight ?? lyricLineHeight;
    const nextHeight = Math.max(totalLineHeight, lyricTop + lyricHeight);
    setMeasuredLineHeight((current) => (Math.abs(current - nextHeight) < 1 ? current : nextHeight));
  }, [anchorIndexes, lyricTop, chordVerticalOffset, lyricLineHeight, totalLineHeight]);

  useLayoutEffect(() => {
    measureAnchors();
  }, [
    measureAnchors,
    anchorKey,
    anchoredLine.lyricLine,
    lyricFontSize,
    chordFontSize,
    lyricLineHeight,
    totalLineHeight,
    chordVerticalOffset
  ]);

  useLayoutEffect(() => {
    if (typeof ResizeObserver === 'undefined') {
      window.addEventListener('resize', measureAnchors);
      window.addEventListener('orientationchange', measureAnchors);
      return () => {
        window.removeEventListener('resize', measureAnchors);
        window.removeEventListener('orientationchange', measureAnchors);
      };
    }

    const observer = new ResizeObserver(() => measureAnchors());
    if (lineBoxRef.current) observer.observe(lineBoxRef.current);
    if (lyricRef.current) observer.observe(lyricRef.current);
    window.addEventListener('orientationchange', measureAnchors);
    return () => {
      observer.disconnect();
      window.removeEventListener('orientationchange', measureAnchors);
    };
  }, [measureAnchors]);

  if (wrappedLines.length > 1) {
    return (
      <div ref={wrapperRef} data-line-index={lineIndex} className="stage-wrapped-chord-line font-mono" style={{ marginBottom: `${rowSpacing}px` }}>
        {wrappedLines.map((wrappedLine, wrappedIndex) => (
          <AnchoredChordDisplayLine
            key={`${wrappedLine.sourceStart}-${wrappedLine.sourceEnd}-${wrappedIndex}`}
            anchoredLine={wrappedLine}
            sourceRanges={wrappedLine.sourceRanges}
            lineIndex={lineIndex}
            chordClassName={chordClassName}
            chordStyle={chordStyle}
            chordFontSize={chordFontSize}
            lyricFontSize={lyricFontSize}
            lineSpacing={lineSpacing}
            chordVerticalOffset={chordVerticalOffset}
            showAnchorDebug={showAnchorDebug}
            showChords={showChords}
            showHarmonyCues={showHarmonyCues}
            harmonyStyle={harmonyStyle}
            harmonyIconColor={harmonyIconColor}
            harmonyIconVisible={harmonyIconVisible}
            showHarmonyDebug={showHarmonyDebug}
          />
        ))}
      </div>
    );
  }

  return (
    <div ref={wrapperRef} data-line-index={lineIndex} className="overflow-visible font-mono" style={{ marginBottom: `${rowSpacing}px` }}>
      <div
        ref={lineBoxRef}
        className="relative min-w-0 max-w-full overflow-visible"
        style={{
          minHeight: `${measuredLineHeight}px`,
          lineHeight: `${lyricLineHeight}px`
        }}
      >
        {showChords && anchoredLine.anchors.length > 0 && (
          <div className="pointer-events-none absolute left-0 top-0 h-full">
            {anchoredLine.anchors.map((anchor, index) => (
              <span
                key={`${anchor.chord}-${anchor.index}-${index}`}
                className={`absolute ${chordClassName}`}
                style={{
                  ...chordStyle,
                  left: `${anchorPositions[anchor.index]?.left ?? 0}px`,
                  top: `${anchorPositions[anchor.index]?.top ?? 0}px`
                }}
              >
                {anchor.chord}
                {showAnchorDebug && (
                  <span className="absolute left-0 top-full mt-0.5 h-2 w-2 -translate-x-1/2 rounded-full bg-fuchsia-400 shadow-[0_0_0_2px_rgba(0,0,0,0.45)]" />
                )}
              </span>
            ))}
          </div>
        )}
        <div ref={lyricRef} className="absolute left-0 stage-anchored-lyric-text" style={{ top: `${lyricTop}px`, lineHeight: `${lyricLineHeight}px` }}>
          {showHarmonyCues && harmonyIconVisible && anchoredLine.harmonyRanges.length > 0 && <HarmonyCueIcon color={harmonyIconColor} inline={false} />}
          {renderLyricWithAnchorMarkers(anchoredLine.lyricLine, anchorIndexes, markerRefs, anchoredLine.harmonyRanges, sourceRanges, showHarmonyCues, harmonyStyle, showHarmonyDebug)}
        </div>
      </div>
    </div>
  );
}

function wrapAnchoredLineForStage(
  anchoredLine: AnchoredChordLine,
  sourceRanges: LyricSourceRange[] | undefined,
  availableWidth: number,
  font: string
): WrappedAnchoredLine[] {
  const lyricLine = anchoredLine.lyricLine;
  if (!lyricLine || availableWidth <= 0) {
    return [{
      ...anchoredLine,
      sourceRanges,
      sourceStart: 0,
      sourceEnd: lyricLine.length
    }];
  }

  const usableWidth = Math.max(40, availableWidth - 4);
  if (measureStageLyricText(lyricLine, font) <= usableWidth) {
    return [{
      ...anchoredLine,
      sourceRanges,
      sourceStart: 0,
      sourceEnd: lyricLine.length
    }];
  }

  const segments = splitLyricByMeasuredWidth(lyricLine, usableWidth, font);
  if (segments.length <= 1) {
    return [{
      ...anchoredLine,
      sourceRanges,
      sourceStart: 0,
      sourceEnd: lyricLine.length
    }];
  }

  return segments.map((segment, segmentIndex) => {
    const segmentText = lyricLine.slice(segment.start, segment.end);
    const isLastSegment = segmentIndex === segments.length - 1;
    const anchors = anchoredLine.anchors
      .filter((anchor) => anchor.index >= segment.start && (anchor.index < segment.end || (isLastSegment && anchor.index <= segment.end)))
      .map((anchor) => ({
        chord: anchor.chord,
        index: Math.max(0, Math.min(segmentText.length, anchor.index - segment.start))
      }));

    return {
      lyricLine: segmentText,
      anchors,
      harmonyRanges: sliceHarmonyRanges(anchoredLine.harmonyRanges, segment.start, segment.end),
      sourceRanges: sliceLyricSourceRanges(sourceRanges, segment.start, segment.end),
      sourceStart: segment.start,
      sourceEnd: segment.end
    };
  });
}

function splitLyricByMeasuredWidth(text: string, width: number, font: string) {
  const segments: Array<{ start: number; end: number }> = [];
  let start = 0;

  while (start < text.length) {
    while (start < text.length && /\s/.test(text[start])) start += 1;
    if (start >= text.length) break;

    if (measureStageLyricText(text.slice(start), font) <= width) {
      segments.push({ start, end: text.length });
      break;
    }

    let low = start + 1;
    let high = text.length;
    let best = low;
    while (low <= high) {
      const mid = Math.floor((low + high) / 2);
      if (measureStageLyricText(text.slice(start, mid), font) <= width) {
        best = mid;
        low = mid + 1;
      } else {
        high = mid - 1;
      }
    }

    let end = best;
    for (let index = best; index > start; index -= 1) {
      if (/\s/.test(text[index - 1])) {
        end = index - 1;
        break;
      }
    }
    if (end <= start) end = best;
    segments.push({ start, end: Math.max(start + 1, end) });
    start = Math.max(start + 1, end);
  }

  return segments;
}

let stageMeasureCanvas: HTMLCanvasElement | null = null;

function measureStageLyricText(text: string, font: string) {
  if (typeof document === 'undefined') return text.length * 12;
  stageMeasureCanvas ??= document.createElement('canvas');
  const context = stageMeasureCanvas.getContext('2d');
  if (!context) return text.length * 12;
  context.font = font;
  return context.measureText(text).width;
}

function stageChartMeasureFontFamily() {
  return 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace';
}

function sameAnchorPositions(
  left: Record<number, { left: number; top: number }>,
  right: Record<number, { left: number; top: number }>
) {
  const leftKeys = Object.keys(left);
  const rightKeys = Object.keys(right);
  if (leftKeys.length !== rightKeys.length) return false;
  return leftKeys.every((key) => left[Number(key)]?.left === right[Number(key)]?.left && left[Number(key)]?.top === right[Number(key)]?.top);
}

function renderLyricWithAnchorMarkers(
  lyricLine: string,
  anchorIndexes: number[],
  markerRefs: React.MutableRefObject<Map<number, HTMLSpanElement>>,
  harmonyRanges: HarmonyRange[] = [],
  sourceRanges?: LyricSourceRange[],
  showHarmonyCues = true,
  harmonyStyle: React.CSSProperties = {},
  showHarmonyDebug = false
) {
  const nodes: React.ReactNode[] = [];
  const safeAnchors = anchorIndexes.map((index) => Math.max(0, Math.min(lyricLine.length, index)));
  const lyricState = lyricTextHarmonyState(lyricLine, harmonyRanges);
  const boundaries = Array.from(new Set([
    0,
    lyricLine.length,
    ...safeAnchors,
    ...lyricState.ranges.flatMap((range) => [range.start, range.end])
  ])).sort((left, right) => left - right);

  for (let index = 0; index < boundaries.length; index += 1) {
    const boundary = boundaries[index];
    const nextBoundary = boundaries[index + 1];
    const isAnchorBoundary = safeAnchors.includes(boundary);
    if (nextBoundary === undefined || boundary >= nextBoundary) {
      if (isAnchorBoundary) {
        nodes.push(
          <span
            key={`anchor-${boundary}-${index}`}
            ref={(element) => {
              if (element) markerRefs.current.set(boundary, element);
              else markerRefs.current.delete(boundary);
            }}
            className="stage-chord-anchor-marker"
            data-chord-anchor-index={boundary}
          />
        );
      }
      continue;
    }
    nodes.push(
      <span
        key={`text-${boundary}-${nextBoundary}`}
        ref={isAnchorBoundary
          ? (element) => {
              if (element) markerRefs.current.set(boundary, element);
              else markerRefs.current.delete(boundary);
            }
          : undefined}
        data-chord-anchor-index={isAnchorBoundary ? boundary : undefined}
        className={isAnchorBoundary ? 'stage-lyric-anchor-segment' : undefined}
      >
        {renderSelectableLyricTextWithHarmony(lyricLine.slice(boundary, nextBoundary), {
          harmonyRanges: sliceHarmonyRanges(lyricState.ranges, boundary, nextBoundary),
          sourceRanges: sliceLyricSourceRanges(sourceRanges, boundary, nextBoundary),
          showHarmonyCues,
          harmonyStyle,
          showHarmonyDebug
        })}
      </span>
    );
  }

  if (nodes.length === 0) nodes.push(<span key="empty">&nbsp;</span>);
  return nodes;
}

function sliceHarmonyRanges(ranges: HarmonyRange[], start: number, end: number) {
  return ranges
    .map((range) => ({
      start: Math.max(start, range.start) - start,
      end: Math.min(end, range.end) - start
    }))
    .filter((range) => range.end > range.start);
}

function sliceLyricSourceRanges(ranges: LyricSourceRange[] | undefined, start: number, end: number) {
  return ranges
    ?.map((range) => ({
      start: Math.max(start, range.start) - start,
      end: Math.min(end, range.end) - start,
      sourceStart: range.sourceStart + Math.max(0, start - range.start),
      sourceEnd: range.sourceStart + Math.max(0, Math.min(end, range.end) - range.start)
    }))
    .filter((range) => range.end > range.start);
}

function Stepper({
  label,
  value,
  min,
  max,
  onChange
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  onChange: (value: number) => void;
}) {
  return (
    <div className="flex h-10 items-center rounded-md border border-slate-700 bg-slate-950">
      <button className="h-full px-3 text-lg" title={`${label} down`} onClick={() => onChange(Math.max(min, value - 1))}>
        -
      </button>
      <div className="min-w-20 border-x border-slate-700 px-3 text-center text-xs">
        <div className="text-slate-400">{label}</div>
        <div className="font-semibold text-white">{value}</div>
      </div>
      <button className="h-full px-3 text-lg" title={`${label} up`} onClick={() => onChange(Math.min(max, value + 1))}>
        +
      </button>
    </div>
  );
}

function DecimalStepper({
  label,
  value,
  min,
  max,
  step,
  onChange
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  onChange: (value: number) => void;
}) {
  const round = (next: number) => Number(next.toFixed(2));
  return (
    <div className="flex h-10 items-center rounded-md border border-slate-700 bg-slate-950">
      <button className="h-full px-3 text-lg" title={`${label} down`} onClick={() => onChange(round(Math.max(min, value - step)))}>
        -
      </button>
      <div className="min-w-24 border-x border-slate-700 px-3 text-center text-xs">
        <div className="text-slate-400">{label}</div>
        <div className="font-semibold text-white">{value.toFixed(2)}</div>
      </div>
      <button className="h-full px-3 text-lg" title={`${label} up`} onClick={() => onChange(round(Math.min(max, value + step)))}>
        +
      </button>
    </div>
  );
}

function songFingerprint(song: Pick<Song, 'title' | 'artist'>) {
  return `${song.title.trim().toLowerCase()}::${song.artist.trim().toLowerCase()}`;
}

function songDuplicateKeys(song: Pick<Song, 'title' | 'artist'> & Partial<Pick<Song, 'songUuid'>>) {
  const keys: string[] = [];
  const songUuid = song.songUuid?.trim();
  if (songUuid) return [`uuid:${songUuid}`];
  const fingerprint = songFingerprint(song);
  if (fingerprint !== '::') keys.push(`title:${fingerprint}`);
  return keys;
}

function isValidSongVersion(value: unknown) {
  const version = Math.floor(Number(value));
  return Number.isFinite(version) && version > 0;
}

function normalizeSongVersion(value: unknown) {
  return isValidSongVersion(value) ? Math.floor(Number(value)) : 1;
}

function nextSongVersion(previous: Song | undefined, next: Song) {
  if (!previous) return normalizeSongVersion(next.version);
  const previousVersion = normalizeSongVersion(previous.version);
  return songVersionContentSnapshot(previous) === songVersionContentSnapshot(next) ? previousVersion : previousVersion + 1;
}

function compareSongVersions(localSong: Song, incomingSong: Song): SongVersionComparison {
  const localVersion = normalizeSongVersion(localSong.version);
  const incomingVersion = normalizeSongVersion(incomingSong.version);
  if (incomingVersion > localVersion) return 'incoming-newer';
  if (incomingVersion < localVersion) return 'local-newer';
  return 'same-version';
}

function songChangedSinceLastShared(song: Song) {
  if (!song.lastSharedAt) return false;
  const updatedAt = Date.parse(song.updatedAt || '');
  const lastSharedAt = Date.parse(song.lastSharedAt);
  return Number.isFinite(updatedAt) && Number.isFinite(lastSharedAt) && updatedAt > lastSharedAt;
}

function songVersionContentSnapshot(song: Song) {
  return JSON.stringify({
    title: song.title ?? '',
    subtitle: song.subtitle ?? '',
    artist: song.artist ?? '',
    album: song.album ?? '',
    genre: song.genre ?? '',
    vibe: song.vibe ?? '',
    crowdScore: song.crowdScore ?? null,
    danceability: song.danceability ?? null,
    energy: song.energy ?? null,
    vocalRange: song.vocalRange ?? '',
    vocalDifficulty: song.vocalDifficulty ?? '',
    openerCandidate: Boolean(song.openerCandidate),
    closerCandidate: Boolean(song.closerCandidate),
    musicBrainzRecordingId: song.musicBrainzRecordingId ?? '',
    deezerTrackId: song.deezerTrackId ?? '',
    lastFmUrl: song.lastFmUrl ?? '',
    referenceAudioUrl: song.referenceAudioUrl ?? '',
    difficulty: song.difficulty ?? '',
    tuning: song.tuning ?? '',
    originalKey: song.originalKey ?? '',
    performanceKey: song.performanceKey ?? '',
    durationSeconds: song.durationSeconds ?? null,
    year: song.year ?? null,
    bandNotes: song.bandNotes ?? '',
    rehearsalNotes: song.rehearsalNotes ?? [],
    key: song.key ?? '',
    capo: Number(song.capo ?? 0) || 0,
    bpm: Number(song.bpm ?? 0) || 0,
    timeSignature: song.timeSignature ?? '',
    tags: Array.isArray(song.tags) ? song.tags : [],
    notes: song.notes ?? '',
    chart: song.chart ?? '',
    displayPreference: song.displayPreference ?? '',
    rawChordPro: song.rawChordPro ?? ''
  });
}

function formatEnrichmentField(field: string) {
  const labels: Record<string, string> = {
    durationSeconds: 'Duration',
    crowdScore: 'Crowd score',
    vocalDifficulty: 'Vocal difficulty',
    openerCandidate: 'Opener candidate',
    closerCandidate: 'Closer candidate',
    deezerTrackId: 'Deezer track ID',
    musicBrainzRecordingId: 'MusicBrainz recording ID',
    lastFmUrl: 'Last.fm URL'
  };
  return labels[field] ?? field.replace(/([A-Z])/g, ' $1').replace(/^./, (value) => value.toUpperCase());
}

function formatEnrichmentValue(value: unknown) {
  if (value === undefined || value === null || value === '') return '-';
  if (typeof value === 'boolean') return value ? 'yes' : 'no';
  if (typeof value === 'number') return String(value);
  return String(value);
}

function matchesPedal(event: KeyboardEvent, mappedKeys: string[]) {
  const normalized = normalizeKeyEvent(event);
  return mappedKeys.includes(normalized);
}

function setPedalTestModeActive(active: boolean) {
  (window as Window & { __openStagePedalTestModeActive?: boolean }).__openStagePedalTestModeActive = active;
}

function isPedalTestModeActive() {
  return Boolean((window as Window & { __openStagePedalTestModeActive?: boolean }).__openStagePedalTestModeActive);
}

function dispatchTempoGuideToggle() {
  window.dispatchEvent(new Event('openstage:toggle-tempo-guide'));
}

function normalizeKeyEvent(event: KeyboardEvent | React.KeyboardEvent) {
  if (event.code === 'Space') return 'Space';
  if (event.key && event.key.length === 1) return event.key.toUpperCase();
  return event.key || event.code;
}

function matchesSmartFilter(song: Song, filter: string) {
  if (filter === 'all') return true;
  const text = [song.title, song.artist, song.genre, song.vibe, song.tags.join(' '), song.bandNotes, song.notes].join(' ').toLowerCase();
  if (filter === 'acoustic') return text.includes('acoustic') || text.includes('unplugged');
  if (filter === 'capo') return song.capo > 0;
  if (filter === 'female') return text.includes('female') || /female|alto|soprano/i.test(song.vocalRange ?? '');
  if (filter === 'easy') return /easy|beginner|simple/i.test(song.difficulty ?? '');
  if (filter === 'fast') return song.bpm >= 90;
  return true;
}

function downloadText(content: string, fileName: string, type: string) {
  const blob = new Blob([content], { type });
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = fileName;
  link.click();
  URL.revokeObjectURL(link.href);
}

function getMemoryUsage() {
  const performanceWithMemory = performance as Performance & {
    memory?: { usedJSHeapSize: number; jsHeapSizeLimit: number };
  };
  if (!performanceWithMemory.memory) return 'Unavailable';
  const used = Math.round(performanceWithMemory.memory.usedJSHeapSize / 1024 / 1024);
  const limit = Math.round(performanceWithMemory.memory.jsHeapSizeLimit / 1024 / 1024);
  return `${used} MB / ${limit} MB`;
}

type AutoscrollTarget = {
  type: 'stage-scroll' | 'window';
  element: HTMLElement;
};

function resolveAutoscrollTarget(preferred: HTMLDivElement | null): AutoscrollTarget | null {
  const stageElement = preferred ?? (document.querySelector('.stage-scroll') as HTMLElement | null);
  if (stageElement && stageElement.scrollHeight > stageElement.clientHeight + 1) {
    return { type: 'stage-scroll', element: stageElement };
  }

  const scrollingElement = document.scrollingElement as HTMLElement | null;
  if (scrollingElement && scrollingElement.scrollHeight > scrollingElement.clientHeight + 1) {
    return { type: 'window', element: scrollingElement };
  }

  if (stageElement) return { type: 'stage-scroll', element: stageElement };
  if (scrollingElement) return { type: 'window', element: scrollingElement };
  return null;
}

function getAutoscrollMetrics(target: AutoscrollTarget) {
  const scrollTop = target.type === 'window' ? window.scrollY || target.element.scrollTop : target.element.scrollTop;
  const scrollHeight = target.element.scrollHeight;
  const clientHeight = target.type === 'window' ? window.innerHeight : target.element.clientHeight;
  const viewportHeight = window.innerHeight || clientHeight;
  const maxScroll = Math.max(0, scrollHeight - clientHeight);
  return {
    targetType: target.type,
    scrollTopBefore: scrollTop,
    scrollTopAfter: scrollTop,
    scrollHeight,
    clientHeight,
    viewportHeight,
    maxScroll
  };
}

function isAutoscrollTargetConnected(target: AutoscrollTarget) {
  if (target.type === 'window') return Boolean(document.scrollingElement);
  return target.element.isConnected;
}

function emptyAutoscrollMetrics() {
  return {
    targetType: 'none',
    scrollTopBefore: 0,
    scrollTopAfter: 0,
    scrollHeight: 0,
    clientHeight: 0,
    viewportHeight: typeof window === 'undefined' ? 0 : window.innerHeight,
    maxScroll: 0
  };
}

function setAutoscrollScrollTop(target: AutoscrollTarget, scrollTop: number) {
  if (target.type === 'window') {
    window.scrollTo({ top: scrollTop });
    return;
  }
  target.element.scrollTop = scrollTop;
}

function scrollAutoscrollTargetBy(preferred: HTMLDivElement | null, delta: number) {
  const target = resolveAutoscrollTarget(preferred);
  if (!target) return;
  const metrics = getAutoscrollMetrics(target);
  setAutoscrollScrollTop(target, Math.max(0, Math.min(metrics.maxScroll, metrics.scrollTopAfter + delta)));
}

function getAutoscrollSpeedPlan(song: Song | undefined, metrics: ReturnType<typeof getAutoscrollMetrics>, state: PerformanceState): AutoscrollSpeedPlan {
  const readingPaceMultiplier = getReadingPaceMultiplier(state.readingPace ?? 'normal');
  const displayMode = getDisplayModeLabel(state);
  const multiplier = normalizeAutoscrollSpeedMultiplier(state.autoscrollSpeed);
  const portraitSpeedFactor = getAutoscrollPortraitSpeedFactor(state);
  const buildPlan = (
    basePixelsPerSecond: number,
    durationSource: AutoscrollSpeedPlan['durationSource'],
    extra: Partial<AutoscrollSpeedPlan> = {}
  ): AutoscrollSpeedPlan => {
    const compensatedBasePixelsPerSecond = Math.max(autoscrollMinimumBasePixelsPerSecond, basePixelsPerSecond) * portraitSpeedFactor;
    const finalPixelsPerSecond = clampAutoscrollFinalPixelsPerSecond(applyAutoscrollSpeedMultiplier(compensatedBasePixelsPerSecond, multiplier));
    return {
      ...extra,
      pixelsPerSecond: finalPixelsPerSecond,
      basePixelsPerSecond: compensatedBasePixelsPerSecond,
      scrollSpeedMultiplier: multiplier,
      portraitSpeedFactor,
      finalPixelsPerSecond,
      readingPaceMultiplier,
      durationSource,
      displayMode
    };
  };

  if (song?.durationSeconds && song.durationSeconds > 0) {
    const basePixelsPerSecond = calculateAutoscrollPixelsPerSecond(metrics.maxScroll, song.durationSeconds, autoscrollManualBasePixelsPerSecond);
    return buildPlan(basePixelsPerSecond, 'manual-duration', {
      durationSeconds: song.durationSeconds,
      selectedDurationSeconds: song.durationSeconds
    });
  }

  const durationMode = state.autoscrollDurationMode ?? 'manual-duration';
  const shouldUseBpm = durationMode === 'bpm-estimate' || (durationMode !== 'manual-speed' && Boolean(song?.bpm));
  const estimate = shouldUseBpm ? getBpmDurationEstimate(song, metrics, state) : undefined;
  if (estimate) {
    const basePixelsPerSecond = calculateAutoscrollPixelsPerSecond(metrics.maxScroll, estimate.durationSeconds, autoscrollManualBasePixelsPerSecond);
    return buildPlan(basePixelsPerSecond, 'bpm-estimate', {
      durationSeconds: estimate.durationSeconds,
      selectedDurationSeconds: estimate.durationSeconds,
      estimatedBeats: estimate.estimatedBeats,
      estimatedDurationSeconds: estimate.durationSeconds
    });
  }

  return buildPlan(autoscrollManualBasePixelsPerSecond, 'manual-speed');
}

function clampAutoscrollFinalPixelsPerSecond(value: number) {
  if (!Number.isFinite(value)) return autoscrollManualBasePixelsPerSecond;
  return Math.max(autoscrollMinimumFinalPixelsPerSecond, Math.min(autoscrollMaximumFinalPixelsPerSecond, value));
}

function getAutoscrollOrientation(state: PerformanceState): 'portrait' | 'landscape' {
  if (state.portraitMode) return 'portrait';
  if (typeof window !== 'undefined' && window.innerHeight > window.innerWidth) return 'portrait';
  return 'landscape';
}

function getAutoscrollPortraitSpeedFactor(state: PerformanceState) {
  return getAutoscrollOrientation(state) === 'portrait' ? autoscrollPortraitSpeedFactor : 1;
}

function normalizeAutoscrollSpeedMultiplier(value: number | undefined) {
  if (!Number.isFinite(value)) return 1;
  const numeric = Number(value);
  const migrated = numeric > 3 ? numeric / 18 : numeric;
  return Math.max(0.25, Math.min(3, migrated));
}

function getBpmDurationEstimate(song: Song | undefined, metrics: ReturnType<typeof getAutoscrollMetrics>, state: PerformanceState) {
  if (!song?.bpm) return undefined;
  const counts = countAutoscrollSongLines(song);
  return estimateBpmAutoscrollDurationSeconds({
    bpm: song.bpm,
    lyricLineCount: counts.lyricLineCount,
    sectionMarkerCount: counts.sectionMarkerCount,
    maxScroll: metrics.maxScroll,
    clientHeight: metrics.clientHeight,
    scrollHeight: metrics.scrollHeight,
    fontSize: state.fontSize,
    readingPaceMultiplier: getReadingPaceMultiplier(state.readingPace ?? 'normal'),
    portraitMode: state.portraitMode,
    mirroredMode: state.mirroredMode,
    splitScreen: state.splitScreen
  });
}

function countAutoscrollSongLines(song: Song) {
  const lines = song.parsedChordPro?.lines ?? parseChordPro(song.chart).lines;
  return lines.reduce(
    (counts, line) => {
      if (line.type === 'lyrics' && line.raw.trim()) counts.lyricLineCount += 1;
      if (line.type === 'section' && line.boundary === 'start') counts.sectionMarkerCount += 1;
      return counts;
    },
    { lyricLineCount: 0, sectionMarkerCount: 0 }
  );
}

function getReadingPaceMultiplier(pace: ReadingPace) {
  if (pace === 'slower') return 1.2;
  if (pace === 'faster') return 0.85;
  return 1;
}

function getDisplayModeLabel(state: PerformanceState) {
  return [
    state.portraitMode ? 'portrait' : 'landscape',
    state.mirroredMode ? 'mirrored' : 'normal',
    state.splitScreen ? 'columns' : 'single'
  ].join(' / ');
}

function getEffectiveCapo(song: Song, state: PerformanceState) {
  const override = state.capoOverrides?.[song.id];
  return Math.max(0, Math.min(12, override ?? song.capo ?? 0));
}

function updateChordFontSize(
  setState: (next: Partial<PerformanceState>) => void,
  state: PerformanceState,
  chordFontSize: number
) {
  setState(chordFontSizeUpdate(state, chordFontSize));
}

function updateChordVerticalOffset(
  setState: (next: Partial<PerformanceState>) => void,
  state: PerformanceState,
  chordVerticalOffset: number
) {
  setState(chordVerticalOffsetUpdate(state, chordVerticalOffset));
}

function getExternalDisplaySettings(state: PerformanceState) {
  return normalizeExternalDisplaySettings(state.externalDisplay ?? defaultPerformanceState.externalDisplay);
}

function buildSetlistEntries(songIds: string[], songs: Song[]): SetlistEntry[] {
  const songMap = new Map(songs.map((song) => [song.id, song]));
  return songIds.map((songId, order) => ({
    item: { id: `active-${order}-${songId}`, songId, order },
    song: songMap.get(songId)
  }));
}

function createSavedSetlistFromItems(name: string, items: SetlistItem[]): SavedSetlist {
  const now = new Date().toISOString();
  return {
    id: createId('setlist'),
    name,
    songIds: [...items].sort((a, b) => a.order - b.order).map((item) => item.songId),
    createdAt: now,
    updatedAt: now,
    notes: ''
  };
}

function compareSetlistItems(a: SetlistItem, b: SetlistItem, sortBy: SetlistSortMode, songMap: Map<string, Song>) {
  const left = songMap.get(a.songId);
  const right = songMap.get(b.songId);
  if (!left && !right) return a.order - b.order;
  if (!left) return 1;
  if (!right) return -1;

  if (sortBy === 'title') return left.title.localeCompare(right.title);
  if (sortBy === 'artist') return (left.artist || '').localeCompare(right.artist || '') || left.title.localeCompare(right.title);
  if (sortBy === 'key') return (left.key || '').localeCompare(right.key || '') || left.title.localeCompare(right.title);
  if (sortBy === 'bpm') return (left.bpm || 0) - (right.bpm || 0) || left.title.localeCompare(right.title);
  if (sortBy === 'duration') return (left.durationSeconds || 0) - (right.durationSeconds || 0) || left.title.localeCompare(right.title);
  return a.order - b.order;
}

function formatDate(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '-';
  return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
}

function requestFullscreenSafe() {
  const requestFullscreen = document.documentElement.requestFullscreen;
  if (!requestFullscreen) return;
  void requestFullscreen.call(document.documentElement).catch((error) => {
    markStartupError(error);
  });
}

function exitFullscreenSafe() {
  if (!document.exitFullscreen) return;
  void document.exitFullscreen().catch((error) => {
    markStartupError(error);
  });
}

function estimateMetricsFromViewport() {
  const height = Math.max(1, window.innerHeight);
  return {
    targetType: 'window' as const,
    scrollTopBefore: 0,
    scrollTopAfter: 0,
    scrollHeight: Math.max(height, document.documentElement.scrollHeight),
    clientHeight: height,
    viewportHeight: height,
    maxScroll: Math.max(0, document.documentElement.scrollHeight - height)
  };
}

async function filesFromDataTransfer(dataTransfer: DataTransfer) {
  const itemFiles = await Promise.all(
    Array.from(dataTransfer.items ?? []).map(async (item) => {
      const entry = getDroppedEntry(item);
      if (entry) return filesFromEntry(entry);
      const file = item.getAsFile();
      return file ? [file] : [];
    })
  );

  const files = itemFiles.flat();
  return files.length > 0 ? files : Array.from(dataTransfer.files ?? []);
}

type DroppedEntry = {
  isFile: boolean;
  isDirectory: boolean;
  file?: (success: (file: File) => void, error?: (error: DOMException) => void) => void;
  createReader?: () => {
    readEntries: (success: (entries: DroppedEntry[]) => void, error?: (error: DOMException) => void) => void;
  };
};

function getDroppedEntry(item: DataTransferItem): DroppedEntry | null {
  const maybeItem = item as DataTransferItem & { webkitGetAsEntry?: () => DroppedEntry | null };
  return maybeItem.webkitGetAsEntry?.() ?? null;
}

async function filesFromEntry(entry: DroppedEntry): Promise<File[]> {
  if (entry.isFile && entry.file) {
    return new Promise((resolve) => entry.file?.((file) => resolve([file]), () => resolve([])));
  }

  if (!entry.isDirectory || !entry.createReader) return [];

  const reader = entry.createReader();
  const entries: DroppedEntry[] = [];
  let batch: DroppedEntry[] = [];

  do {
    batch = await new Promise<DroppedEntry[]>((resolve) => {
      reader.readEntries((children) => resolve(children), () => resolve([]));
    });
    entries.push(...batch);
  } while (batch.length > 0);

  const childFiles = await Promise.all(entries.map(filesFromEntry));
  return childFiles.flat();
}
