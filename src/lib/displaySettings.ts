import type { PerformanceState, StageDocumentThemeName, StageFontFamilyName } from '../types';

export const defaultChordFontSize = 18;
export const chordHighlightOptions = [
  { value: 'none', label: 'None', color: 'transparent' },
  { value: 'white', label: 'White', color: 'rgba(255,255,255,0.86)' },
  { value: 'pale-yellow', label: 'Pale yellow', color: 'rgba(254,240,138,0.72)' },
  { value: 'tan', label: 'Tan', color: 'rgba(210,180,140,0.7)' },
  { value: 'gray', label: 'Gray', color: 'rgba(148,163,184,0.58)' },
  { value: 'pink', label: 'Pink', color: 'rgba(244,114,182,0.48)' },
  { value: 'blue', label: 'Blue', color: 'rgba(96,165,250,0.48)' }
];
export const chordFontColorOptions = [
  { value: 'black', label: 'Black', color: '#020617' },
  { value: 'white', label: 'White', color: '#f8fafc' },
  { value: 'gold', label: 'Gold', color: '#d9ad65' },
  { value: 'red', label: 'Red', color: '#f87171' },
  { value: 'dark-blue', label: 'Dark blue', color: '#1e3a8a' },
  { value: 'teal', label: 'Teal', color: '#2dd4bf' },
  { value: 'gray', label: 'Gray', color: '#94a3b8' }
];
export const sectionFontColorOptions = [
  { value: 'gold', label: 'Gold', color: '#f2c66d' },
  { value: 'teal', label: 'Teal', color: '#8bd3dd' },
  { value: 'cream', label: 'Cream', color: '#f4ead2' },
  { value: 'white', label: 'White', color: '#f8fafc' },
  { value: 'purple', label: 'Purple', color: '#c7b6ff' },
  { value: 'orange', label: 'Orange', color: '#f3a683' },
  { value: 'green', label: 'Green', color: '#a9d18e' },
  { value: 'gray', label: 'Gray', color: '#94a3b8' }
];
export const songDocumentColorOptions = [
  { value: 'document', label: 'Document text', color: 'currentColor' },
  { value: 'muted', label: 'Document muted', color: 'currentColor' },
  ...sectionFontColorOptions
];
export const harmonyColorOptions = [
  { value: 'dark-blue', label: 'Dark blue', color: '#1e3a8a' },
  { value: 'blue-purple', label: 'Blue / purple', color: '#6366f1' },
  { value: 'gold', label: 'Gold', color: '#d9ad65' },
  { value: 'teal', label: 'Teal', color: '#0f766e' },
  { value: 'pink', label: 'Pink', color: '#be185d' },
  { value: 'white', label: 'White', color: '#f8fafc' },
  { value: 'black', label: 'Black', color: '#020617' },
  { value: 'gray', label: 'Gray', color: '#64748b' }
];
export const documentThemeOptions: Array<{
  value: StageDocumentThemeName;
  label: string;
  description: string;
  background: string;
  text: string;
  muted: string;
}> = [
  { value: 'standard-white', label: 'Standard White', description: 'White background, black lyrics', background: '#ffffff', text: '#050505', muted: '#334155' },
  { value: 'sepia', label: 'Sepia', description: 'Warm cream paper, dark brown text', background: '#f4ecd8', text: '#2f2116', muted: '#6b4f37' },
  { value: 'aged-paper', label: 'Aged Paper', description: 'Parchment tone, dark brown text', background: '#ead9b8', text: '#2b2118', muted: '#705a3d' },
  { value: 'coffeehouse-paper', label: 'Coffeehouse', description: 'Warm tan background, dark charcoal text', background: '#d2b48c', text: '#1e1b18', muted: '#4a3a2a' },
  { value: 'dark-stage', label: 'Dark Stage', description: 'Black background, light lyrics', background: '#020617', text: '#f8fafc', muted: '#cbd5e1' },
  { value: 'blue-night', label: 'Blue Night', description: 'Deep navy background, soft white lyrics', background: '#071426', text: '#eef6ff', muted: '#a9c7e8' },
  { value: 'outdoor-daylight', label: 'Outdoor Daylight', description: 'Light cream, high contrast black lyrics', background: '#fffbe8', text: '#050505', muted: '#1f2937' },
  { value: 'high-contrast-document', label: 'High Contrast', description: 'Pure black / pure white', background: '#000000', text: '#ffffff', muted: '#ffffff' }
];
export const stageFontFamilyOptions: Array<{ value: StageFontFamilyName; label: string; family: string }> = [
  { value: 'helvetica-sans', label: 'Helvetica / Sans Serif', family: 'Helvetica, Arial, ui-sans-serif, system-ui, sans-serif' },
  { value: 'arial', label: 'Arial', family: 'Arial, Helvetica, sans-serif' },
  { value: 'verdana', label: 'Verdana', family: 'Verdana, Geneva, sans-serif' },
  { value: 'trebuchet', label: 'Trebuchet MS', family: '"Trebuchet MS", Arial, sans-serif' },
  { value: 'avenir', label: 'Avenir', family: 'Avenir, "Avenir Next", Helvetica, Arial, sans-serif' },
  { value: 'courier-new', label: 'Courier New', family: '"Courier New", Courier, monospace' },
  { value: 'consolas', label: 'Consolas', family: 'Consolas, "Courier New", monospace' },
  { value: 'georgia', label: 'Georgia', family: 'Georgia, "Times New Roman", serif' },
  { value: 'times-new-roman', label: 'Times New Roman', family: '"Times New Roman", Times, serif' },
  { value: 'marker-style', label: 'Marker Style', family: '"Segoe Print", "Comic Sans MS", "Trebuchet MS", cursive' },
  { value: 'performance-mono', label: 'Performance Mono', family: 'Consolas, "SFMono-Regular", "Liberation Mono", "Courier New", monospace' }
];

