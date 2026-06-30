export type Song = {
  id: string;
  title: string;
  subtitle?: string;
  artist: string;
  album?: string;
  genre?: string;
  vibe?: string;
  crowdScore?: number;
  danceability?: number;
  energy?: number;
  vocalRange?: string;
  vocalDifficulty?: string;
  openerCandidate?: boolean;
  closerCandidate?: boolean;
  musicBrainzRecordingId?: string;
  deezerTrackId?: string;
  lastFmUrl?: string;
  referenceAudioUrl?: string;
  sharedSongId?: string;
  sourceShareId?: string;
  importedFromShareId?: string;
  copiedFromShareId?: string;
  originSongId?: string;
  songUuid?: string;
  version?: number;
  lastSharedAt?: string;
  importedAt?: string;
  sharedSource?: string;
  difficulty?: string;
  tuning?: string;
  originalKey?: string;
  performanceKey?: string;
  durationSeconds?: number;
  year?: number;
  bandNotes?: string;
  rehearsalNotes?: RehearsalNote[];
  key: string;
  capo: number;
  bpm: number;
  timeSignature: string;
  tags: string[];
  notes: string;
  chart: string;
  favorite: boolean;
  displayPreference?: SongDisplayPreference;
  rawChordPro?: string;
  parsedChordPro?: ParsedChordPro;
  updatedAt: string;
};

export type SongDisplayPreference = 'inline' | 'chords-over';

export type ChordProDirectiveName =
  | 'title'
  | 'subtitle'
  | 'artist'
  | 'album'
  | 'key'
  | 'capo'
  | 'tempo'
  | 'time'
  | 'comment'
  | 'start_of_chorus'
  | 'end_of_chorus'
  | 'start_of_verse'
  | 'end_of_verse'
  | string;

export type ParsedChordToken =
  | { type: 'chord'; value: string }
  | { type: 'text'; value: string };

export type ParsedChordProLine =
  | { type: 'lyrics'; raw: string; tokens: ParsedChordToken[]; sourceStart?: number }
  | { type: 'blank'; raw: string; sourceStart?: number }
  | { type: 'comment'; raw: string; text: string; sourceStart?: number }
  | { type: 'section'; raw: string; section: SongSectionName; boundary: 'start' | 'end'; sourceStart?: number }
  | { type: 'directive'; raw: string; name: ChordProDirectiveName; value: string; sourceStart?: number };

export type SongSectionName = 'verse' | 'chorus' | 'bridge' | 'solo' | 'outro';

export type RehearsalNote = {
  id: string;
  createdAt: string;
  text: string;
};

export type ParsedChordPro = {
  directives: Partial<Record<ChordProDirectiveName, string[]>>;
  lines: ParsedChordProLine[];
  warnings: string[];
};

export type SetlistItem = {
  id: string;
  songId: string;
  order: number;
};

export type SavedSetlist = {
  id: string;
  name: string;
  songIds: string[];
  createdAt: string;
  updatedAt: string;
  notes?: string;
};

export type StageMode = 'library' | 'editor' | 'import' | 'setlist' | 'perform' | 'stage' | 'displays' | 'pedals' | 'settings' | 'diagnostics' | 'help';

export type SyncState = 'disabled' | 'idle' | 'syncing' | 'error';

export type PedalAction =
  | 'nextSong'
  | 'previousSong'
  | 'toggleAutoscroll'
  | 'toggleTempoGuide'
  | 'scrollFaster'
  | 'scrollSlower'
  | 'scrollDown'
  | 'scrollUp'
  | 'toggleChords'
  | 'toggleHarmonyCues'
  | 'increaseFontSize'
  | 'decreaseFontSize';

export type PedalMappings = Record<PedalAction, string[]>;

export type PerformanceTheme = 'dark' | 'light';

