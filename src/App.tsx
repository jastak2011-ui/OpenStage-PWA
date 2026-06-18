import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import {
  AlertTriangle,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  ChevronsDown,
  CheckCircle,
  Download,
  Expand,
  FileJson,
  Gauge,
  GripVertical,
  Library,
  ListMusic,
  LogIn,
  Lock,
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
  Sparkles,
  Star,
  Sun,
  Trash2,
  Unlock,
  Upload,
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
import { lyricTextHarmonyState, renderLyricTextWithHarmony } from './components/LyricTextWithHarmony';
import { parseCsvSongs, parseJsonSongs, songsToCsv, songsToJson } from './lib/importExport';
import { chordOverTextToAnchoredLine, chordTokensToAnchoredLine, inlineChordsToChordOverLyrics, type AnchoredChordLine } from './lib/chordLayout';
import { isChordProFileName, parseChordPro, parseChordProBundle } from './lib/chordpro';
import {
  advanceVirtualScrollTop,
  calculateAutoscrollPixelsPerSecond,
  detectAutoscrollHeartbeatStall,
  estimateBpmAutoscrollDurationSeconds
} from './lib/autoscroll';
import { formatDuration, isValidDurationInput, parseDurationInput } from './lib/format';
import { getStageSwipeDirection } from './lib/stageGestures';
import { createId } from './lib/ids';
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
import { markHarmonyRange, removeHarmonyRange, type HarmonyRange } from './lib/harmony';
import { isOnSongArchiveFileName, parseOnSongArchive } from './lib/onsongArchive';
import { createPortableBackup, restorePortableBackup, saveLocalCheckpoint } from './services/backup/backupService';
import { reportError } from './services/errors/errorService';
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
import { cloudBackup, syncLibraryOfflineFirst } from './services/sync/syncEngine';
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

type SetlistSortMode = 'manual' | 'title' | 'artist' | 'key' | 'bpm' | 'duration';
type StagePopoverName = 'library' | 'setlists' | 'format' | 'more';
type StageFormatTab = 'document' | 'format' | 'chords' | 'harmony' | 'sections' | 'display' | 'autoscroll' | 'external';

type ToastState = {
  message: string;
  type: 'success' | 'error' | 'info';
} | null;

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
  maxScroll: number;
  durationSeconds?: number;
  pixelsPerSecond: number;
  bpm?: number;
  estimatedBeats?: number;
  estimatedDurationSeconds?: number;
  readingPaceMultiplier: number;
  displayMode: string;
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

type AutoscrollController = {
  active: boolean;
  loopId: number;
  rafId: number | null;
  target: AutoscrollTarget | null;
  virtualScrollTop: number;
  previousScrollTop: number;
  pixelsPerSecond: number;
  durationSeconds?: number;
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
  durationSeconds?: number;
  estimatedBeats?: number;
  estimatedDurationSeconds?: number;
  readingPaceMultiplier: number;
  durationSource: 'manual-duration' | 'bpm-estimate' | 'manual-speed';
  displayMode: string;
};

const speedPresets: Record<Exclude<AutoscrollPreset, 'custom'>, number> = {
  slow: 10,
  medium: 18,
  fast: 30
};

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
    lyricFontSize: 24,
    chordFontSize: 14,
    titleFontSize: 30,
    artistFontSize: 18,
    sectionFontSize: 22,
    headerFontSize: 12,
    lineSpacing: 0.95,
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
  chart: '[C]Start writing your [F]chart here\n[Am]Use inline chords like [G]this',
  favorite: false,
  displayPreference: 'inline',
  rawChordPro: '[C]Start writing your [F]chart here\n[Am]Use inline chords like [G]this',
  parsedChordPro: undefined,
  updatedAt: new Date().toISOString()
});

function withSongDefaults(song: Song): Song {
  return {
    ...song,
    favorite: Boolean(song.favorite)
  };
}