export function getEffectiveLyricFontSize(state: PerformanceState) {
  const profileSize = state.fontSizesByProfile?.[state.activeProfile];
  return clampRange(profileSize ?? state.fontSize ?? 34, 24, 76, 34);
}

export function lyricFontSizeUpdate(state: PerformanceState, fontSize: number): Partial<PerformanceState> {
  const nextSize = clampRange(fontSize, 24, 76, 34);
  return {
    fontSize: nextSize,
    fontSizesByProfile: {
      ...(state.fontSizesByProfile ?? {}),
      [state.activeProfile]: nextSize
    }
  };
}

export function getEffectiveHeaderFontSize(state: PerformanceState) {
  const profileSize = state.headerFontSizesByProfile?.[state.activeProfile];
  return clampRange(profileSize ?? state.headerFontSize ?? 16, 12, 34, 16);
}

export function headerFontSizeUpdate(state: PerformanceState, headerFontSize: number): Partial<PerformanceState> {
  const nextSize = clampRange(headerFontSize, 12, 34, 16);
  return {
    headerFontSize: nextSize,
    headerFontSizesByProfile: {
      ...(state.headerFontSizesByProfile ?? {}),
      [state.activeProfile]: nextSize
    }
  };
}

export function getEffectiveSongTitleFontSize(state: PerformanceState) {
  const profileSize = state.songTitleFontSizesByProfile?.[state.activeProfile];
  return clampRange(profileSize ?? state.songTitleFontSize ?? 52, 20, 96, 52);
}

export function songTitleFontSizeUpdate(state: PerformanceState, songTitleFontSize: number): Partial<PerformanceState> {
  const nextSize = clampRange(songTitleFontSize, 20, 96, 52);
  return {
    songTitleFontSize: nextSize,
    songTitleFontSizesByProfile: {
      ...(state.songTitleFontSizesByProfile ?? {}),
      [state.activeProfile]: nextSize
    }
  };
}