export type AutoscrollPreset = 'slow' | 'medium' | 'fast' | 'custom';
export type AutoscrollDurationMode = 'manual-duration' | 'bpm-estimate' | 'manual-speed';
export type ReadingPace = 'slower' | 'normal' | 'faster';
export type ExternalDisplayRotation = 'normal' | 'cw-90' | 'ccw-90' | 'rotate-180';
export type ExternalDisplayScaleMode = 'fit' | 'fill' | 'manual';
export type ExternalDisplayOutputMode = 'standard' | 'airplay-portrait-fill';
export type ReceiverDisplayMode =
  | 'landscape-lyrics'
  | 'fit-portrait'
  | 'fill-portrait-crop-safe'
  | 'rotate-90-cw'
  | 'rotate-90-ccw';
export type StageDocumentThemeName =
  | 'standard-white'
  | 'sepia'
  | 'aged-paper'
  | 'coffeehouse-paper'
  | 'dark-stage'
  | 'blue-night'
  | 'outdoor-daylight'
  | 'high-contrast-document';
export type StageFontFamilyName =
  | 'helvetica-sans'
  | 'arial'
  | 'verdana'
  | 'trebuchet'
  | 'avenir'
  | 'courier-new'
  | 'consolas'
  | 'georgia'
  | 'times-new-roman'
  | 'marker-style'
  | 'performance-mono';

export type ExternalDisplaySettings = {
  enabled: boolean;
  outputMode: ExternalDisplayOutputMode;
  rotation: ExternalDisplayRotation;
  scaleMode: ExternalDisplayScaleMode;
  manualZoom: number;
  offsetX: number;
  offsetY: number;
  safeMargin: number;
  showCalibration: boolean;
  fillScreenTest: boolean;
  profileName: string;
};

export type ReceiverDisplaySettings = {
  displayMode: ReceiverDisplayMode;
  blackBackground: boolean;
  fontScale: number;
  showTestPattern: boolean;
  showDiagnostics: boolean;
  safeMargin: number;
};

