import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { createId } from '../lib/ids';
import type { AppLogEntry, PerformanceState, RenderDiagnostics, SyncConflict, SyncStatus } from '../types';

export const defaultPedalMappings = {
  nextSong: ['ArrowRight', 'PageDown'],
  previousSong: ['ArrowLeft', 'PageUp'],
  toggleAutoscroll: ['Space'],
  scrollDown: ['ArrowDown'],
  scrollUp: ['ArrowUp']
};

export const defaultPerformanceState: PerformanceState = {
  lastSongId: '',
  scrollPositions: {},
  capoOverrides: {},
  transpose: 0,
  fontSize: 34,
  fontSizesByProfile: {
    desktop: 34,
    'stage-device': 34,
    tablet: 34,
    'portrait-prompter': 34
  },
  headerFontSize: 16,
  headerFontSizesByProfile: {
    desktop: 16,
    'stage-device': 16,
    tablet: 16,
    'portrait-prompter': 16
  },
  lineSpacing: 1,
  lineSpacingsByProfile: {
    desktop: 1,
    'stage-device': 1,
    tablet: 1,
    'portrait-prompter': 1
  },
  chordFontSize: 18,
  chordFontSizesByProfile: {
    desktop: 18,
    'stage-device': 18,
    tablet: 18,
    'portrait-prompter': 18
  },
  chordVerticalOffset: 0,
  chordVerticalOffsetsByProfile: {
    desktop: 0,
    'stage-device': 0,
    tablet: 0,
    'portrait-prompter': 0
  },
  chordHighlightColor: 'none',
  chordHighlightColorsByProfile: {
    desktop: 'none',
    'stage-device': 'none',
    tablet: 'none',
    'portrait-prompter': 'none'
  },
  chordFontColor: 'gold',
  chordFontColorsByProfile: {
    desktop: 'gold',
    'stage-device': 'gold',
    tablet: 'gold',
    'portrait-prompter': 'gold'
  },
  sectionFontSize: 36,
  sectionFontSizesByProfile: {
    desktop: 36,
    'stage-device': 36,
    tablet: 36,
    'portrait-prompter': 36
  },
  sectionFontColor: 'gold',
  sectionFontColorsByProfile: {
    desktop: 'gold',
    'stage-device': 'gold',
    tablet: 'gold',
    'portrait-prompter': 'gold'
  },
  sectionBold: true,
  sectionBoldByProfile: {
    desktop: true,
    'stage-device': true,
    tablet: true,
    'portrait-prompter': true
  },
  sectionItalic: false,
  sectionItalicByProfile: {
    desktop: false,
    'stage-device': false,
    tablet: false,
    'portrait-prompter': false
  },
  sectionUppercase: true,
  sectionUppercaseByProfile: {
    desktop: true,
    'stage-device': true,
    tablet: true,
    'portrait-prompter': true
  },
  sectionSpacingBefore: 28,
  sectionSpacingBeforeByProfile: {
    desktop: 28,
    'stage-device': 28,
    tablet: 28,
    'portrait-prompter': 28
  },
  sectionSpacingAfter: 8,
  sectionSpacingAfterByProfile: {
    desktop: 8,
    'stage-device': 8,
    tablet: 8,
    'portrait-prompter': 8
  },
  showHarmonyCues: true,
  showHarmonyCuesByProfile: {
    desktop: true,
    'stage-device': true,
    tablet: true,
    'portrait-prompter': true
  },
  harmonyTextColor: 'dark-blue',
  harmonyTextColorsByProfile: {
    desktop: 'dark-blue',
    'stage-device': 'dark-blue',
    tablet: 'dark-blue',
    'portrait-prompter': 'dark-blue'
  },
  harmonyIconColor: 'blue-purple',
  harmonyIconColorsByProfile: {
    desktop: 'blue-purple',
    'stage-device': 'blue-purple',
    tablet: 'blue-purple',
    'portrait-prompter': 'blue-purple'
  },
  harmonyItalic: true,
  harmonyItalicByProfile: {
    desktop: true,
    'stage-device': true,
    tablet: true,
    'portrait-prompter': true
  },
  harmonyUnderline: true,
  harmonyUnderlineByProfile: {
    desktop: true,
    'stage-device': true,
    tablet: true,
    'portrait-prompter': true
  },
  harmonyIconVisible: true,
  harmonyIconVisibleByProfile: {
    desktop: true,
    'stage-device': true,
    tablet: true,
    'portrait-prompter': true
  },
  documentTheme: 'standard-white',
  documentThemesByProfile: {
    desktop: 'standard-white',
    'stage-device': 'standard-white',
    tablet: 'standard-white',
    'portrait-prompter': 'standard-white'
  },
  stageFontFamily: 'helvetica-sans',
  stageFontFamiliesByProfile: {
    desktop: 'helvetica-sans',
    'stage-device': 'helvetica-sans',
    tablet: 'helvetica-sans',
    'portrait-prompter': 'helvetica-sans'
  },
  useMonospaceChords: false,
  useMonospaceChordsByProfile: {
    desktop: false,
    'stage-device': false,
    tablet: false,
    'portrait-prompter': false
  },
  theme: 'dark',
  autoscrollSpeed: 18,
  autoscrollPreset: 'medium',
  autoscrollDurationMode: 'manual-duration',
  readingPace: 'normal',
  stageLocked: true,
  portraitMode: false,
  mirroredMode: false,
  pedalMappings: defaultPedalMappings,
  recoverToStageMode: false,
  showNashvilleNumbers: false,
  showSectionSidebar: true,
  showReadingGuide: false,
  showChordAnchorDebug: false,
  showHarmonyDebug: false,
  minimalStageMode: false,
  boldChords: true,
  boldChordsByProfile: {
    desktop: true,
    'stage-device': true,
    tablet: true,
    'portrait-prompter': true
  },
  italicChords: false,
  italicChordsByProfile: {
    desktop: false,
    'stage-device': false,
    tablet: false,
    'portrait-prompter': false
  },
  splitScreen: false,
  countdownSeconds: 0,
  activeProfile: 'desktop',
  stageTheme: 'standard-dark',
  showAutoscrollDebug: false,
  externalDisplay: {
    enabled: false,
    outputMode: 'standard',
    rotation: 'normal',
    scaleMode: 'fit',
    manualZoom: 1,
    offsetX: 0,
    offsetY: 0,
    safeMargin: 4,
    showCalibration: false,
    fillScreenTest: false,
    profileName: 'Standard External Display'
  }
};