export function getEffectiveSongTitleColor(state: PerformanceState) {
  return state.songTitleColorsByProfile?.[state.activeProfile] ?? state.songTitleColor ?? 'document';
}

export function songTitleColorUpdate(state: PerformanceState, songTitleColor: string): Partial<PerformanceState> {
  return {
    songTitleColor,
    songTitleColorsByProfile: {
      ...(state.songTitleColorsByProfile ?? {}),
      [state.activeProfile]: songTitleColor
    }
  };
}

export function getEffectiveSongTitleBold(state: PerformanceState) {
  return state.songTitleBoldByProfile?.[state.activeProfile] ?? state.songTitleBold ?? true;
}

export function songTitleBoldUpdate(state: PerformanceState, songTitleBold: boolean): Partial<PerformanceState> {
  return {
    songTitleBold,
    songTitleBoldByProfile: {
      ...(state.songTitleBoldByProfile ?? {}),
      [state.activeProfile]: songTitleBold
    }
  };
}

export function getEffectiveSongTitleItalic(state: PerformanceState) {
  return state.songTitleItalicByProfile?.[state.activeProfile] ?? state.songTitleItalic ?? false;
}

export function songTitleItalicUpdate(state: PerformanceState, songTitleItalic: boolean): Partial<PerformanceState> {
  return {
    songTitleItalic,
    songTitleItalicByProfile: {
      ...(state.songTitleItalicByProfile ?? {}),
      [state.activeProfile]: songTitleItalic
    }
  };
}

export function getEffectiveSongArtistFontSize(state: PerformanceState) {
  const profileSize = state.songArtistFontSizesByProfile?.[state.activeProfile];
  return clampRange(profileSize ?? state.songArtistFontSize ?? 30, 14, 72, 30);
}

export function songArtistFontSizeUpdate(state: PerformanceState, songArtistFontSize: number): Partial<PerformanceState> {
  const nextSize = clampRange(songArtistFontSize, 14, 72, 30);
  return {
    songArtistFontSize: nextSize,
    songArtistFontSizesByProfile: {
      ...(state.songArtistFontSizesByProfile ?? {}),
      [state.activeProfile]: nextSize
    }
  };
}

export function getEffectiveSongArtistColor(state: PerformanceState) {
  return state.songArtistColorsByProfile?.[state.activeProfile] ?? state.songArtistColor ?? 'muted';
}

export function songArtistColorUpdate(state: PerformanceState, songArtistColor: string): Partial<PerformanceState> {
  return {
    songArtistColor,
    songArtistColorsByProfile: {
      ...(state.songArtistColorsByProfile ?? {}),
      [state.activeProfile]: songArtistColor
    }
  };
}

export function getEffectiveSongArtistBold(state: PerformanceState) {
  return state.songArtistBoldByProfile?.[state.activeProfile] ?? state.songArtistBold ?? false;
}

export function songArtistBoldUpdate(state: PerformanceState, songArtistBold: boolean): Partial<PerformanceState> {
  return {
    songArtistBold,
    songArtistBoldByProfile: {
      ...(state.songArtistBoldByProfile ?? {}),
      [state.activeProfile]: songArtistBold
    }
  };
}

export function getEffectiveSongArtistItalic(state: PerformanceState) {
  return state.songArtistItalicByProfile?.[state.activeProfile] ?? state.songArtistItalic ?? false;
}

export function songArtistItalicUpdate(state: PerformanceState, songArtistItalic: boolean): Partial<PerformanceState> {
  return {
    songArtistItalic,
    songArtistItalicByProfile: {
      ...(state.songArtistItalicByProfile ?? {}),
      [state.activeProfile]: songArtistItalic
    }
  };
}

export function getEffectiveLineSpacing(state: PerformanceState) {
  const profileSpacing = state.lineSpacingsByProfile?.[state.activeProfile];
  return clampNumber(profileSpacing ?? state.lineSpacing ?? 1, 0.75, 2, 1);
}