export default function App() {
  if (isExternalPrompterRoute()) return <ExternalPrompterApp />;

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
  const [query, setQuery] = useState('');
  const [smartFilter, setSmartFilter] = useState('all');
  const [quickEdit, setQuickEdit] = useState(false);
  const [countdownRemaining, setCountdownRemaining] = useState(0);
  const [navigationContext, setNavigationContext] = useState<NavigationContext>('library');
  const [editorReturnMode, setEditorReturnMode] = useState<StageMode>('library');
  const [toast, setToast] = useState<ToastState>(null);
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
    maxScroll: 0,
    durationSeconds: undefined,
    pixelsPerSecond: 0,
    bpm: undefined,
    estimatedBeats: undefined,
    estimatedDurationSeconds: undefined,
    readingPaceMultiplier: 1,
    displayMode: 'landscape',
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
    durationSeconds: undefined,
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
  const scrollSaveFrameRef = useRef<number | null>(null);
  const scrollSaveTimeoutRef = useRef<number | null>(null);
  const pendingScrollPositionRef = useRef<{ songId: string; scrollTop: number } | null>(null);
  const restoredScrollSongRef = useRef('');

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
  const isStageSurface = activeMode === 'perform' || activeMode === 'stage';
  const selectedEffectiveCapo = selectedSong ? getEffectiveCapo(selectedSong, performanceState) : 0;

  useEffect(() => {
    performanceStateRef.current = performanceState;
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
      const target = event.target as HTMLElement | null;
      if (target?.matches('input, textarea, select')) return;
      const mappings = performanceState.pedalMappings;

      if (matchesPedal(event, mappings.toggleAutoscroll)) {
        event.preventDefault();
        toggleAutoscroll();
      }
      if (matchesPedal(event, mappings.scrollDown)) {
        event.preventDefault();
        scrollAutoscrollTargetBy(stageRef.current, Math.max(80, performanceState.fontSize * 4));
      }
      if (matchesPedal(event, mappings.scrollUp)) {
        event.preventDefault();
        scrollAutoscrollTargetBy(stageRef.current, -Math.max(80, performanceState.fontSize * 4));
      }
      if (matchesPedal(event, mappings.nextSong)) {
        event.preventDefault();
        moveSelectedSong(1);
      }
      if (matchesPedal(event, mappings.previousSong)) {
        event.preventDefault();
        moveSelectedSong(-1);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [orderedSetlist, performanceState.fontSize, performanceState.pedalMappings, selectedSongId]);

  async function loadData() {
    const [storedSongs, storedSetlist, storedSavedSetlists] = await Promise.all([
      db.songs.orderBy('title').toArray(),
      db.setlist.orderBy('order').toArray(),
      db.setlists.orderBy('updatedAt').reverse().toArray()
    ]);
    setSongs(storedSongs.map(withSongDefaults));
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
      const nextCapo = Math.max(0, Math.min(12, Number(song.capo ?? 0) || 0));
      const nextSong = {
        ...song,
        favorite: Boolean(song.favorite),
        capo: nextCapo,
        bpm: Number(song.bpm ?? 0) || 0,
        rawChordPro: song.chart,
        parsedChordPro: parseChordPro(song.chart),
        updatedAt: new Date().toISOString()
      };
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

  function selectStageLibrarySong(songId: string) {
    setActiveSetlistId(null);
    setNavigationContext('library');
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
    updateStorePerformance({
      autoscrollPreset: preset,
      autoscrollSpeed: preset === 'custom' ? performanceState.autoscrollSpeed : speedPresets[preset]
    });
  }

  function updateAutoscrollSpeed(speed: number) {
    updateStorePerformance({ autoscrollPreset: 'custom', autoscrollSpeed: speed });
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

  function saveStageScroll(songId: string, scrollTop: number) {
    pendingScrollPositionRef.current = { songId, scrollTop };
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
      bpm: selectedSong?.bpm,
      estimatedBeats: controller.estimatedBeats,
      estimatedDurationSeconds: controller.estimatedDurationSeconds,
      readingPaceMultiplier: controller.readingPaceMultiplier,
      durationSource: controller.durationSource,
      displayMode: controller.displayMode,
      pixelsPerSecond: controller.pixelsPerSecond,
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
    setIsAutoscrolling(false);
    updateAutoscrollDebugFromController(reason === 'user-paused' ? 'paused' : 'stopped', reason);
    flushStageScrollSave();
    if (message) setToast({ message, type: reason === 'reached-end' || reason === 'no-overflow' ? 'info' : 'error' });
  }

  function applyAutoscrollSpeedPlan(controller: AutoscrollController, plan: AutoscrollSpeedPlan) {
    controller.pixelsPerSecond = plan.pixelsPerSecond;
    controller.durationSeconds = plan.durationSeconds;
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
      setToast({ message: 'No scroll target found', type: 'error' });
      controller.target = null;
      updateAutoscrollDebugFromController('no target', 'no-scroll-target');
      return;
    }

    const before = getAutoscrollMetrics(target);
    const speedPlan = getAutoscrollSpeedPlan(selectedSong, before, performanceState);
    if (speedPlan.durationSource === 'manual-duration' && speedPlan.pixelsPerSecond <= 0) {
      setToast({ message: 'Invalid duration for autoscroll', type: 'error' });
      controller.target = target;
      applyAutoscrollSpeedPlan(controller, speedPlan);
      updateAutoscrollDebugFromController('invalid duration', 'invalid-duration');
      return;
    }

    if (before.maxScroll <= 0) {
      controller.target = target;
      controller.maxScroll = before.maxScroll;
      applyAutoscrollSpeedPlan(controller, speedPlan);
      stopAutoscroll('no-overflow', 'Song fits on screen - nothing to scroll');
      return;
    }

    const loopId = controller.loopId;
    const now = performance.now();
    controller.active = true;
    controller.target = target;
    controller.virtualScrollTop = before.scrollTopAfter;
    controller.previousScrollTop = before.scrollTopAfter;
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

      const elapsedSeconds =
        activeController.lastFrameTimestamp === null ? 0 : Math.min((timestamp - activeController.lastFrameTimestamp) / 1000, 0.12);
      activeController.lastFrameTimestamp = timestamp;
      const previousScrollTop = activeController.virtualScrollTop;
      const next = advanceVirtualScrollTop(activeController.virtualScrollTop, elapsedSeconds, activeController.pixelsPerSecond, activeController.maxScroll);
      activeController.virtualScrollTop = next.nextScrollTop;
      activeController.previousScrollTop = previousScrollTop;
      setAutoscrollScrollTop(currentTarget, activeController.virtualScrollTop);
      activeController.frameCount += 1;
      if (Math.abs(activeController.virtualScrollTop - previousScrollTop) > 0.01) {
        activeController.lastScrollChangeAtMs = performance.now();
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
          bpm: selectedSong?.bpm,
          estimatedBeats: activeController.estimatedBeats,
          estimatedDurationSeconds: activeController.estimatedDurationSeconds,
          readingPaceMultiplier: activeController.readingPaceMultiplier,
          durationSource: activeController.durationSource,
          displayMode: activeController.displayMode,
          pixelsPerSecond: activeController.pixelsPerSecond,
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

  async function importChordProCandidates(candidates: ImportCandidate[], strategy: DuplicateStrategy) {
    const existingByFingerprint = new Map(songs.map((song) => [songFingerprint(song), song]));
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
            const fingerprint = songFingerprint(parsed.song);
            const existing = existingByFingerprint.get(fingerprint);

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

            const songToStore = existing && strategy === 'replace' ? { ...parsed.song, id: existing.id } : parsed.song;
            if (existing) {
              summary.duplicateWarnings.push(
                `${parsed.song.title}: ${strategy === 'replace' ? 'replaced' : 'imported another copy of'} "${existing.title}".`
              );
            }

            importedSongs.push(songToStore);
            existingByFingerprint.set(fingerprint, songToStore);
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
        const fingerprint = songFingerprint(parsed.song);
        const existing = existingByFingerprint.get(fingerprint);

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

        const songToStore = existing && strategy === 'replace' ? { ...parsed.song, id: existing.id } : parsed.song;
        if (existing) {
          summary.duplicateWarnings.push(
            `${parsed.song.title}: ${strategy === 'replace' ? 'replaced' : 'imported another copy of'} "${existing.title}".`
          );
        }

        importedSongs.push(songToStore);
        existingByFingerprint.set(fingerprint, songToStore);
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

  return (
    <div className={`min-h-screen ${isStageSurface ? getStageTheme(performanceState.stageTheme).className : 'bg-slate-100 text-slate-950'}`}>
      <header className={`${isStageSurface ? 'hidden' : 'sticky'} top-0 z-30 border-b border-slate-300 bg-slate-950 text-white`}>
        <div className="flex min-h-16 flex-wrap items-center gap-3 px-4 py-3">
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
            <ModeButton icon={<Settings size={17} />} label="Pedals" mode="pedals" active={activeMode} setActive={setActiveMode} />
            <ModeButton icon={<Settings size={17} />} label="Settings" mode="settings" active={activeMode} setActive={setActiveMode} />
            <ModeButton icon={<Gauge size={17} />} label="Diagnostics" mode="diagnostics" active={activeMode} setActive={setActiveMode} />
          </nav>
          <div className="ml-auto flex flex-wrap items-center gap-2">
            <button className="icon-button" title="New song" onClick={() => saveSong(emptySong())}>
              <Plus size={18} />
            </button>
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
      </header>

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

      {activeMode === 'settings' && (
        <SettingsView
          state={performanceState}
          setState={updatePerformanceState}
          setPreset={updateAutoscrollPreset}
          setAutoscrollSpeed={updateAutoscrollSpeed}
          onExportBackup={exportBackup}
          onRestoreBackup={restoreBackup}
          onSyncNow={syncNow}
          onCloudBackup={async () => {
            try {
              setStoreSyncStatus('syncing');
              await cloudBackup();
              setStoreSyncStatus('idle');
            } catch (error) {
              setStoreSyncStatus('error');
              reportError('Cloud backup failed', error);
            }
          }}
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
        />
      )}

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
          onSelectStageSong={selectStageLibrarySong}
          onToggleFavorite={toggleSongFavorite}
          onRunStageSetlist={runSavedSetlist}
          onDiagnostics={() => setActiveMode('diagnostics')}
          onPedals={() => setActiveMode('pedals')}
          onImportExport={() => setActiveMode('import')}
          onSync={() => setActiveMode('settings')}
          onExit={() => setActiveMode('library')}
          onChangeSongCapo={(capo) => updateSongCapo(selectedSong.id, capo)}
          onToggleDisplayPreference={() =>
            saveSong({
              ...selectedSong,
              displayPreference: selectedSong.displayPreference === 'chords-over' ? 'inline' : 'chords-over'
            })
          }
          onScroll={(scrollTop) => saveStageScroll(selectedSong.id, scrollTop)}
          countdownRemaining={countdownRemaining}
        />
      )}

      {activeMode === 'stage' && selectedSong && (
        <PerformanceView
          song={selectedSong}
          songs={songs}
          savedSetlists={savedSetlists}
          entries={orderedSetlist}
          stageRef={stageRef}
          nextSong={nextNavigationSong}
          previousSong={previousNavigationSong}
          navigationLabel={activeNavigationContext === 'setlist' ? `Setlist: ${activeSavedSetlist?.name ?? 'Setlist'}` : 'Library Mode'}
          navigationPosition={activeNavigationContext === 'setlist' ? `${activeNavigationIndex + 1} of ${activeNavigationSongs.length}` : `${activeNavigationIndex + 1}/${activeNavigationSongs.length}`}
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
          onSelectStageSong={selectStageLibrarySong}
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
          onToggleDisplayPreference={() =>
            saveSong({
              ...selectedSong,
              displayPreference: selectedSong.displayPreference === 'chords-over' ? 'inline' : 'chords-over'
            })
          }
          onScroll={(scrollTop) => saveStageScroll(selectedSong.id, scrollTop)}
          countdownRemaining={countdownRemaining}
          stageSetlistMode
        />
      )}

      {!isStageSurface && <footer className="border-t border-slate-300 bg-white px-4 py-2 text-xs text-slate-600">
        IndexedDB offline storage active. Supabase sync: {syncState}
        {syncEmail ? ` as ${syncEmail}` : supabase ? ', signed out' : ''}.
      </footer>}
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
    <div className={`fixed bottom-5 left-1/2 z-[70] -translate-x-1/2 rounded-md border px-4 py-3 text-sm font-semibold shadow-xl ${tone}`}>
      {toast.message}
    </div>
  );
}

function ImportSongsView({
  songs,
  onImport,
  onJsonCsvImport
}: {
  songs: Song[];
  onImport: (files: ImportCandidate[], strategy: DuplicateStrategy) => Promise<ImportSummary>;
  onJsonCsvImport: (file: File) => Promise<void>;
}) {
  const [strategy, setStrategy] = useState<DuplicateStrategy>('skip');
  const [pendingFiles, setPendingFiles] = useState<ImportCandidate[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [summary, setSummary] = useState<ImportSummary | null>(null);

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
  const actions: Array<{ action: PedalAction; label: string; hint: string }> = [
    { action: 'nextSong', label: 'Next song', hint: 'Common pedals: ArrowRight, PageDown' },
    { action: 'previousSong', label: 'Previous song', hint: 'Common pedals: ArrowLeft, PageUp' },
    { action: 'toggleAutoscroll', label: 'Pause / resume autoscroll', hint: 'Common pedals: Space, Enter' },
    { action: 'scrollDown', label: 'Scroll down', hint: 'Common pedals: ArrowDown' },
    { action: 'scrollUp', label: 'Scroll up', hint: 'Common pedals: ArrowUp' }
  ];

  function updateAction(action: PedalAction, keys: string[]) {
    onChange({ ...mappings, [action]: keys });
  }

  return (
    <main className="min-h-[calc(100vh-105px)] p-4">
      <div className="mx-auto max-w-4xl">
        <div className="mb-4 flex flex-wrap items-center gap-3">
          <div>
            <h2 className="text-xl font-semibold">Pedal Configuration</h2>
            <p className="mt-1 text-sm text-slate-600">Map Bluetooth pedals, USB pedals, and page up/down devices to stage actions.</p>
          </div>
          <button className="secondary-button ml-auto" onClick={onReset}>
            <RotateCcw size={18} />
            Reset defaults
          </button>
        </div>

        <div className="grid gap-3">
          {actions.map(({ action, label, hint }) => (
            <section key={action} className="rounded-md border border-slate-300 bg-white p-4">
              <div className="grid gap-3 md:grid-cols-[1fr_1.4fr] md:items-center">
                <div>
                  <h3 className="font-semibold">{label}</h3>
                  <p className="mt-1 text-sm text-slate-600">{hint}</p>
                </div>
                <KeyCapture
                  keys={mappings[action] ?? []}
                  onChange={(keys) => updateAction(action, keys)}
                />
              </div>
            </section>
          ))}
        </div>
      </div>
    </main>
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
  onCloudBackup,
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
  onCloudBackup: () => void;
  onPedals: () => void;
  onImport: () => void;
  syncStatus: string;
  conflicts: SyncConflict[];
}) {
  return (
    <main className="min-h-[calc(100vh-105px)] p-4">
      <div className="mx-auto grid max-w-5xl gap-4 md:grid-cols-2">
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
        <SettingsCard title="Sync Foundation">
          <p className="text-sm text-slate-600">Offline-first Supabase sync with conflict detection and cloud backup hooks.</p>
          <div className="mt-3 flex flex-wrap gap-2">
            <button className="primary-button" onClick={onSyncNow}>Sync now</button>
            <button className="secondary-button" onClick={onCloudBackup}>Cloud backup</button>
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
              <button key={theme.name} className="secondary-button justify-start" onClick={() => setState({ stageTheme: theme.name, theme: theme.name.includes('light') || theme.name === 'outdoor' ? 'light' : 'dark' })}>
                {theme.label}
              </button>
            ))}
          </div>
        </SettingsCard>
      </div>
    </main>
  );
}

function SettingsCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="rounded-md border border-slate-300 bg-white p-4">
      <h2 className="mb-3 text-lg font-semibold">{title}</h2>
      {children}
    </section>
  );
}