export type PerformanceState = {
  lastSongId: string;
  scrollPositions: Record<string, number>;
  capoOverrides: Record<string, number>;
  transpose: number;
  fontSize: number;
  fontSizesByProfile: Partial<Record<DeviceProfile, number>>;
  headerFontSize: number;
  headerFontSizesByProfile: Partial<Record<DeviceProfile, number>>;
  songTitleFontSize: number;
  songTitleFontSizesByProfile: Partial<Record<DeviceProfile, number>>;
  songTitleColor: string;
  songTitleColorsByProfile: Partial<Record<DeviceProfile, string>>;
  songTitleBold: boolean;
  songTitleBoldByProfile: Partial<Record<DeviceProfile, boolean>>;
  songTitleItalic: boolean;
  songTitleItalicByProfile: Partial<Record<DeviceProfile, boolean>>;
  songArtistFontSize: number;
  songArtistFontSizesByProfile: Partial<Record<DeviceProfile, number>>;
  songArtistColor: string;
  songArtistColorsByProfile: Partial<Record<DeviceProfile, string>>;
  songArtistBold: boolean;
  songArtistBoldByProfile: Partial<Record<DeviceProfile, boolean>>;
  songArtistItalic: boolean;
  songArtistItalicByProfile: Partial<Record<DeviceProfile, boolean>>;
  lineSpacing: number;
  lineSpacingsByProfile: Partial<Record<DeviceProfile, number>>;
  chordFontSize: number;
  chordFontSizesByProfile: Partial<Record<DeviceProfile, number>>;
  chordVerticalOffset: number;
  chordVerticalOffsetsByProfile: Partial<Record<DeviceProfile, number>>;
  chordHighlightColor: string;
  chordHighlightColorsByProfile: Partial<Record<DeviceProfile, string>>;
  chordFontColor: string;
  chordFontColorsByProfile: Partial<Record<DeviceProfile, string>>;
  sectionFontSize: number;
  sectionFontSizesByProfile: Partial<Record<DeviceProfile, number>>;
  sectionFontColor: string;
  sectionFontColorsByProfile: Partial<Record<DeviceProfile, string>>;
  sectionBold: boolean;
  sectionBoldByProfile: Partial<Record<DeviceProfile, boolean>>;
  sectionItalic: boolean;
  sectionItalicByProfile: Partial<Record<DeviceProfile, boolean>>;
  sectionUppercase: boolean;
  sectionUppercaseByProfile: Partial<Record<DeviceProfile, boolean>>;
  sectionSpacingBefore: number;
  sectionSpacingBeforeByProfile: Partial<Record<DeviceProfile, number>>;
  sectionSpacingAfter: number;
  sectionSpacingAfterByProfile: Partial<Record<DeviceProfile, number>>;
  showHarmonyCues: boolean;
  showHarmonyCuesByProfile: Partial<Record<DeviceProfile, boolean>>;
  harmonyTextColor: string;
  harmonyTextColorsByProfile: Partial<Record<DeviceProfile, string>>;
  harmonyIconColor: string;
  harmonyIconColorsByProfile: Partial<Record<DeviceProfile, string>>;
  harmonyItalic: boolean;
  harmonyItalicByProfile: Partial<Record<DeviceProfile, boolean>>;
  harmonyUnderline: boolean;
  harmonyUnderlineByProfile: Partial<Record<DeviceProfile, boolean>>;
  harmonyIconVisible: boolean;
  harmonyIconVisibleByProfile: Partial<Record<DeviceProfile, boolean>>;
  documentTheme: StageDocumentThemeName;
  documentThemesByProfile: Partial<Record<DeviceProfile, StageDocumentThemeName>>;
  stageFontFamily: StageFontFamilyName;
  stageFontFamiliesByProfile: Partial<Record<DeviceProfile, StageFontFamilyName>>;
  useMonospaceChords: boolean;
  useMonospaceChordsByProfile: Partial<Record<DeviceProfile, boolean>>;
  theme: PerformanceTheme;
  autoscrollSpeed: number;
  autoscrollSpeedsByProfile: Partial<Record<DeviceProfile, number>>;
  autoscrollPreset: AutoscrollPreset;
  autoscrollDurationMode: AutoscrollDurationMode;
  readingPace: ReadingPace;
  stageLocked: boolean;
  portraitMode: boolean;
  mirroredMode: boolean;
  pedalMappings: PedalMappings;
  recoverToStageMode: boolean;
  showNashvilleNumbers: boolean;
  showSectionSidebar: boolean;
  showReadingGuide: boolean;
  showChordAnchorDebug: boolean;
  showHarmonyDebug: boolean;
  minimalStageMode: boolean;
  boldChords: boolean;
  boldChordsByProfile: Partial<Record<DeviceProfile, boolean>>;
  italicChords: boolean;
  italicChordsByProfile: Partial<Record<DeviceProfile, boolean>>;
  showChords: boolean;
  showChordsByProfile: Partial<Record<DeviceProfile, boolean>>;
  inlineChordsOnPhone: boolean;
  splitScreen: boolean;
  countdownSeconds: number;
  activeProfile: DeviceProfile;
  stageTheme: StageThemeName;
  showAutoscrollDebug: boolean;
  lastBackupTime?: string;
  lastRestoreTime?: string;
  tempoStopAfter10Sec: boolean;
  tempoStopAfter10SecByProfile: Partial<Record<DeviceProfile, boolean>>;
  castReceiverEnabled: boolean;
  castReceiverLastSync?: string;
  externalDisplay: ExternalDisplaySettings;
  receiverDisplay: ReceiverDisplaySettings;
};

export type DeviceProfile =
  | 'desktop'
  | 'ipad-portrait'
  | 'ipad-landscape'
  | 'iphone'
  | 'prompter-display'
  | 'stage-device'
  | 'tablet'
  | 'portrait-prompter';

export type StageThemeName = 'standard-dark' | 'standard-light' | 'coffeehouse' | 'high-contrast' | 'outdoor';

export type AppLogLevel = 'info' | 'warning' | 'error';

export type AppLogEntry = {
  id: string;
  level: AppLogLevel;
  message: string;
  detail?: string;
  createdAt: string;
};

export type SyncStatus = 'offline' | 'idle' | 'syncing' | 'conflict' | 'error';

export type SyncConflict = {
  id: string;
  songId: string;
  localUpdatedAt: string;
  remoteUpdatedAt: string;
  reason: string;
};

export type RenderDiagnostics = {
  lastRenderMs: number;
  lastParseMs: number;
  renderCacheSize: number;
  parsedLineCount: number;
};