export function lineSpacingUpdate(state: PerformanceState, lineSpacing: number): Partial<PerformanceState> {
  const nextSpacing = clampNumber(lineSpacing, 0.75, 2, 1);
  return {
    lineSpacing: nextSpacing,
    lineSpacingsByProfile: {
      ...(state.lineSpacingsByProfile ?? {}),
      [state.activeProfile]: nextSpacing
    }
  };
}

export function clampChordFontSize(value: number) {
  return clampRange(value, 10, 48, defaultChordFontSize);
}

export function getEffectiveChordFontSize(state: PerformanceState) {
  const profileSize = state.chordFontSizesByProfile?.[state.activeProfile];
  return clampChordFontSize(profileSize ?? state.chordFontSize ?? defaultChordFontSize);
}

export function chordFontSizeUpdate(state: PerformanceState, chordFontSize: number): Partial<PerformanceState> {
  const nextSize = clampChordFontSize(chordFontSize);
  return {
    chordFontSize: nextSize,
    chordFontSizesByProfile: {
      ...(state.chordFontSizesByProfile ?? {}),
      [state.activeProfile]: nextSize
    }
  };
}

export function getEffectiveChordVerticalOffset(state: PerformanceState) {
  const profileOffset = state.chordVerticalOffsetsByProfile?.[state.activeProfile];
  return clampChordVerticalOffset(profileOffset ?? state.chordVerticalOffset ?? 0);
}

export function clampChordVerticalOffset(value: number) {
  return clampRange(value, -16, 16, 0);
}

export function chordVerticalOffsetUpdate(state: PerformanceState, chordVerticalOffset: number): Partial<PerformanceState> {
  const nextOffset = clampChordVerticalOffset(chordVerticalOffset);
  return {
    chordVerticalOffset: nextOffset,
    chordVerticalOffsetsByProfile: {
      ...(state.chordVerticalOffsetsByProfile ?? {}),
      [state.activeProfile]: nextOffset
    }
  };
}

export function getEffectiveChordHighlightColor(state: PerformanceState) {
  return state.chordHighlightColorsByProfile?.[state.activeProfile] ?? state.chordHighlightColor ?? 'none';
}

export function chordHighlightColorUpdate(state: PerformanceState, chordHighlightColor: string): Partial<PerformanceState> {
  return {
    chordHighlightColor,
    chordHighlightColorsByProfile: {
      ...(state.chordHighlightColorsByProfile ?? {}),
      [state.activeProfile]: chordHighlightColor
    }
  };
}

export function getEffectiveChordFontColor(state: PerformanceState) {
  return state.chordFontColorsByProfile?.[state.activeProfile] ?? state.chordFontColor ?? 'gold';
}

export function chordFontColorUpdate(state: PerformanceState, chordFontColor: string): Partial<PerformanceState> {
  return {
    chordFontColor,
    chordFontColorsByProfile: {
      ...(state.chordFontColorsByProfile ?? {}),
      [state.activeProfile]: chordFontColor
    }
  };
}

export function getEffectiveBoldChords(state: PerformanceState) {
  return state.boldChordsByProfile?.[state.activeProfile] ?? state.boldChords ?? true;
}

export function boldChordsUpdate(state: PerformanceState, boldChords: boolean): Partial<PerformanceState> {
  return {
    boldChords,
    boldChordsByProfile: {
      ...(state.boldChordsByProfile ?? {}),
      [state.activeProfile]: boldChords
    }
  };
}

export function getEffectiveItalicChords(state: PerformanceState) {
  return state.italicChordsByProfile?.[state.activeProfile] ?? state.italicChords ?? false;
}

export function italicChordsUpdate(state: PerformanceState, italicChords: boolean): Partial<PerformanceState> {
  return {
    italicChords,
    italicChordsByProfile: {
      ...(state.italicChordsByProfile ?? {}),
      [state.activeProfile]: italicChords
    }
  };
}

export function getEffectiveShowChords(state: PerformanceState) {
  return state.showChordsByProfile?.[state.activeProfile] ?? state.showChords ?? true;
}