export type AppStore = {
  performance: PerformanceState;
  logs: AppLogEntry[];
  syncStatus: SyncStatus;
  conflicts: SyncConflict[];
  diagnostics: RenderDiagnostics;
  updatePerformance: (next: Partial<PerformanceState>) => void;
  setSyncStatus: (status: SyncStatus) => void;
  setConflicts: (conflicts: SyncConflict[]) => void;
  log: (level: AppLogEntry['level'], message: string, detail?: string) => void;
  clearLogs: () => void;
  updateDiagnostics: (next: Partial<RenderDiagnostics>) => void;
};

export const useAppStore = create<AppStore>()(
  persist(
    (set) => ({
      performance: defaultPerformanceState,
      logs: [],
      syncStatus: navigator.onLine ? 'idle' : 'offline',
      conflicts: [],
      diagnostics: {
        lastRenderMs: 0,
        lastParseMs: 0,
        renderCacheSize: 0,
        parsedLineCount: 0
      },
      updatePerformance: (next) =>
        set((state) => {
          const activeProfile = next.activeProfile ?? state.performance.activeProfile;
          const currentLyricSizes = state.performance.fontSizesByProfile ?? {};
          const currentHeaderSizes = state.performance.headerFontSizesByProfile ?? {};
          const currentLineSpacings = state.performance.lineSpacingsByProfile ?? {};
          const currentChordSizes = state.performance.chordFontSizesByProfile ?? {};
          const currentChordOffsets = state.performance.chordVerticalOffsetsByProfile ?? {};
          const currentHighlightColors = state.performance.chordHighlightColorsByProfile ?? {};
          const currentChordColors = state.performance.chordFontColorsByProfile ?? {};
          const currentSectionSizes = state.performance.sectionFontSizesByProfile ?? {};
          const currentSectionColors = state.performance.sectionFontColorsByProfile ?? {};
          const currentSectionBold = state.performance.sectionBoldByProfile ?? {};
          const currentSectionItalic = state.performance.sectionItalicByProfile ?? {};
          const currentSectionUppercase = state.performance.sectionUppercaseByProfile ?? {};
          const currentSectionSpacingBefore = state.performance.sectionSpacingBeforeByProfile ?? {};
          const currentSectionSpacingAfter = state.performance.sectionSpacingAfterByProfile ?? {};
          const currentShowHarmonyCues = state.performance.showHarmonyCuesByProfile ?? {};
          const currentHarmonyTextColors = state.performance.harmonyTextColorsByProfile ?? {};
          const currentHarmonyIconColors = state.performance.harmonyIconColorsByProfile ?? {};
          const currentHarmonyItalic = state.performance.harmonyItalicByProfile ?? {};
          const currentHarmonyUnderline = state.performance.harmonyUnderlineByProfile ?? {};
          const currentHarmonyIconVisible = state.performance.harmonyIconVisibleByProfile ?? {};
          const currentDocumentThemes = state.performance.documentThemesByProfile ?? {};
          const currentStageFontFamilies = state.performance.stageFontFamiliesByProfile ?? {};
          const currentUseMonospaceChords = state.performance.useMonospaceChordsByProfile ?? {};
          const currentBoldChords = state.performance.boldChordsByProfile ?? {};
          const currentItalicChords = state.performance.italicChordsByProfile ?? {};
          const nextFontSize =
            next.fontSize ??
            currentLyricSizes[activeProfile] ??
            state.performance.fontSize ??
            defaultPerformanceState.fontSize;
          const nextHeaderFontSize =
            next.headerFontSize ??
            currentHeaderSizes[activeProfile] ??
            state.performance.headerFontSize ??
            defaultPerformanceState.headerFontSize;
          const nextLineSpacing =
            next.lineSpacing ??
            currentLineSpacings[activeProfile] ??
            state.performance.lineSpacing ??
            defaultPerformanceState.lineSpacing;
          const nextChordFontSize =
            next.chordFontSize ??
            currentChordSizes[activeProfile] ??
            state.performance.chordFontSize ??
            defaultPerformanceState.chordFontSize;
          const nextChordVerticalOffset =
            next.chordVerticalOffset ??
            currentChordOffsets[activeProfile] ??
            state.performance.chordVerticalOffset ??
            defaultPerformanceState.chordVerticalOffset;
          const nextChordHighlightColor =
            next.chordHighlightColor ??
            currentHighlightColors[activeProfile] ??
            state.performance.chordHighlightColor ??
            defaultPerformanceState.chordHighlightColor;
          const nextChordFontColor =
            next.chordFontColor ??
            currentChordColors[activeProfile] ??
            state.performance.chordFontColor ??
            defaultPerformanceState.chordFontColor;
          const nextSectionFontSize =
            next.sectionFontSize ??
            currentSectionSizes[activeProfile] ??
            state.performance.sectionFontSize ??
            defaultPerformanceState.sectionFontSize;
          const nextSectionFontColor =
            next.sectionFontColor ??
            currentSectionColors[activeProfile] ??
            state.performance.sectionFontColor ??
            defaultPerformanceState.sectionFontColor;
          const nextSectionBold =
            next.sectionBold ??
            currentSectionBold[activeProfile] ??
            state.performance.sectionBold ??
            defaultPerformanceState.sectionBold;
          const nextSectionItalic =
            next.sectionItalic ??
            currentSectionItalic[activeProfile] ??
            state.performance.sectionItalic ??
            defaultPerformanceState.sectionItalic;
          const nextSectionUppercase =
            next.sectionUppercase ??
            currentSectionUppercase[activeProfile] ??
            state.performance.sectionUppercase ??
            defaultPerformanceState.sectionUppercase;
          const nextSectionSpacingBefore =
            next.sectionSpacingBefore ??
            currentSectionSpacingBefore[activeProfile] ??
            state.performance.sectionSpacingBefore ??
            defaultPerformanceState.sectionSpacingBefore;
          const nextSectionSpacingAfter =
            next.sectionSpacingAfter ??
            currentSectionSpacingAfter[activeProfile] ??
            state.performance.sectionSpacingAfter ??
            defaultPerformanceState.sectionSpacingAfter;
          const nextShowHarmonyCues =
            next.showHarmonyCues ??
            currentShowHarmonyCues[activeProfile] ??
            state.performance.showHarmonyCues ??
            defaultPerformanceState.showHarmonyCues;
          const nextHarmonyTextColor =
            next.harmonyTextColor ??
            currentHarmonyTextColors[activeProfile] ??
            state.performance.harmonyTextColor ??
            defaultPerformanceState.harmonyTextColor;
          const nextHarmonyIconColor =
            next.harmonyIconColor ??
            currentHarmonyIconColors[activeProfile] ??
            state.performance.harmonyIconColor ??
            defaultPerformanceState.harmonyIconColor;
          const nextHarmonyItalic =
            next.harmonyItalic ??
            currentHarmonyItalic[activeProfile] ??
            state.performance.harmonyItalic ??
            defaultPerformanceState.harmonyItalic;
          const nextHarmonyUnderline =
            next.harmonyUnderline ??
            currentHarmonyUnderline[activeProfile] ??
            state.performance.harmonyUnderline ??
            defaultPerformanceState.harmonyUnderline;
          const nextHarmonyIconVisible =
            next.harmonyIconVisible ??
            currentHarmonyIconVisible[activeProfile] ??
            state.performance.harmonyIconVisible ??
            defaultPerformanceState.harmonyIconVisible;
          const nextDocumentTheme =
            next.documentTheme ??
            currentDocumentThemes[activeProfile] ??
            state.performance.documentTheme ??
            defaultPerformanceState.documentTheme;
          const nextStageFontFamily =
            next.stageFontFamily ??
            currentStageFontFamilies[activeProfile] ??
            state.performance.stageFontFamily ??
            defaultPerformanceState.stageFontFamily;
          const nextUseMonospaceChords =
            next.useMonospaceChords ??
            currentUseMonospaceChords[activeProfile] ??
            state.performance.useMonospaceChords ??
            defaultPerformanceState.useMonospaceChords;
          const nextBoldChords =
            next.boldChords ??
            currentBoldChords[activeProfile] ??
            state.performance.boldChords ??
            defaultPerformanceState.boldChords;
          const nextItalicChords =
            next.italicChords ??
            currentItalicChords[activeProfile] ??
            state.performance.italicChords ??
            defaultPerformanceState.italicChords;
          return {
            performance: {
              ...state.performance,
              ...next,
              activeProfile,
              fontSize: nextFontSize,
              fontSizesByProfile: {
                ...currentLyricSizes,
                ...(next.fontSizesByProfile ?? {}),
                [activeProfile]: nextFontSize
              },
              headerFontSize: nextHeaderFontSize,
              headerFontSizesByProfile: {
                ...currentHeaderSizes,
                ...(next.headerFontSizesByProfile ?? {}),
                [activeProfile]: nextHeaderFontSize
              },
              lineSpacing: nextLineSpacing,
              lineSpacingsByProfile: {
                ...currentLineSpacings,
                ...(next.lineSpacingsByProfile ?? {}),
                [activeProfile]: nextLineSpacing
              },
              chordFontSize: nextChordFontSize,
              chordFontSizesByProfile: {
                ...currentChordSizes,
                ...(next.chordFontSizesByProfile ?? {}),
                [activeProfile]: nextChordFontSize
              },
              chordVerticalOffset: nextChordVerticalOffset,
              chordVerticalOffsetsByProfile: {
                ...currentChordOffsets,
                ...(next.chordVerticalOffsetsByProfile ?? {}),
                [activeProfile]: nextChordVerticalOffset
              },
              chordHighlightColor: nextChordHighlightColor,
              chordHighlightColorsByProfile: {
                ...currentHighlightColors,
                ...(next.chordHighlightColorsByProfile ?? {}),
                [activeProfile]: nextChordHighlightColor
              },
              chordFontColor: nextChordFontColor,
              chordFontColorsByProfile: {
                ...currentChordColors,
                ...(next.chordFontColorsByProfile ?? {}),
                [activeProfile]: nextChordFontColor
              },
              sectionFontSize: nextSectionFontSize,
              sectionFontSizesByProfile: {
                ...currentSectionSizes,
                ...(next.sectionFontSizesByProfile ?? {}),
                [activeProfile]: nextSectionFontSize
              },
              sectionFontColor: nextSectionFontColor,
              sectionFontColorsByProfile: {
                ...currentSectionColors,
                ...(next.sectionFontColorsByProfile ?? {}),
                [activeProfile]: nextSectionFontColor
              },
              sectionBold: nextSectionBold,
              sectionBoldByProfile: {
                ...currentSectionBold,
                ...(next.sectionBoldByProfile ?? {}),
                [activeProfile]: nextSectionBold
              },
              sectionItalic: nextSectionItalic,
              sectionItalicByProfile: {
                ...currentSectionItalic,
                ...(next.sectionItalicByProfile ?? {}),
                [activeProfile]: nextSectionItalic
              },
              sectionUppercase: nextSectionUppercase,
              sectionUppercaseByProfile: {
                ...currentSectionUppercase,
                ...(next.sectionUppercaseByProfile ?? {}),
                [activeProfile]: nextSectionUppercase
              },
              sectionSpacingBefore: nextSectionSpacingBefore,
              sectionSpacingBeforeByProfile: {
                ...currentSectionSpacingBefore,
                ...(next.sectionSpacingBeforeByProfile ?? {}),
                [activeProfile]: nextSectionSpacingBefore
              },
              sectionSpacingAfter: nextSectionSpacingAfter,
              sectionSpacingAfterByProfile: {
                ...currentSectionSpacingAfter,
                ...(next.sectionSpacingAfterByProfile ?? {}),
                [activeProfile]: nextSectionSpacingAfter
              },
              showHarmonyCues: nextShowHarmonyCues,
              showHarmonyCuesByProfile: {
                ...currentShowHarmonyCues,
                ...(next.showHarmonyCuesByProfile ?? {}),
                [activeProfile]: nextShowHarmonyCues
              },
              harmonyTextColor: nextHarmonyTextColor,
              harmonyTextColorsByProfile: {
                ...currentHarmonyTextColors,
                ...(next.harmonyTextColorsByProfile ?? {}),
                [activeProfile]: nextHarmonyTextColor
              },
              harmonyIconColor: nextHarmonyIconColor,
              harmonyIconColorsByProfile: {
                ...currentHarmonyIconColors,
                ...(next.harmonyIconColorsByProfile ?? {}),
                [activeProfile]: nextHarmonyIconColor
              },
              harmonyItalic: nextHarmonyItalic,
              harmonyItalicByProfile: {
                ...currentHarmonyItalic,
                ...(next.harmonyItalicByProfile ?? {}),
                [activeProfile]: nextHarmonyItalic
              },
              harmonyUnderline: nextHarmonyUnderline,
              harmonyUnderlineByProfile: {
                ...currentHarmonyUnderline,
                ...(next.harmonyUnderlineByProfile ?? {}),
                [activeProfile]: nextHarmonyUnderline
              },
              harmonyIconVisible: nextHarmonyIconVisible,
              harmonyIconVisibleByProfile: {
                ...currentHarmonyIconVisible,
                ...(next.harmonyIconVisibleByProfile ?? {}),
                [activeProfile]: nextHarmonyIconVisible
              },
              documentTheme: nextDocumentTheme,
              documentThemesByProfile: {
                ...currentDocumentThemes,
                ...(next.documentThemesByProfile ?? {}),
                [activeProfile]: nextDocumentTheme
              },
              stageFontFamily: nextStageFontFamily,
              stageFontFamiliesByProfile: {
                ...currentStageFontFamilies,
                ...(next.stageFontFamiliesByProfile ?? {}),
                [activeProfile]: nextStageFontFamily
              },
              useMonospaceChords: nextUseMonospaceChords,
              useMonospaceChordsByProfile: {
                ...currentUseMonospaceChords,
                ...(next.useMonospaceChordsByProfile ?? {}),
                [activeProfile]: nextUseMonospaceChords
              },
              boldChords: nextBoldChords,
              boldChordsByProfile: {
                ...currentBoldChords,
                ...(next.boldChordsByProfile ?? {}),
                [activeProfile]: nextBoldChords
              },
              italicChords: nextItalicChords,
              italicChordsByProfile: {
                ...currentItalicChords,
                ...(next.italicChordsByProfile ?? {}),
                [activeProfile]: nextItalicChords
              },
              pedalMappings: {
                ...state.performance.pedalMappings,
                ...(next.pedalMappings ?? {})
              },
              scrollPositions: next.scrollPositions ?? state.performance.scrollPositions,
              capoOverrides: next.capoOverrides ?? state.performance.capoOverrides
            }
          };
        }),
      setSyncStatus: (syncStatus) => set({ syncStatus }),
      setConflicts: (conflicts) => set({ conflicts, syncStatus: conflicts.length ? 'conflict' : 'idle' }),
      log: (level, message, detail) =>
        set((state) => ({
          logs: [
            { id: createId('log'), level, message, detail, createdAt: new Date().toISOString() },
            ...state.logs
          ].slice(0, 100)
        })),
      clearLogs: () => set({ logs: [] }),
      updateDiagnostics: (next) =>
        set((state) => ({
          diagnostics: { ...state.diagnostics, ...next }
        }))
    }),
    {
      name: 'openstage-app-store-v1',
      partialize: (state) => ({
        performance: state.performance,
        logs: state.logs.slice(0, 25),
        diagnostics: state.diagnostics
      })
    }
  )
);