function DiagnosticsView({
  diagnostics,
  logs,
  syncStatus,
  conflicts,
  onClearLogs
}: {
  diagnostics: RenderDiagnostics;
  logs: AppLogEntry[];
  syncStatus: string;
  conflicts: SyncConflict[];
  onClearLogs: () => void;
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

function KeyCapture({ keys, onChange }: { keys: string[]; onChange: (keys: string[]) => void }) {
  const [isCapturing, setIsCapturing] = useState(false);

  return (
    <div className="grid gap-2">
      <div className="flex flex-wrap gap-2">
        {keys.map((key) => (
          <button
            key={key}
            className="rounded-md border border-slate-300 bg-slate-50 px-3 py-2 text-sm font-semibold"
            onClick={() => onChange(keys.filter((item) => item !== key))}
          >
            {key}
          </button>
        ))}
        {keys.length === 0 && <span className="text-sm text-slate-500">No keys mapped.</span>}
      </div>
      <button
        className="primary-button w-fit"
        onClick={() => setIsCapturing(true)}
        onKeyDown={(event) => {
          if (!isCapturing) return;
          event.preventDefault();
          const normalized = normalizeKeyEvent(event.nativeEvent);
          if (normalized && !keys.includes(normalized)) onChange([...keys, normalized]);
          setIsCapturing(false);
        }}
      >
        <Settings size={18} />
        {isCapturing ? 'Press pedal or key' : 'Add mapping'}
      </button>
    </div>
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

function LibraryView({
  songs,
  query,
  setQuery,
  smartFilter,
  setSmartFilter,
  onSelect,
  onToggleFavorite
}: {
  songs: Song[];
  query: string;
  setQuery: (query: string) => void;
  smartFilter: string;
  setSmartFilter: (filter: string) => void;
  onSelect: (id: string) => void;
  onToggleFavorite: (id: string) => void;
}) {
  const [visibleCount, setVisibleCount] = useState(80);
  const visibleSongs = songs.slice(0, visibleCount);

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
  setPerformanceState
}: {
  song: Song;
  songs: Song[];
  onSave: (song: Song) => void | Promise<void>;
  onCancel: () => void;
  onDelete: (id: string) => void | Promise<void>;
  onAddToSetlist: (id: string) => void;
  performanceState: PerformanceState;
  setPerformanceState: (next: Partial<PerformanceState>) => void;
}) {
  const [draft, setDraft] = useState<Song>(song);
  const [durationDraft, setDurationDraft] = useState('');
  const [durationError, setDurationError] = useState('');
  const [conversionPreview, setConversionPreview] = useState('');
  const [enrichment, setEnrichment] = useState<EnrichmentResult | null>(null);
  const [enrichmentStatus, setEnrichmentStatus] = useState('');
  const [enrichmentError, setEnrichmentError] = useState('');
  const [detailsOpen, setDetailsOpen] = useState(false);
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
  }, [song]);

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

  return (
    <main className="min-h-[calc(100vh-105px)] bg-slate-100 p-4 text-slate-950">
      <section className="mx-auto max-w-6xl">
        <div className="sticky top-[4.5rem] z-20 mb-4 flex flex-wrap items-center gap-2 rounded-md border border-slate-300 bg-white/95 p-2 shadow-sm backdrop-blur">
          <button className="secondary-button h-10" type="button" onClick={onCancel}>
            <ChevronLeft size={18} />
            Back to Library
          </button>
          <button className="primary-button h-10" type="submit" form="song-editor-form">
            <Save size={18} />
            Save
          </button>
          <button className="secondary-button h-10" type="button" onClick={onCancel}>
            Cancel
          </button>
          <h2 className="ml-auto text-sm font-semibold text-slate-600 sm:text-base">Song Editor</h2>
        </div>
          <form
            id="song-editor-form"
            className="mx-auto grid max-w-6xl gap-4"
            onSubmit={(event) => {
              event.preventDefault();
              const parsedDuration = parseDurationInput(durationDraft);
              if (durationDraft.trim() && parsedDuration === undefined) {
                setDurationError('Use formats like 3:45 or 1:02:30');
                return;
              }
              onSave({ ...draft, durationSeconds: parsedDuration });
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
              <button className="secondary-button" type="button" onClick={onCancel}>
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
  onSelectStageSong,
  onToggleFavorite,
  onRunStageSetlist,
  onDiagnostics,
  onPedals,
  onImportExport,
  onSync,
  onExit,
  onChangeSongCapo,
  onToggleDisplayPreference,
  onScroll,
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
  onSelectStageSong: (songId: string) => void;
  onToggleFavorite: (songId: string) => void;
  onRunStageSetlist: (setlist: SavedSetlist) => void;
  onDiagnostics: () => void;
  onPedals: () => void;
  onImportExport: () => void;
  onSync: () => void;
  onExit: () => void;
  onChangeSongCapo: (capo: number) => void;
  onToggleDisplayPreference: () => void;
  onScroll: (scrollTop: number) => void;
  countdownRemaining: number;
  stageSetlistMode?: boolean;
}) {
  const effectiveCapo = getEffectiveCapo(song, state);
  const externalDisplaySettings = getExternalDisplaySettings(state);
  const lyricFontSize = getEffectiveLyricFontSize(state);
  const lineSpacing = getEffectiveLineSpacing(state);
  const headerFontSize = getEffectiveHeaderFontSize(state);
  const chordFontSize = getEffectiveChordFontSize(state);
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
  const swipeStartRef = useRef<{ x: number; y: number; target: EventTarget | null } | null>(null);
  const stageTheme = getStageTheme(state.stageTheme);
  const stageBackground = stageTheme.className;
  const chordVerticalOffset = getEffectiveChordVerticalOffset(state);
  const chordFontColor = getEffectiveChordFontColor(state);
  const chordHighlightColor = getEffectiveChordHighlightColor(state);
  const boldChords = getEffectiveBoldChords(state);
  const italicChords = getEffectiveItalicChords(state);
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
  const autoscrollStatus = isAutoscrolling ? 'Running' : autoscrollDebug.stopReason === 'none' || autoscrollDebug.stopReason === 'user-paused' ? 'Paused' : 'Stopped';
  const isWarmTheme = state.stageTheme === 'coffeehouse';
  const headerText = isWarmTheme ? 'text-[#f4ead2]' : state.theme === 'dark' ? 'text-slate-100' : 'text-slate-950';
  const mutedText = isWarmTheme ? 'text-[#cdbb96]' : state.theme === 'dark' ? 'text-slate-400' : 'text-slate-600';
  const menuSurface = isWarmTheme ? 'border-[#5b452f] bg-[#1b130e]/95 text-[#f4ead2]' : 'border-slate-700 bg-slate-950/95 text-slate-100';
  const toolbarButton = isWarmTheme ? 'border-[#8c6b38] bg-[#2a1d14]/80 text-[#f4ead2] hover:bg-[#3a281b]' : 'border-slate-700 bg-slate-900/80 text-slate-100 hover:bg-slate-800';

  const revealMenu = useCallback(() => {
    setToolbarVisible(true);
    setCursorHidden(false);
  }, []);
  const togglePopover = useCallback((popover: StagePopoverName) => {
    setToolbarVisible(true);
    setActivePopover((current) => current === popover ? null : popover);
  }, []);
  const openFormatPopover = useCallback((tab: StageFormatTab = 'format') => {
    setFormatTab(tab);
    setToolbarVisible(true);
    setActivePopover((current) => current === 'format' ? null : 'format');
  }, []);
  const handleStageTouchStart = useCallback((event: React.TouchEvent<HTMLDivElement>) => {
    if (activePopover || isInteractiveSwipeTarget(event.target)) {
      swipeStartRef.current = null;
      return;
    }
    const touch = event.touches[0];
    swipeStartRef.current = touch ? { x: touch.clientX, y: touch.clientY, target: event.target } : null;
  }, [activePopover]);
  const handleStageTouchEnd = useCallback((event: React.TouchEvent<HTMLDivElement>) => {
    const start = swipeStartRef.current;
    swipeStartRef.current = null;
    if (!start || activePopover || isInteractiveSwipeTarget(start.target) || isInteractiveSwipeTarget(event.target)) return;

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
  }, [activePopover, onNext, onPrevious]);

  useEffect(() => {
    if (activePopover) return;
    const timer = window.setTimeout(() => {
      setToolbarVisible(false);
      setCursorHidden(true);
    }, 5000);
    return () => window.clearTimeout(timer);
  }, [activePopover, toolbarVisible]);

  return (
    <main
      className={`stage-shell stage-profile-${state.activeProfile} relative h-screen overflow-hidden transition-colors duration-300 ${stageBackground} ${cursorHidden && !activePopover ? 'cursor-none' : ''}`}
      data-stage-profile={state.activeProfile}
      style={{ background: documentTheme.background, color: documentTheme.text, fontFamily: stageFontFamily }}
      onPointerMove={revealMenu}
      onPointerDown={revealMenu}
    >
      <header
        className={`stage-top-toolbar fixed left-0 right-0 top-0 z-40 transition-opacity duration-300 ${toolbarVisible || activePopover ? 'opacity-100' : 'pointer-events-none opacity-0'} ${state.minimalStageMode ? 'opacity-0' : ''}`}
        style={{ paddingTop: 'max(0.75rem, env(safe-area-inset-top))' }}
      >
        <div className={`stage-toolbar-inner mx-auto grid max-w-7xl grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-3 px-3 sm:px-5 ${headerText}`} style={{ fontSize: `${headerFontSize}px`, color: documentTheme.text, fontFamily: stageFontFamily }}>
          <div className="stage-left-actions flex items-center gap-1 rounded-full border border-white/10 bg-black/25 p-1 backdrop-blur-md">
            <StageIconButton icon={<Library size={19} />} label="Library" tone={toolbarButton} active={activePopover === 'library'} onClick={() => togglePopover('library')} />
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
            <span className="stage-secondary-action inline-flex">
              <StageIconButton icon={<Pencil size={19} />} label="Edit Song" tone={toolbarButton} onClick={onEdit} />
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
        className={`pointer-events-none fixed right-4 top-24 z-20 grid gap-1 rounded-md border border-white/10 bg-black/20 px-3 py-2 text-right font-semibold leading-tight backdrop-blur-sm transition-opacity duration-300 sm:right-6 ${toolbarVisible || activePopover ? 'opacity-100' : 'opacity-0'} ${headerText}`}
        style={{ fontSize: `${headerFontSize}px`, color: documentTheme.text, fontFamily: stageFontFamily }}
      >
        <div style={{ fontSize: '0.78em' }}>Key {song.key || '-'}</div>
        <div style={{ fontSize: '0.78em' }}>Capo {effectiveCapo}</div>
      </div>

      {activePopover && (
        <div className="fixed inset-0 z-30" onClick={() => setActivePopover(null)}>
          <StageControlPopover
            active={activePopover}
            formatTab={formatTab}
            setFormatTab={setFormatTab}
            menuSurface={menuSurface}
            songs={songs}
            savedSetlists={savedSetlists}
            currentSongId={song.id}
            state={state}
            setState={setState}
            setPreset={setPreset}
            setAutoscrollSpeed={setAutoscrollSpeed}
            onCalculateDuration={onCalculateDuration}
            isAutoscrolling={isAutoscrolling}
            onToggleAutoscroll={onToggleAutoscroll}
            onSelectStageSong={(songId) => {
              onSelectStageSong(songId);
              setActivePopover(null);
            }}
            onToggleFavorite={onToggleFavorite}
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
            onEdit={onEdit}
            onOpenExternalDisplay={() => openFormatPopover('external')}
            onStageMode={onStageMode}
            onSettings={onSettings}
            onDiagnostics={onDiagnostics}
            onPedals={onPedals}
            onImportExport={onImportExport}
            onSync={onSync}
          />
        </div>
      )}

      <div className={`pointer-events-none absolute bottom-5 left-5 z-20 rounded-full px-3 py-1 text-xs font-semibold transition-opacity duration-300 ${isAutoscrolling ? 'bg-teal-500/15 text-teal-200' : 'bg-black/20 text-slate-300'}`}>
        Autoscroll {autoscrollStatus}
      </div>
      <div
        className={`fixed z-40 transition-opacity duration-300 ${toolbarVisible || activePopover ? 'opacity-100' : 'pointer-events-none opacity-0'}`}
        style={{
          right: 'max(1.25rem, env(safe-area-inset-right))',
          bottom: 'max(1.25rem, env(safe-area-inset-bottom))'
        }}
      >
        <button
          className={`stage-autoscroll-float ${isAutoscrolling ? 'stage-autoscroll-running' : 'stage-autoscroll-paused'}`}
          type="button"
          title={isAutoscrolling ? 'Pause Autoscroll' : 'Start Autoscroll'}
          aria-label={isAutoscrolling ? 'Pause Autoscroll' : 'Start Autoscroll'}
          onClick={(event) => {
            event.stopPropagation();
            onToggleAutoscroll();
          }}
        >
          {isAutoscrolling ? <Pause size={20} /> : <ChevronsDown size={21} />}
        </button>
      </div>
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
          style={{ fontSize: `${lyricFontSize}px`, lineHeight: state.portraitMode ? 1.62 : 1.52, color: documentTheme.text, fontFamily: stageFontFamily }}
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

function ExternalDisplayControls({
  state,
  setState
}: {
  state: PerformanceState;
  setState: (next: Partial<PerformanceState>) => void;
}) {
  const settings = getExternalDisplaySettings(state);
  const [status, setStatus] = useState('');
  const updateSettings = (next: Partial<PerformanceState['externalDisplay']>) =>
    setState({ externalDisplay: { ...settings, ...next } });
  const activateAirPlayPortrait = () => setState({ externalDisplay: appleTvPortraitPrompterSettings(settings) });
  const outputStatus = status || (settings.enabled ? 'External output connected' : 'Open the external output first to preview changes.');

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

  return (
    <div className="grid gap-3 rounded-md border border-slate-700 bg-slate-950 p-3 text-xs">
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

function StageControlPopover({
  active,
  formatTab,
  setFormatTab,
  menuSurface,
  songs,
  savedSetlists,
  currentSongId,
  state,
  setState,
  setPreset,
  setAutoscrollSpeed,
  onCalculateDuration,
  isAutoscrolling,
  onToggleAutoscroll,
  onSelectStageSong,
  onToggleFavorite,
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
  onDiagnostics,
  onPedals,
  onImportExport,
  onSync
}: {
  active: StagePopoverName;
  formatTab: StageFormatTab;
  setFormatTab: (tab: StageFormatTab) => void;
  menuSurface: string;
  songs: Song[];
  savedSetlists: SavedSetlist[];
  currentSongId: string;
  state: PerformanceState;
  setState: (next: Partial<PerformanceState>) => void;
  setPreset: (preset: AutoscrollPreset) => void;
  setAutoscrollSpeed: (speed: number) => void;
  onCalculateDuration: () => void;
  isAutoscrolling: boolean;
  onToggleAutoscroll: () => void;
  onSelectStageSong: (songId: string) => void;
  onToggleFavorite: (songId: string) => void;
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
  onDiagnostics: () => void;
  onPedals: () => void;
  onImportExport: () => void;
  onSync: () => void;
}) {
  const [libraryQuery, setLibraryQuery] = useState('');
  const [selectedDisplayProfile, setSelectedDisplayProfile] = useState<DeviceProfile>(state.activeProfile);
  const [profileMessage, setProfileMessage] = useState('');
  const popoverPosition = active === 'library' || active === 'setlists' ? 'left-3 sm:left-5' : 'right-3 sm:right-5';
  const documentTheme = getDocumentThemePreset(getEffectiveDocumentTheme(state));
  const stageFontFamily = resolveStageFontFamily(getEffectiveStageFontFamily(state));
  const chordFontFamily = getEffectiveUseMonospaceChords(state) ? 'Consolas, "Courier New", monospace' : stageFontFamily;
  const previewChordColor = resolveChordFontColor(getEffectiveChordFontColor(state));
  const currentStageSong = songs.find((song) => song.id === currentSongId);
  const filteredStageSongs = useMemo(() => {
    const query = libraryQuery.trim().toLowerCase();
    const matches = !query
      ? songs
      : songs.filter((song) =>
        [song.title, song.artist, song.key, String(song.bpm || ''), song.tags.join(' ')]
        .join(' ')
        .toLowerCase()
        .includes(query)
      );
    return [...matches].sort((left, right) => {
      if (Boolean(left.favorite) !== Boolean(right.favorite)) return left.favorite ? -1 : 1;
      return left.title.localeCompare(right.title);
    });
  }, [libraryQuery, songs]);
  const favoriteStageSongs = filteredStageSongs.filter((song) => song.favorite);
  const regularStageSongs = filteredStageSongs.filter((song) => !song.favorite);
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

  function applySelectedProfile() {
    setState(applyDisplayProfilePatch(state, selectedDisplayProfile));
    setProfileMessage(`Applied ${displayProfileLabel(selectedDisplayProfile)} profile`);
  }

  function saveSelectedProfile() {
    setState(saveCurrentSettingsAsDisplayProfilePatch(state, selectedDisplayProfile));
    setProfileMessage(`Saved current settings as ${displayProfileLabel(selectedDisplayProfile)} profile`);
  }

  return (
    <aside
      className={`stage-popover fixed ${popoverPosition} top-20 z-50 w-[min(24rem,calc(100vw-1.5rem))] rounded-lg border p-3 shadow-2xl backdrop-blur-md ${menuSurface}`}
      data-stage-popover={active}
      onClick={(event) => event.stopPropagation()}
    >
      {active === 'library' && (
        <div className="grid gap-3">
          <StagePopoverTitle title="Library" />
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
            {favoriteStageSongs.length > 0 && <div className="sticky top-0 z-10 bg-black/60 px-3 py-1 text-[0.65rem] font-semibold uppercase tracking-normal text-amber-200 backdrop-blur">Favorites</div>}
            {favoriteStageSongs.map((stageSong) => (
              <StageLibrarySongButton
                key={stageSong.id}
                song={stageSong}
                currentSongId={currentSongId}
                onSelectStageSong={onSelectStageSong}
                onToggleFavorite={onToggleFavorite}
              />
            ))}
            {regularStageSongs.length > 0 && <div className="sticky top-0 z-10 bg-black/60 px-3 py-1 text-[0.65rem] font-semibold uppercase tracking-normal text-slate-300 backdrop-blur">All Songs</div>}
            {regularStageSongs.map((stageSong) => (
              <StageLibrarySongButton
                key={stageSong.id}
                song={stageSong}
                currentSongId={currentSongId}
                onSelectStageSong={onSelectStageSong}
                onToggleFavorite={onToggleFavorite}
              />
            ))}
            {filteredStageSongs.length === 0 && <div className="p-4 text-center text-sm text-slate-400">No songs found.</div>}
          </div>
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
        <div className="grid gap-3">
          <StagePopoverTitle title="Format" />
          <div className="min-h-72">
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
                      onClick={() => setState({ stageTheme: theme.name, theme: theme.name.includes('light') || theme.name === 'outdoor' ? 'light' : 'dark' })}
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
                  <span>Scroll Speed: {state.autoscrollSpeed} px/sec</span>
                  <input type="range" min={4} max={60} step={1} value={state.autoscrollSpeed} onChange={(event) => setAutoscrollSpeed(Number(event.target.value))} />
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
            {formatTab === 'external' && <ExternalDisplayControls state={{ ...state, externalDisplay: externalDisplaySettings }} setState={setState} />}
          </div>
          <div className="stage-format-tabbar mt-2 grid grid-cols-4 gap-1 border-t border-slate-700 pt-2 sm:grid-cols-8">
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
            <button className="stage-menu-button" type="button" onClick={() => onToggleFavorite(currentStageSong.id)}>
              <Star size={18} fill={currentStageSong.favorite ? 'currentColor' : 'none'} />
              {currentStageSong.favorite ? 'Remove Favorite' : 'Add Favorite'}
            </button>
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
  onToggleFavorite
}: {
  song: Song;
  currentSongId: string;
  onSelectStageSong: (songId: string) => void;
  onToggleFavorite: (songId: string) => void;
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
          <span className="block truncate font-semibold">{song.title}</span>
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
                className="font-chart whitespace-pre-wrap"
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
      <div>scrollHeight: {debug.scrollHeight}</div>
      <div>clientHeight: {debug.clientHeight}</div>
      <div>maxScroll: {debug.maxScroll.toFixed(2)}</div>
      <div>mode: {debug.durationSource}</div>
      <div>display: {debug.displayMode}</div>
      <div>BPM: {debug.bpm ?? '-'}</div>
      <div>beats: {debug.estimatedBeats?.toFixed(1) ?? '-'}</div>
      <div>estimated: {debug.estimatedDurationSeconds ? formatDuration(debug.estimatedDurationSeconds) : '-'}</div>
      <div>pace: {debug.readingPaceMultiplier.toFixed(2)}</div>
      <div>duration: {debug.durationSeconds ?? '-'}</div>
      <div>px/sec: {debug.pixelsPerSecond.toFixed(2)}</div>
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
          <span>Autoscroll speed: {state.autoscrollSpeed} px/sec</span>
          <input
            type="range"
            min={4}
            max={60}
            step={1}
            value={state.autoscrollSpeed}
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

function ChordProDisplayLine({
  line,
  transpose,
  showNashville,
  songKey,
  boldChords,
  italicChords,
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
  showAnchorDebug
}: {
  line: RenderedLine;
  transpose: number;
  showNashville: boolean;
  songKey: string;
  boldChords: boolean;
  italicChords: boolean;
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
  showAnchorDebug: boolean;
}) {
  const resolvedChordColor = resolveChordFontColor(chordFontColor);
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
    color: resolveSectionFontColor(sectionFontColor),
    fontSize: `${sectionFontSize}px`,
    marginTop: `${Math.round(sectionSpacingBefore * lineSpacing)}px`,
    marginBottom: `${Math.round(sectionSpacingAfter * lineSpacing)}px`,
    fontWeight: sectionBold ? 800 : 500,
    fontStyle: sectionItalic ? 'italic' : undefined,
    textTransform: sectionUppercase ? 'uppercase' : 'none'
  };
  const harmonyStyle: React.CSSProperties = {
    color: showHarmonyCues ? resolveHarmonyColor(harmonyTextColor) : undefined,
    fontStyle: showHarmonyCues && harmonyItalic ? 'italic' : undefined,
    textDecorationLine: showHarmonyCues && harmonyUnderline ? 'underline' : undefined,
    textDecorationThickness: showHarmonyCues && harmonyUnderline ? '0.08em' : undefined,
    textUnderlineOffset: showHarmonyCues && harmonyUnderline ? '0.16em' : undefined
  };
  const resolvedHarmonyIconColor = resolveHarmonyColor(harmonyIconColor);

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
      const chordRowHeight = Math.ceil(chordFontSize * 1.25);
      return (
        <div data-line-index={lineIndex} className="whitespace-pre font-mono" style={{ minHeight: `${chordRowHeight}px`, lineHeight: `${chordRowHeight}px`, ...rowSpacingStyle }}>
          {line.chordLine && <div>{renderStandaloneChordRow(line.chordLine, chordClassName, chordStyle)}</div>}
        </div>
      );
    }
    const anchoredLine = chordOverTextToAnchoredLine(line.chordLine, line.lyricLine);
    return (
      <AnchoredChordDisplayLine
        anchoredLine={anchoredLine}
        lineIndex={lineIndex}
        chordClassName={chordClassName}
        chordStyle={chordStyle}
        chordFontSize={chordFontSize}
        lyricFontSize={lyricFontSize}
        lineSpacing={lineSpacing}
        chordVerticalOffset={chordVerticalOffset}
        showAnchorDebug={showAnchorDebug}
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
    return (
      <AnchoredChordDisplayLine
        anchoredLine={anchoredLine}
        lineIndex={lineIndex}
        chordClassName={chordClassName}
        chordStyle={chordStyle}
        chordFontSize={chordFontSize}
        lyricFontSize={lyricFontSize}
        lineSpacing={lineSpacing}
        chordVerticalOffset={chordVerticalOffset}
        showAnchorDebug={showAnchorDebug}
        showHarmonyCues={showHarmonyCues}
        harmonyStyle={harmonyStyle}
        harmonyIconColor={resolvedHarmonyIconColor}
        harmonyIconVisible={harmonyIconVisible}
        showHarmonyDebug={showHarmonyDebug}
      />
    );
  }

  const inlineAnchoredLine = chordTokensToAnchoredLine(line.tokens);
  if (inlineAnchoredLine.anchors.length > 0) {
    return (
      <AnchoredChordDisplayLine
        anchoredLine={inlineAnchoredLine}
        lineIndex={lineIndex}
        chordClassName={chordClassName}
        chordStyle={chordStyle}
        chordFontSize={chordFontSize}
        lyricFontSize={lyricFontSize}
        lineSpacing={lineSpacing}
        chordVerticalOffset={chordVerticalOffset}
        showAnchorDebug={showAnchorDebug}
        showHarmonyCues={showHarmonyCues}
        harmonyStyle={harmonyStyle}
        harmonyIconColor={resolvedHarmonyIconColor}
        harmonyIconVisible={harmonyIconVisible}
        showHarmonyDebug={showHarmonyDebug}
      />
    );
  }

  return (
    <div data-line-index={lineIndex} className="relative whitespace-pre-wrap" style={lyricLineStyle}>
      {showHarmonyCues && harmonyIconVisible && plainLineState.hasHarmony && <HarmonyCueIcon color={resolvedHarmonyIconColor} />}
      {renderLyricTextWithHarmony(rawLineText, {
        showHarmonyCues,
        harmonyStyle,
        showHarmonyDebug
      })}
    </div>
  );
}

function renderStandaloneChordRow(line: string, chordClassName: string, chordStyle: React.CSSProperties) {
  return line.split(/(\s+)/).map((part, index) => {
    if (!part) return null;
    if (/^\s+$/.test(part)) return <span key={`space-${index}`}>{part}</span>;
    if (!isStageChordToken(part)) return <span key={`${part}-${index}`}>{part}</span>;
    return (
      <span key={`${part}-${index}`} className={chordClassName} style={chordStyle}>
        {part}
      </span>
    );
  });
}

function renderStageSectionLabel(label: string, lineIndex: number, style: React.CSSProperties) {
  return (
    <div data-line-index={lineIndex} className="stage-section" style={style}>
      {label}
    </div>
  );
}

function HarmonyCueIcon({ color, top }: { color: string; top?: number | string }) {
  return (
    <Music2
      className="pointer-events-none absolute -ml-[1.45em] h-[0.85em] w-[0.85em]"
      style={{
        color,
        top: top ?? '50%',
        transform: 'translateY(-50%)',
        filter: 'drop-shadow(0 0 0.35em rgba(99,102,241,0.28))'
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
  lineIndex,
  chordClassName,
  chordStyle,
  chordFontSize,
  lyricFontSize,
  lineSpacing,
  chordVerticalOffset,
  showAnchorDebug,
  showHarmonyCues,
  harmonyStyle,
  harmonyIconColor,
  harmonyIconVisible,
  showHarmonyDebug
}: {
  anchoredLine: AnchoredChordLine;
  lineIndex: number;
  chordClassName: string;
  chordStyle: React.CSSProperties;
  chordFontSize: number;
  lyricFontSize: number;
  lineSpacing: number;
  chordVerticalOffset: number;
  showAnchorDebug: boolean;
  showHarmonyCues: boolean;
  harmonyStyle: React.CSSProperties;
  harmonyIconColor: string;
  harmonyIconVisible: boolean;
  showHarmonyDebug: boolean;
}) {
  const { lyricLineHeight, lyricTop, rowSpacing, totalLineHeight } = anchoredChordLineLayout(lyricFontSize, chordFontSize, lineSpacing);
  const markerRefs = useRef(new Map<number, HTMLSpanElement>());
  const lineBoxRef = useRef<HTMLDivElement | null>(null);
  const lyricRef = useRef<HTMLDivElement | null>(null);
  const [anchorPositions, setAnchorPositions] = useState<Record<number, { left: number; top: number }>>({});
  const anchorKey = anchoredLine.anchors.map((anchor) => `${anchor.index}:${anchor.chord}`).join('|');
  const anchorIndexes = useMemo(
    () => Array.from(new Set(anchoredLine.anchors.map((anchor) => anchor.index))).sort((a, b) => a - b),
    [anchorKey]
  );

  const measureAnchors = useCallback(() => {
    const nextPositions: Record<number, { left: number; top: number }> = {};
    anchorIndexes.forEach((index) => {
      const marker = markerRefs.current.get(index);
      if (!marker) return;
      nextPositions[index] = {
        left: marker.offsetLeft,
        top: Math.max(0, marker.offsetTop - lyricTop + chordVerticalOffset)
      };
    });
    setAnchorPositions((current) => (sameAnchorPositions(current, nextPositions) ? current : nextPositions));
  }, [anchorIndexes, lyricTop, chordVerticalOffset]);

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

  return (
    <div data-line-index={lineIndex} className="overflow-visible font-mono" style={{ marginBottom: `${rowSpacing}px` }}>
      <div
        ref={lineBoxRef}
        className="relative min-w-0 whitespace-pre"
        style={{
          height: `${totalLineHeight}px`,
          lineHeight: `${lyricLineHeight}px`
        }}
      >
        {anchoredLine.anchors.length > 0 && (
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
        {showHarmonyCues && harmonyIconVisible && anchoredLine.harmonyRanges.length > 0 && <HarmonyCueIcon color={harmonyIconColor} top={lyricTop + lyricLineHeight / 2} />}
        <div ref={lyricRef} className="absolute left-0 whitespace-pre" style={{ top: `${lyricTop}px`, lineHeight: `${lyricLineHeight}px` }}>
          {renderLyricWithAnchorMarkers(anchoredLine.lyricLine, anchorIndexes, markerRefs, anchoredLine.harmonyRanges, showHarmonyCues, harmonyStyle, showHarmonyDebug)}
        </div>
      </div>
    </div>
  );
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
    if (safeAnchors.includes(boundary)) {
      nodes.push(
        <span
          key={`anchor-${boundary}-${index}`}
          ref={(element) => {
            if (element) markerRefs.current.set(boundary, element);
            else markerRefs.current.delete(boundary);
          }}
          className="inline-block w-0"
          data-chord-anchor-index={boundary}
        />
      );
    }

    const nextBoundary = boundaries[index + 1];
    if (nextBoundary === undefined || boundary >= nextBoundary) continue;
    nodes.push(
      <span key={`text-${boundary}-${nextBoundary}`}>
        {renderLyricTextWithHarmony(lyricLine.slice(boundary, nextBoundary), {
          harmonyRanges: sliceHarmonyRanges(lyricState.ranges, boundary, nextBoundary),
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
  const maxScroll = Math.max(0, scrollHeight - clientHeight);
  return {
    targetType: target.type,
    scrollTopBefore: scrollTop,
    scrollTopAfter: scrollTop,
    scrollHeight,
    clientHeight,
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

function getAutoscrollPixelsPerSecond(song: Song | undefined, maxScroll: number, manualSpeed: number) {
  return calculateAutoscrollPixelsPerSecond(maxScroll, song?.durationSeconds, manualSpeed);
}

function getAutoscrollSpeedPlan(song: Song | undefined, metrics: ReturnType<typeof getAutoscrollMetrics>, state: PerformanceState): AutoscrollSpeedPlan {
  const readingPaceMultiplier = getReadingPaceMultiplier(state.readingPace ?? 'normal');
  const displayMode = getDisplayModeLabel(state);
  if (song?.durationSeconds && song.durationSeconds > 0) {
    return {
      pixelsPerSecond: calculateAutoscrollPixelsPerSecond(metrics.maxScroll, song.durationSeconds, state.autoscrollSpeed),
      durationSeconds: song.durationSeconds,
      readingPaceMultiplier,
      durationSource: 'manual-duration',
      displayMode
    };
  }

  const shouldUseBpm = (state.autoscrollDurationMode ?? 'manual-duration') === 'bpm-estimate' || Boolean(song?.bpm);
  const estimate = shouldUseBpm ? getBpmDurationEstimate(song, metrics, state) : undefined;
  if (estimate) {
    return {
      pixelsPerSecond: calculateAutoscrollPixelsPerSecond(metrics.maxScroll, estimate.durationSeconds, state.autoscrollSpeed),
      durationSeconds: estimate.durationSeconds,
      estimatedBeats: estimate.estimatedBeats,
      estimatedDurationSeconds: estimate.durationSeconds,
      readingPaceMultiplier,
      durationSource: 'bpm-estimate',
      displayMode
    };
  }

  return {
    pixelsPerSecond: state.autoscrollSpeed,
    readingPaceMultiplier,
    durationSource: 'manual-speed',
    displayMode
  };
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