export function showChordsUpdate(state: PerformanceState, showChords: boolean): Partial<PerformanceState> {
  return {
    showChords,
    showChordsByProfile: {
      ...(state.showChordsByProfile ?? {}),
      [state.activeProfile]: showChords
    }
  };
}

export function getEffectiveSectionFontSize(state: PerformanceState) {
  const profileSize = state.sectionFontSizesByProfile?.[state.activeProfile];
  return clampRange(profileSize ?? state.sectionFontSize ?? Math.round(getEffectiveLyricFontSize(state) * 1.08), 14, 64, 36);
}

export function sectionFontSizeUpdate(state: PerformanceState, sectionFontSize: number): Partial<PerformanceState> {
  const nextSize = clampRange(sectionFontSize, 14, 64, 36);
  return {
    sectionFontSize: nextSize,
    sectionFontSizesByProfile: {
      ...(state.sectionFontSizesByProfile ?? {}),
      [state.activeProfile]: nextSize
    }
  };
}

export function getEffectiveSectionFontColor(state: PerformanceState) {
  return state.sectionFontColorsByProfile?.[state.activeProfile] ?? state.sectionFontColor ?? 'gold';
}

export function sectionFontColorUpdate(state: PerformanceState, sectionFontColor: string): Partial<PerformanceState> {
  return {
    sectionFontColor,
    sectionFontColorsByProfile: {
      ...(state.sectionFontColorsByProfile ?? {}),
      [state.activeProfile]: sectionFontColor
    }
  };
}

export function getEffectiveSectionBold(state: PerformanceState) {
  return state.sectionBoldByProfile?.[state.activeProfile] ?? state.sectionBold ?? true;
}

export function sectionBoldUpdate(state: PerformanceState, sectionBold: boolean): Partial<PerformanceState> {
  return {
    sectionBold,
    sectionBoldByProfile: {
      ...(state.sectionBoldByProfile ?? {}),
      [state.activeProfile]: sectionBold
    }
  };
}

export function getEffectiveSectionItalic(state: PerformanceState) {
  return state.sectionItalicByProfile?.[state.activeProfile] ?? state.sectionItalic ?? false;
}

export function sectionItalicUpdate(state: PerformanceState, sectionItalic: boolean): Partial<PerformanceState> {
  return {
    sectionItalic,
    sectionItalicByProfile: {
      ...(state.sectionItalicByProfile ?? {}),
      [state.activeProfile]: sectionItalic
    }
  };
}

export function getEffectiveSectionUppercase(state: PerformanceState) {
  return state.sectionUppercaseByProfile?.[state.activeProfile] ?? state.sectionUppercase ?? true;
}

export function sectionUppercaseUpdate(state: PerformanceState, sectionUppercase: boolean): Partial<PerformanceState> {
  return {
    sectionUppercase,
    sectionUppercaseByProfile: {
      ...(state.sectionUppercaseByProfile ?? {}),
      [state.activeProfile]: sectionUppercase
    }
  };
}

export function getEffectiveSectionSpacingBefore(state: PerformanceState) {
  const profileSpacing = state.sectionSpacingBeforeByProfile?.[state.activeProfile];
  return clampRange(profileSpacing ?? state.sectionSpacingBefore ?? 28, 0, 96, 28);
}

export function sectionSpacingBeforeUpdate(state: PerformanceState, sectionSpacingBefore: number): Partial<PerformanceState> {
  const nextSpacing = clampRange(sectionSpacingBefore, 0, 96, 28);
  return {
    sectionSpacingBefore: nextSpacing,
    sectionSpacingBeforeByProfile: {
      ...(state.sectionSpacingBeforeByProfile ?? {}),
      [state.activeProfile]: nextSpacing
    }
  };
}

export function getEffectiveSectionSpacingAfter(state: PerformanceState) {
  const profileSpacing = state.sectionSpacingAfterByProfile?.[state.activeProfile];
  return clampRange(profileSpacing ?? state.sectionSpacingAfter ?? 8, 0, 64, 8);
}

export function sectionSpacingAfterUpdate(state: PerformanceState, sectionSpacingAfter: number): Partial<PerformanceState> {
  const nextSpacing = clampRange(sectionSpacingAfter, 0, 64, 8);
  return {
    sectionSpacingAfter: nextSpacing,
    sectionSpacingAfterByProfile: {
      ...(state.sectionSpacingAfterByProfile ?? {}),
      [state.activeProfile]: nextSpacing
    }
  };
}

export function getEffectiveShowHarmonyCues(state: PerformanceState) {
  return state.showHarmonyCuesByProfile?.[state.activeProfile] ?? state.showHarmonyCues ?? true;
}

export function showHarmonyCuesUpdate(state: PerformanceState, showHarmonyCues: boolean): Partial<PerformanceState> {
  return {
    showHarmonyCues,
    showHarmonyCuesByProfile: {
      ...(state.showHarmonyCuesByProfile ?? {}),
      [state.activeProfile]: showHarmonyCues
    }
  };
}

export function getEffectiveHarmonyTextColor(state: PerformanceState) {
  return state.harmonyTextColorsByProfile?.[state.activeProfile] ?? state.harmonyTextColor ?? 'dark-blue';
}

export function harmonyTextColorUpdate(state: PerformanceState, harmonyTextColor: string): Partial<PerformanceState> {
  return {
    harmonyTextColor,
    harmonyTextColorsByProfile: {
      ...(state.harmonyTextColorsByProfile ?? {}),
      [state.activeProfile]: harmonyTextColor
    }
  };
}

export function getEffectiveHarmonyIconColor(state: PerformanceState) {
  return state.harmonyIconColorsByProfile?.[state.activeProfile] ?? state.harmonyIconColor ?? 'blue-purple';
}

export function harmonyIconColorUpdate(state: PerformanceState, harmonyIconColor: string): Partial<PerformanceState> {
  return {
    harmonyIconColor,
    harmonyIconColorsByProfile: {
      ...(state.harmonyIconColorsByProfile ?? {}),
      [state.activeProfile]: harmonyIconColor
    }
  };
}

export function getEffectiveHarmonyItalic(state: PerformanceState) {
  return state.harmonyItalicByProfile?.[state.activeProfile] ?? state.harmonyItalic ?? true;
}

export function harmonyItalicUpdate(state: PerformanceState, harmonyItalic: boolean): Partial<PerformanceState> {
  return {
    harmonyItalic,
    harmonyItalicByProfile: {
      ...(state.harmonyItalicByProfile ?? {}),
      [state.activeProfile]: harmonyItalic
    }
  };
}

export function getEffectiveHarmonyUnderline(state: PerformanceState) {
  return state.harmonyUnderlineByProfile?.[state.activeProfile] ?? state.harmonyUnderline ?? true;
}

export function harmonyUnderlineUpdate(state: PerformanceState, harmonyUnderline: boolean): Partial<PerformanceState> {
  return {
    harmonyUnderline,
    harmonyUnderlineByProfile: {
      ...(state.harmonyUnderlineByProfile ?? {}),
      [state.activeProfile]: harmonyUnderline
    }
  };
}

export function getEffectiveHarmonyIconVisible(state: PerformanceState) {
  return state.harmonyIconVisibleByProfile?.[state.activeProfile] ?? state.harmonyIconVisible ?? true;
}

export function harmonyIconVisibleUpdate(state: PerformanceState, harmonyIconVisible: boolean): Partial<PerformanceState> {
  return {
    harmonyIconVisible,
    harmonyIconVisibleByProfile: {
      ...(state.harmonyIconVisibleByProfile ?? {}),
      [state.activeProfile]: harmonyIconVisible
    }
  };
}

export function getEffectiveDocumentTheme(state: PerformanceState) {
  return state.documentThemesByProfile?.[state.activeProfile] ?? state.documentTheme ?? 'standard-white';
}

export function documentThemeUpdate(state: PerformanceState, documentTheme: StageDocumentThemeName): Partial<PerformanceState> {
  return {
    documentTheme,
    documentThemesByProfile: {
      ...(state.documentThemesByProfile ?? {}),
      [state.activeProfile]: documentTheme
    }
  };
}

export function getDocumentThemePreset(value: StageDocumentThemeName) {
  return documentThemeOptions.find((option) => option.value === value) ?? documentThemeOptions[0];
}

export function getEffectiveStageFontFamily(state: PerformanceState) {
  return state.stageFontFamiliesByProfile?.[state.activeProfile] ?? state.stageFontFamily ?? 'helvetica-sans';
}

export function stageFontFamilyUpdate(state: PerformanceState, stageFontFamily: StageFontFamilyName): Partial<PerformanceState> {
  return {
    stageFontFamily,
    stageFontFamiliesByProfile: {
      ...(state.stageFontFamiliesByProfile ?? {}),
      [state.activeProfile]: stageFontFamily
    }
  };
}

export function resolveStageFontFamily(value: StageFontFamilyName) {
  return stageFontFamilyOptions.find((option) => option.value === value)?.family ?? stageFontFamilyOptions[0].family;
}

export function getEffectiveUseMonospaceChords(state: PerformanceState) {
  return state.useMonospaceChordsByProfile?.[state.activeProfile] ?? state.useMonospaceChords ?? false;
}

export function useMonospaceChordsUpdate(state: PerformanceState, useMonospaceChords: boolean): Partial<PerformanceState> {
  return {
    useMonospaceChords,
    useMonospaceChordsByProfile: {
      ...(state.useMonospaceChordsByProfile ?? {}),
      [state.activeProfile]: useMonospaceChords
    }
  };
}

export function resolveChordHighlightColor(value: string) {
  if (value.startsWith('#')) return value;
  return chordHighlightOptions.find((option) => option.value === value)?.color ?? 'transparent';
}

export function resolveChordFontColor(value: string) {
  if (value.startsWith('#')) return value;
  return chordFontColorOptions.find((option) => option.value === value)?.color ?? '#d9ad65';
}

export function resolveSectionFontColor(value: string) {
  if (value.startsWith('#')) return value;
  return sectionFontColorOptions.find((option) => option.value === value)?.color ?? '#f2c66d';
}

export function resolveHarmonyColor(value: string) {
  if (value.startsWith('#')) return value;
  return harmonyColorOptions.find((option) => option.value === value)?.color ?? '#1e3a8a';
}

function clampRange(value: number, min: number, max: number, fallback: number) {
  if (!Number.isFinite(value)) return fallback;
  return Math.max(min, Math.min(max, Math.round(value)));
}

function clampNumber(value: number, min: number, max: number, fallback: number) {
  if (!Number.isFinite(value)) return fallback;
  return Math.max(min, Math.min(max, value));
}

export function chartRowSpacingPx(lyricFontSize: number, lineSpacing: number) {
  return Math.round(lyricFontSize * (lineSpacing - 1));
}

export function chartLineHeightEm(lineSpacing: number) {
  return Math.max(1, 1.35 * lineSpacing);
}

export function anchoredChordLineLayout(lyricFontSize: number, chordFontSize: number, lineSpacing = 1) {
  const chordAreaHeight = Math.ceil(chordFontSize * 1.2);
  const gap = Math.max(4, Math.ceil(chordFontSize * 0.2));
  const lyricLineHeight = Math.ceil(lyricFontSize * 1.35);
  const rowSpacing = chartRowSpacingPx(lyricFontSize, lineSpacing);
  return {
    chordAreaHeight,
    gap,
    lyricLineHeight,
    lyricTop: chordAreaHeight + gap,
    rowSpacing,
    totalLineHeight: chordAreaHeight + gap + lyricLineHeight
  };
}
