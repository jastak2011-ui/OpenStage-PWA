import assert from 'node:assert/strict';
import {
  advanceVirtualScrollTop,
  applyAutoscrollSpeedMultiplier,
  calculateAutoscrollPixelsPerSecond,
  detectAutoscrollHeartbeatStall,
  estimateBpmAutoscrollDurationSeconds
} from './autoscroll-test-target.mjs';
import {
  adjustAutoscrollSpeedMultiplier,
  autoscrollSpeedQuickPresets,
  shouldOpenAutoscrollSpeedPopover
} from './autoscrollButton-test-target.mjs';
import { parseDurationInput } from './format-test-target.mjs';
import { applyPerformanceChordTransform } from './chords-test-target.mjs';
import {
  chordOverTextToAnchoredLine,
  chordTokensToAnchoredLine,
  convertInlineChordLine,
  inlineChordsToChordOverLyrics,
  nearestLyricAnchorIndex
} from './chordLayout-test-target.mjs';
import { parseChordPro } from './chordpro-test-target.mjs';
import { harmonyTextRuns, isRangeInsideHarmonyMarkup, lyricHarmonyRenderModel, lyricHarmonyRenderModelFromParsed, markHarmonyRange, parseHarmonyText, removeHarmonyRange, stripHarmonyMarkup } from './harmony-test-target.mjs';
import { createId } from './ids-test-target.mjs';
import { parseCsvSongs, parseJsonSongs, songsToCsv, songsToJson } from './importExport-test-target.mjs';
import { parseWebpageChartText } from './webpageChartImport-test-target.mjs';
import { getStageSwipeDirection } from './stageGestures-test-target.mjs';
import { findSharedSongDuplicate } from './sharedSongImport-test-target.mjs';
import { applyStageHarmonyEdit } from './stageHarmonyEdit-test-target.mjs';
import { clampTempoBpm, nextTempoBeat, nextTempoCountdownSeconds, normalizeTempoBpm, parseTempoBpmInput, shouldOpenTempoAdjustmentPanel, shouldShowTempoMeter, shouldToggleTempoOnPointerEnd, stepTempoBpm, tempoDotTone, tempoIntervalMs } from './tempo-test-target.mjs';
import { getEffectivePrompterCapo, getPrompterCapoTransposeOffset, normalizePrompterCapoMode, normalizePrompterCapoValue } from './prompterCapo-test-target.mjs';
import { appleTvPortraitPrompterSettings, calculateExternalPrompterLayout, normalizeExternalDisplaySettings } from '../services/externalDisplay-test-target.mjs';
import {
  anchoredChordLineLayout,
  chartLineHeightEm,
  chartRowSpacingPx,
  chordFontSizeUpdate,
  chordVerticalOffsetUpdate,
  clampChordFontSize,
  getEffectiveChordFontSize,
  getEffectiveChordVerticalOffset,
  getEffectiveHarmonyUnderline,
  getEffectiveLineSpacing,
  getEffectiveShowChords,
  getEffectiveSongArtistBold,
  getEffectiveSongArtistFontSize,
  getEffectiveSongTitleBold,
  getEffectiveSongTitleFontSize,
  harmonyUnderlineUpdate,
  lineSpacingUpdate,
  showChordsUpdate,
  songArtistBoldUpdate,
  songArtistFontSizeUpdate,
  songTitleBoldUpdate,
  songTitleFontSizeUpdate
} from './displaySettings-test-target.mjs';
import { isOnSongArchiveFileName, parseOnSongKeyedArchive } from './onsongArchive-test-target.mjs';
import { addSongToSetlist, createNamedSetlist, getStageSongAt, removeSongFromSetlist, sortSetlistSongIds } from './setlists-test-target.mjs';
import { clearRenderCache, getRenderCacheSize, renderSong } from '../services/rendering/songRenderer-test-target.mjs';

assert.equal(parseDurationInput('2'), 120);
assert.equal(parseDurationInput('2:00'), 120);
assert.equal(parseDurationInput('3:45'), 225);
assert.equal(parseDurationInput('03:45'), 225);
assert.equal(parseDurationInput('1:02:30'), 3750);
assert.equal(parseDurationInput('3:99'), undefined);

assert.equal(normalizeTempoBpm(120), 120);
assert.equal(normalizeTempoBpm('90'), 90);
assert.equal(normalizeTempoBpm(0), null);
assert.equal(normalizeTempoBpm(undefined), null);
assert.equal(clampTempoBpm(39), 40);
assert.equal(clampTempoBpm(241), 240);
assert.equal(parseTempoBpmInput('120'), 120);
assert.equal(parseTempoBpmInput('40'), 40);
assert.equal(parseTempoBpmInput('240'), 240);
assert.equal(parseTempoBpmInput('39'), null);
assert.equal(parseTempoBpmInput('241'), null);
assert.equal(parseTempoBpmInput('abc'), null);
assert.equal(stepTempoBpm(120, 1), 121);
assert.equal(stepTempoBpm(40, -1), 40);
assert.equal(stepTempoBpm(240, 1), 240);
assert.equal(shouldOpenTempoAdjustmentPanel(499), false);
assert.equal(shouldOpenTempoAdjustmentPanel(500), true);
assert.equal(shouldToggleTempoOnPointerEnd(false), true);
assert.equal(shouldToggleTempoOnPointerEnd(true), false);
assert.equal(shouldShowTempoMeter(false, false), false);
assert.equal(shouldShowTempoMeter(false, true), true);
assert.equal(shouldShowTempoMeter(true, false), true);
assert.equal(shouldShowTempoMeter(false, false, true), true);
assert.equal(nextTempoCountdownSeconds(1000, 1000), 10);
assert.equal(nextTempoCountdownSeconds(1000, 1550), 10);
assert.equal(nextTempoCountdownSeconds(1000, 2000), 9);
assert.equal(nextTempoCountdownSeconds(1000, 11000), 0);
assert.equal(tempoIntervalMs(120), 500);
assert.equal(tempoIntervalMs(60), 1000);
assert.equal(nextTempoBeat(null), 0);
assert.equal(nextTempoBeat(0), 1);
assert.equal(nextTempoBeat(1), 2);
assert.equal(nextTempoBeat(2), 3);
assert.equal(nextTempoBeat(3), 0);
assert.equal(tempoDotTone(0, 0), 'gold');
assert.equal(tempoDotTone(1, 1), 'purple');
assert.equal(tempoDotTone(2, 2), 'purple');
assert.equal(tempoDotTone(3, 3), 'purple');
assert.equal(tempoDotTone(1, 0), 'dim');

const favoriteCsvSong = parseCsvSongs('title,artist,favorite,chart\n"Favorite Tune","OpenStage","true","[G]Go"')[0];
assert.equal(favoriteCsvSong.favorite, true);
const referenceAudioCsvSong = parseCsvSongs('title,referenceAudioUrl,chart\n"Reference Tune","https://example.com/ref.mp3","[G]Go"')[0];
assert.equal(referenceAudioCsvSong.referenceAudioUrl, 'https://example.com/ref.mp3');
const exportedFavoriteCsv = songsToCsv([favoriteCsvSong]);
assert.match(exportedFavoriteCsv.split('\n')[0], /favorite/);
assert.match(songsToCsv([referenceAudioCsvSong]).split('\n')[0], /referenceAudioUrl/);
assert.match(exportedFavoriteCsv, /"true"/);
const favoriteJsonSong = parseJsonSongs(songsToJson([favoriteCsvSong]))[0];
assert.equal(favoriteJsonSong.favorite, true);
const referenceAudioJsonSong = parseJsonSongs(songsToJson([referenceAudioCsvSong]))[0];
assert.equal(referenceAudioJsonSong.referenceAudioUrl, 'https://example.com/ref.mp3');
const legacyJsonSong = parseJsonSongs('[{"title":"Legacy Tune","chart":"[C]Old"}]')[0];
assert.equal(legacyJsonSong.favorite, false);
const webpageChordOver = parseWebpageChartText(`3AM
Matchbox 20
Capo 1
Key G
BPM 108
Tuning: Standard
Advertisement

G        C
She says it's cold outside
Comments`);
assert.equal(webpageChordOver.song.title, '3AM');
assert.equal(webpageChordOver.song.artist, 'Matchbox 20');
assert.equal(webpageChordOver.song.key, 'G');
assert.equal(webpageChordOver.song.capo, 1);
assert.equal(webpageChordOver.song.bpm, 108);
assert.equal(webpageChordOver.song.displayPreference, 'chords-over');
assert.match(webpageChordOver.cleanedText, /G        C\nShe says it's cold outside/);
assert.equal(webpageChordOver.removedLines.includes('Advertisement'), true);
const webpageInline = parseWebpageChartText(`Take On Me
A-ha

[G]Talking away
Rating`);
assert.equal(webpageInline.song.title, 'Take On Me');
assert.equal(webpageInline.song.artist, 'A-ha');
assert.equal(webpageInline.song.displayPreference, 'inline');
assert.equal(webpageInline.cleanedText, '[G]Talking away');

const sharedSongImportedOnce = {
  id: 'local-shared-song',
  songUuid: 'shared-song-uuid',
  version: 2,
  importedFromShareId: 'abc123',
  sourceShareId: 'abc123',
  title: 'Shared Tune',
  artist: 'OpenStage',
  key: 'G',
  capo: 0,
  bpm: 100,
  timeSignature: '4/4',
  tags: [],
  notes: '',
  chart: 'Intro:\nC G Am F',
  favorite: false,
  updatedAt: '2026-01-01T00:00:00.000Z'
};
const sameSharedLinkIncoming = {
  ...sharedSongImportedOnce,
  id: 'incoming-shared-song',
  importedAt: '2026-01-02T00:00:00.000Z',
  sharedSource: 'OpenStage Share'
};
const sameSharedLinkDuplicate = findSharedSongDuplicate([sharedSongImportedOnce], sameSharedLinkIncoming);
assert.equal(sameSharedLinkDuplicate?.matchType, 'shareId');
assert.equal(sameSharedLinkDuplicate?.existing.id, 'local-shared-song');

const sharedSongWithoutShareMetadata = {
  ...sameSharedLinkIncoming,
  importedFromShareId: '',
  sourceShareId: ''
};
const sharedSongUuidDuplicate = findSharedSongDuplicate([sharedSongImportedOnce], sharedSongWithoutShareMetadata);
assert.equal(sharedSongUuidDuplicate?.matchType, 'songUuid');

const sharedSongTitleArtistFallback = findSharedSongDuplicate(
  [{ ...sharedSongImportedOnce, songUuid: '', importedFromShareId: '', sourceShareId: '' }],
  { ...sameSharedLinkIncoming, songUuid: '', importedFromShareId: '', sourceShareId: '' }
);
assert.equal(sharedSongTitleArtistFallback?.matchType, 'title-artist');

const harmonyText = parseHarmonyText('Take it [HARMONY]easy[/HARMONY]');
assert.equal(harmonyText.text, 'Take it easy');
assert.deepEqual(harmonyText.ranges, [{ start: 8, end: 12 }]);
const standalonePlainHarmony = parseHarmonyText('[HARMONY]ooh ooh ooh, ooh ooh ooh[/HARMONY]');
assert.equal(standalonePlainHarmony.text, 'ooh ooh ooh, ooh ooh ooh');
assert.deepEqual(standalonePlainHarmony.ranges, [{ start: 0, end: 'ooh ooh ooh, ooh ooh ooh'.length }]);
const exactStandaloneHarmony = lyricHarmonyRenderModel('[HARMONY]ooh...ooh....ooh...ooh[/HARMONY]', { showHarmonyCues: true, harmonyIconVisible: true });
assert.equal(exactStandaloneHarmony.text, 'ooh...ooh....ooh...ooh');
assert.equal(exactStandaloneHarmony.showIcon, true);
assert.deepEqual(exactStandaloneHarmony.runs.map((run) => ({ text: run.text, styled: run.styled })), [
  { text: 'ooh...ooh....ooh...ooh', styled: true }
]);
const parentheticalHarmony = lyricHarmonyRenderModel('[HARMONY](ooh...ooh....ooh...ooh)[/HARMONY]', { showHarmonyCues: true, harmonyIconVisible: true });
assert.deepEqual(parentheticalHarmony.runs.map((run) => ({ text: run.text, styled: run.styled })), [
  { text: '(ooh...ooh....ooh...ooh)', styled: true }
]);
const harmonyCuesOff = lyricHarmonyRenderModel('[HARMONY]ooh...ooh....ooh...ooh[/HARMONY]', { showHarmonyCues: false, harmonyIconVisible: true });
assert.equal(harmonyCuesOff.text, 'ooh...ooh....ooh...ooh');
assert.equal(harmonyCuesOff.showIcon, false);
assert.equal(harmonyCuesOff.runs.every((run) => !run.styled), true);
assert.deepEqual(
  harmonyTextRuns('Lead lyric [HARMONY]backup phrase[/HARMONY] rest of line').map((run) => ({ text: run.text, harmony: run.harmony })),
  [
    { text: 'Lead lyric ', harmony: false },
    { text: 'backup phrase', harmony: true },
    { text: ' rest of line', harmony: false }
  ]
);
assert.deepEqual(
  lyricHarmonyRenderModel('Take it [HARMONY]EASY[/HARMONY], take it [HARMONY]EASY[/HARMONY]').runs.map((run) => ({ text: run.text, styled: run.styled })),
  [
    { text: 'Take it ', styled: false },
    { text: 'EASY', styled: true },
    { text: ', take it ', styled: false },
    { text: 'EASY', styled: true }
  ]
);
assert.equal(stripHarmonyMarkup('[HARMONY]Full line[/HARMONY]'), 'Full line');
assert.equal(markHarmonyRange('Take it easy', 8, 12), 'Take it [HARMONY]easy[/HARMONY]');
assert.equal(markHarmonyRange('(ooh...ooh....ooh...ooh)', 0, 25), '[HARMONY](ooh...ooh....ooh...ooh)[/HARMONY]');
assert.equal(isRangeInsideHarmonyMarkup('Take it [HARMONY]easy[/HARMONY]', 17, 21), true);
assert.equal(removeHarmonyRange('Take it [HARMONY]easy[/HARMONY]', 17, 21), 'Take it easy');
assert.equal(applyStageHarmonyEdit('Plain lyric line', 6, 11, 'mark'), 'Plain [HARMONY]lyric[/HARMONY] line');
assert.equal(applyStageHarmonyEdit('[G]Take it easy', 11, 15, 'mark'), '[G]Take it [HARMONY]easy[/HARMONY]');
assert.equal(applyStageHarmonyEdit('(ooh...ooh....ooh...ooh)', 0, 25, 'mark'), '[HARMONY](ooh...ooh....ooh...ooh)[/HARMONY]');
assert.equal(applyStageHarmonyEdit('Take it [HARMONY]easy[/HARMONY]', 17, 21, 'remove'), 'Take it easy');
const noSelectionHarmony = markHarmonyRange('Verse line\n(ooh...ooh....ooh...ooh)\nNext line', 12, 12);
assert.equal(noSelectionHarmony, 'Verse line\n[HARMONY](ooh...ooh....ooh...ooh)[/HARMONY]\nNext line');
assert.equal(removeHarmonyRange('Take it [HARMONY]easy[/HARMONY]', 0, 999), 'Take it easy');
const harmonyCsvSong = parseCsvSongs('title,chart\n"Harmony Tune","[G]Take it [HARMONY]easy[/HARMONY]"')[0];
assert.equal(harmonyCsvSong.chart, '[G]Take it [HARMONY]easy[/HARMONY]');
assert.equal(songsToJson([harmonyCsvSong]).includes('[HARMONY]easy[/HARMONY]'), true);
const parsedStandaloneHarmony = parseChordPro('[HARMONY]ooh...ooh....ooh...ooh[/HARMONY]');
assert.equal(parsedStandaloneHarmony.lines[0].type, 'lyrics');
assert.equal(parsedStandaloneHarmony.lines[0].tokens.map((token) => token.value).join(''), '[HARMONY]ooh...ooh....ooh...ooh[/HARMONY]');
assert.equal(getStageSwipeDirection({ startX: 240, startY: 200, endX: 120, endY: 210 }), 1);
assert.equal(getStageSwipeDirection({ startX: 120, startY: 200, endX: 240, endY: 210 }), -1);
assert.equal(getStageSwipeDirection({ startX: 120, startY: 200, endX: 155, endY: 205 }), 0);
assert.equal(getStageSwipeDirection({ startX: 120, startY: 200, endX: 190, endY: 300 }), 0);

const baseDisplayState = {
  activeProfile: 'desktop',
  showChords: true,
  showChordsByProfile: {}
};
assert.equal(getEffectiveShowChords(baseDisplayState), true);
const hiddenDesktopChords = { ...baseDisplayState, ...showChordsUpdate(baseDisplayState, false) };
assert.equal(getEffectiveShowChords(hiddenDesktopChords), false);
const iphoneChordProfile = {
  ...hiddenDesktopChords,
  activeProfile: 'iphone',
  showChordsByProfile: {
    ...hiddenDesktopChords.showChordsByProfile,
    iphone: true
  }
};
assert.equal(getEffectiveShowChords(iphoneChordProfile), true);

const standardExternal = normalizeExternalDisplaySettings(undefined);
assert.equal(standardExternal.outputMode, 'standard');
assert.equal(standardExternal.offsetX, 0);
const airPlaySettings = appleTvPortraitPrompterSettings(standardExternal);
assert.equal(airPlaySettings.outputMode, 'airplay-portrait-fill');
assert.equal(airPlaySettings.profileName, 'Apple TV Portrait Prompter');
assert.equal(airPlaySettings.rotation, 'cw-90');
assert.equal(airPlaySettings.scaleMode, 'fill');
const airPlayLayout = calculateExternalPrompterLayout(airPlaySettings, 1920, 1080);
assert.equal(airPlayLayout.isQuarterTurn, true);
assert.equal(airPlayLayout.contentWidth, 1080);
assert.equal(airPlayLayout.contentHeight, 1920);
assert.equal(airPlayLayout.rotatedWidth, 1920);
assert.equal(airPlayLayout.rotatedHeight, 1080);
assert.equal(airPlayLayout.contentTransform.includes('rotate(90deg)'), true);
assert.equal(airPlayLayout.scale > 0.9, true);

assert.equal(calculateAutoscrollPixelsPerSecond(450, 120, 18), 3.75);
assert.equal(calculateAutoscrollPixelsPerSecond(450, 225, 18), 2);
assert.equal(calculateAutoscrollPixelsPerSecond(450, undefined, 18), 18);
assert.equal(applyAutoscrollSpeedMultiplier(calculateAutoscrollPixelsPerSecond(450, 120, 18), 0.5), 1.875);
assert.equal(applyAutoscrollSpeedMultiplier(calculateAutoscrollPixelsPerSecond(450, 225, 18), 3), 6);
assert.equal(applyAutoscrollSpeedMultiplier(calculateAutoscrollPixelsPerSecond(450, undefined, 18), 2), 36);

const slowFrame = advanceVirtualScrollTop(10, 1 / 60, 1.2, 100);
assert.equal(slowFrame.reachedEnd, false);
assert.equal(slowFrame.nextScrollTop > 10, true);
assert.equal(slowFrame.nextScrollTop < 11, true);

const liveSpeedBase = calculateAutoscrollPixelsPerSecond(600, 300, 18);
let liveMultiplier = 0.25;
let liveFinal = applyAutoscrollSpeedMultiplier(liveSpeedBase, liveMultiplier);
const liveSlowFrame = advanceVirtualScrollTop(0, 1, liveFinal, 600);
liveMultiplier = 3;
liveFinal = applyAutoscrollSpeedMultiplier(liveSpeedBase, liveMultiplier);
const liveFastFrame = advanceVirtualScrollTop(0, 1, liveFinal, 600);
assert.equal(liveFastFrame.nextScrollTop > liveSlowFrame.nextScrollTop * 10, true);
assert.equal(shouldOpenAutoscrollSpeedPopover(499), false);
assert.equal(shouldOpenAutoscrollSpeedPopover(500), true);
assert.equal(adjustAutoscrollSpeedMultiplier(1, 0.05), 1.05);
assert.equal(adjustAutoscrollSpeedMultiplier(1, -0.05), 0.95);
assert.equal(adjustAutoscrollSpeedMultiplier(0.25, -0.05), 0.25);
assert.equal(adjustAutoscrollSpeedMultiplier(3, 0.05), 3);
assert.deepEqual([...autoscrollSpeedQuickPresets], [0.75, 1, 1.25, 1.5]);

const endFrame = advanceVirtualScrollTop(99.5, 1, 2, 100);
assert.deepEqual(endFrame, { nextScrollTop: 100, reachedEnd: true });
assert.equal(detectAutoscrollHeartbeatStall(true, 2000, 1000, 750), true);
assert.equal(detectAutoscrollHeartbeatStall(true, 1200, 1000, 750), false);
assert.equal(detectAutoscrollHeartbeatStall(false, 2000, 1000, 750), false);

const bpm80 = estimateBpmAutoscrollDurationSeconds({
  bpm: 80,
  lyricLineCount: 40,
  sectionMarkerCount: 4,
  maxScroll: 2400,
  clientHeight: 600,
  scrollHeight: 3000,
  fontSize: 34,
  readingPaceMultiplier: 1
});
const bpm120 = estimateBpmAutoscrollDurationSeconds({
  bpm: 120,
  lyricLineCount: 40,
  sectionMarkerCount: 4,
  maxScroll: 2400,
  clientHeight: 600,
  scrollHeight: 3000,
  fontSize: 34,
  readingPaceMultiplier: 1
});
assert.equal(Boolean(bpm80 && bpm120 && bpm80.durationSeconds > bpm120.durationSeconds), true);

const shortViewport = estimateBpmAutoscrollDurationSeconds({
  bpm: 100,
  lyricLineCount: 40,
  sectionMarkerCount: 4,
  maxScroll: 3000,
  clientHeight: 450,
  scrollHeight: 3450,
  fontSize: 34,
  readingPaceMultiplier: 1
});
const tallViewport = estimateBpmAutoscrollDurationSeconds({
  bpm: 100,
  lyricLineCount: 40,
  sectionMarkerCount: 4,
  maxScroll: 1800,
  clientHeight: 900,
  scrollHeight: 2700,
  fontSize: 34,
  readingPaceMultiplier: 1
});
assert.equal(Boolean(shortViewport && tallViewport && shortViewport.durationSeconds > tallViewport.durationSeconds), true);

const portrait = estimateBpmAutoscrollDurationSeconds({
  bpm: 100,
  lyricLineCount: 40,
  sectionMarkerCount: 4,
  maxScroll: 2400,
  clientHeight: 600,
  scrollHeight: 3000,
  fontSize: 34,
  readingPaceMultiplier: 1,
  portraitMode: true
});
const landscape = estimateBpmAutoscrollDurationSeconds({
  bpm: 100,
  lyricLineCount: 40,
  sectionMarkerCount: 4,
  maxScroll: 2400,
  clientHeight: 600,
  scrollHeight: 3000,
  fontSize: 34,
  readingPaceMultiplier: 1
});
assert.equal(Boolean(portrait && landscape && portrait.durationSeconds > landscape.durationSeconds), true);

const smallFont = estimateBpmAutoscrollDurationSeconds({
  bpm: 100,
  lyricLineCount: 40,
  sectionMarkerCount: 4,
  maxScroll: 1900,
  clientHeight: 700,
  scrollHeight: 2600,
  fontSize: 28,
  readingPaceMultiplier: 1
});
const largeFont = estimateBpmAutoscrollDurationSeconds({
  bpm: 100,
  lyricLineCount: 40,
  sectionMarkerCount: 4,
  maxScroll: 3100,
  clientHeight: 700,
  scrollHeight: 3800,
  fontSize: 48,
  readingPaceMultiplier: 1
});
assert.equal(Boolean(smallFont && largeFont && largeFont.durationSeconds > smallFont.durationSeconds), true);

assert.equal(applyPerformanceChordTransform('G', 0, 0), 'G');
assert.equal(applyPerformanceChordTransform('G', 0, 2), 'F');
assert.equal(applyPerformanceChordTransform('G', 0, 3), 'E');
assert.equal(applyPerformanceChordTransform('D/F#', 0, 2), 'C/E');
assert.equal(applyPerformanceChordTransform('G', 2, 2), 'G');

assert.equal(convertInlineChordLine('[G]Amazing [C]grace'), 'G       C\nAmazing grace');
assert.equal(convertInlineChordLine('[D/F#]Walk down'), 'D/F#\nWalk down');
assert.equal(convertInlineChordLine('[G]Amazing [C]grace how [D]sweet the [G]sound').split('\n').length, 2);
assert.equal(convertInlineChordLine('[Bbmaj7]Soft [F#m7b5]line').includes('Bbmaj7'), true);
assert.equal(convertInlineChordLine('No chords here'), 'No chords here');
assert.equal(inlineChordsToChordOverLyrics('{start_of_chorus}\n[G]Sing\n\nPlain'), '{start_of_chorus}\nG\nSing\n\nPlain');

const anchoredInline = chordTokensToAnchoredLine([
  { type: 'chord', value: 'F', display: 'F' },
  { type: 'text', value: 'Sirens ring, the shots ring ', display: 'Sirens ring, the shots ring ' },
  { type: 'chord', value: 'C', display: 'C' },
  { type: 'text', value: 'out, A stranger ', display: 'out, A stranger ' },
  { type: 'chord', value: 'Gm', display: 'Gm' },
  { type: 'text', value: 'cries', display: 'cries' }
]);
assert.equal(anchoredInline.lyricLine, 'Sirens ring, the shots ring out, A stranger cries');
assert.deepEqual(anchoredInline.anchors, [
  { chord: 'F', index: 0 },
  { chord: 'C', index: 'Sirens ring, the shots ring '.length },
  { chord: 'Gm', index: 'Sirens ring, the shots ring out, A stranger '.length }
]);
const harmonyAnchored = chordTokensToAnchoredLine([
  { type: 'chord', value: 'G', display: 'G' },
  { type: 'text', value: 'Take it [HARMONY]easy[/HARMONY]', display: 'Take it [HARMONY]easy[/HARMONY]' }
]);
assert.equal(harmonyAnchored.lyricLine, 'Take it easy');
assert.deepEqual(harmonyAnchored.anchors, [{ chord: 'G', index: 0 }]);
assert.deepEqual(harmonyAnchored.harmonyRanges, [{ start: 8, end: 12 }]);
[14, 24, 36].forEach((fontSize) => {
  assert.deepEqual(
    anchoredInline.anchors.map((anchor) => anchor.index),
    [0, 28, 44],
    `chord anchors drifted at ${fontSize}px`
  );
});

const anchoredChordOver = chordOverTextToAnchoredLine('F                             C               Gm', 'Sirens ring, the shots ring out, A stranger cries');
assert.deepEqual(anchoredChordOver.anchors, [
  { chord: 'F', index: 0 },
  { chord: 'C', index: 30 },
  { chord: 'Gm', index: 46 }
]);
const harmonyChordOver = chordOverTextToAnchoredLine('G        C', 'Take it [HARMONY]easy[/HARMONY]');
assert.equal(harmonyChordOver.lyricLine, 'Take it easy');
assert.deepEqual(harmonyChordOver.harmonyRanges, [{ start: 8, end: 12 }]);

const longWrappingLyric = 'This is a very long lyric line that should wrap instead of disappearing off the right edge of the screen';
const longHarmonyLine = chordTokensToAnchoredLine([
  { type: 'text', value: `[HARMONY]${longWrappingLyric}[/HARMONY]`, display: `[HARMONY]${longWrappingLyric}[/HARMONY]` }
]);
assert.equal(longHarmonyLine.lyricLine, longWrappingLyric);
assert.deepEqual(longHarmonyLine.harmonyRanges, [{ start: 0, end: longWrappingLyric.length }]);
const longInlineLine = chordTokensToAnchoredLine([
  { type: 'chord', value: 'G', display: 'G' },
  { type: 'text', value: longWrappingLyric.slice(0, 36), display: longWrappingLyric.slice(0, 36) },
  { type: 'chord', value: 'Cadd9', display: 'Cadd9' },
  { type: 'text', value: longWrappingLyric.slice(36), display: longWrappingLyric.slice(36) }
]);
assert.equal(longInlineLine.lyricLine, longWrappingLyric);
assert.deepEqual(longInlineLine.anchors, [{ chord: 'G', index: 0 }, { chord: 'Cadd9', index: 36 }]);
const longChordOverLine = chordOverTextToAnchoredLine('G                                   Cadd9', longWrappingLyric);
assert.equal(longChordOverLine.lyricLine, longWrappingLyric);
assert.equal(longChordOverLine.anchors.length, 2);

const twilightLyric = "So you'll come to know    when the bullet hits the bone";
const twilightChordLine = `${' '.repeat(twilightLyric.indexOf('come'))}G${' '.repeat(Math.max(1, twilightLyric.indexOf('when') - twilightLyric.indexOf('come') - 1))}Em${' '.repeat(twilightLyric.length)}Bm`;
const twilightAnchored = chordOverTextToAnchoredLine(twilightChordLine, twilightLyric);
assert.deepEqual(twilightAnchored.anchors, [
  { chord: 'G', index: twilightLyric.indexOf('come') },
  { chord: 'Em', index: twilightLyric.indexOf('when') },
  { chord: 'Bm', index: twilightLyric.indexOf('bone') }
]);
assert.equal(nearestLyricAnchorIndex(twilightLyric, twilightLyric.indexOf('when') - 2), twilightLyric.indexOf('when'));
assert.equal(nearestLyricAnchorIndex(twilightLyric, twilightLyric.length + 8), twilightLyric.indexOf('bone'));

const collisionLyric = "So you'll come to know when the bullet hits the bone";
const collisionChordLine = `Bm${' '.repeat(Math.max(1, collisionLyric.indexOf('come') - 2))}G${' '.repeat(Math.max(1, collisionLyric.indexOf('when') - collisionLyric.indexOf('come') - 1))}Em${' '.repeat(Math.max(1, collisionLyric.indexOf('bone') - collisionLyric.indexOf('when') - 2))}Bm`;
const collisionAnchored = chordOverTextToAnchoredLine(collisionChordLine, collisionLyric);
assert.deepEqual(collisionAnchored.anchors, [
  { chord: 'Bm', index: 0 },
  { chord: 'G', index: collisionLyric.indexOf('come') },
  { chord: 'Em', index: collisionLyric.indexOf('when') },
  { chord: 'Bm', index: collisionLyric.indexOf('bone') }
]);

const displayState = {
  activeProfile: 'desktop',
  chordFontSize: 18,
  chordFontSizesByProfile: {
    desktop: 22,
    tablet: 30
  },
  chordVerticalOffset: 0,
  chordVerticalOffsetsByProfile: {
    desktop: 0,
    tablet: 4
  },
  lineSpacing: 1,
  lineSpacingsByProfile: {
    desktop: 1,
    tablet: 1.25
  },
  songTitleFontSize: 52,
  songTitleFontSizesByProfile: {
    desktop: 56,
    tablet: 64
  },
  songTitleBold: true,
  songTitleBoldByProfile: {
    desktop: true,
    tablet: false
  },
  songArtistFontSize: 30,
  songArtistFontSizesByProfile: {
    desktop: 32,
    tablet: 40
  },
  songArtistBold: false,
  songArtistBoldByProfile: {
    desktop: false,
    tablet: true
  }
};
assert.equal(getEffectiveChordFontSize(displayState), 22);
assert.equal(getEffectiveChordFontSize({ ...displayState, activeProfile: 'tablet' }), 30);
assert.equal(getEffectiveChordFontSize({ ...displayState, activeProfile: 'stage-device', chordFontSize: 20 }), 20);
assert.equal(clampChordFontSize(8), 10);
assert.equal(clampChordFontSize(52), 48);
assert.deepEqual(chordFontSizeUpdate(displayState, 34), {
  chordFontSize: 34,
  chordFontSizesByProfile: {
    desktop: 34,
    tablet: 30
  }
});
assert.equal(getEffectiveChordVerticalOffset({ ...displayState, activeProfile: 'tablet' }), 4);
assert.equal(getEffectiveHarmonyUnderline(displayState), true);
assert.deepEqual(harmonyUnderlineUpdate(displayState, false), {
  harmonyUnderline: false,
  harmonyUnderlineByProfile: {
    desktop: false
  }
});
assert.deepEqual(chordVerticalOffsetUpdate(displayState, -6), {
  chordVerticalOffset: -6,
  chordVerticalOffsetsByProfile: {
    desktop: -6,
    tablet: 4
  }
});
assert.equal(getEffectiveLineSpacing(displayState), 1);
assert.equal(getEffectiveLineSpacing({ ...displayState, activeProfile: 'tablet' }), 1.25);
assert.deepEqual(lineSpacingUpdate(displayState, 1.5), {
  lineSpacing: 1.5,
  lineSpacingsByProfile: {
    desktop: 1.5,
    tablet: 1.25
  }
});
assert.equal(getEffectiveSongTitleFontSize(displayState), 56);
assert.equal(getEffectiveSongTitleFontSize({ ...displayState, activeProfile: 'tablet' }), 64);
assert.deepEqual(songTitleFontSizeUpdate(displayState, 72), {
  songTitleFontSize: 72,
  songTitleFontSizesByProfile: {
    desktop: 72,
    tablet: 64
  }
});
assert.equal(getEffectiveSongTitleBold(displayState), true);
assert.deepEqual(songTitleBoldUpdate(displayState, false), {
  songTitleBold: false,
  songTitleBoldByProfile: {
    desktop: false,
    tablet: false
  }
});
assert.equal(getEffectiveSongArtistFontSize(displayState), 32);
assert.deepEqual(songArtistFontSizeUpdate(displayState, 44), {
  songArtistFontSize: 44,
  songArtistFontSizesByProfile: {
    desktop: 44,
    tablet: 40
  }
});
assert.equal(getEffectiveSongArtistBold({ ...displayState, activeProfile: 'tablet' }), true);
assert.deepEqual(songArtistBoldUpdate(displayState, true), {
  songArtistBold: true,
  songArtistBoldByProfile: {
    desktop: true,
    tablet: true
  }
});
assert.equal(getEffectiveLineSpacing({ ...displayState, lineSpacing: 3, lineSpacingsByProfile: {} }), 2);
assert.equal(chartLineHeightEm(0.8), 1.08);
assert.equal(chartLineHeightEm(1), 1.35);
assert.equal(chartLineHeightEm(1.5), 2.0250000000000004);
assert.equal(chartRowSpacingPx(34, 0.8), -7);
assert.equal(chartRowSpacingPx(34, 1), 0);
assert.equal(chartRowSpacingPx(34, 1.5), 17);

const verticalLayouts = [18, 26, 34, 42].map((chordSize) => anchoredChordLineLayout(34, chordSize));
verticalLayouts.forEach((layout, index) => {
  const chordSize = [18, 26, 34, 42][index];
  assert.equal(layout.chordAreaHeight, Math.ceil(chordSize * 1.2));
  assert.equal(layout.gap, Math.max(4, Math.ceil(chordSize * 0.2)));
  assert.equal(layout.lyricLineHeight, Math.ceil(34 * 1.35));
  assert.equal(layout.lyricTop, layout.chordAreaHeight + layout.gap);
  assert.equal(layout.totalLineHeight, layout.chordAreaHeight + layout.gap + layout.lyricLineHeight);
});
assert.equal(verticalLayouts[0].totalLineHeight < verticalLayouts[1].totalLineHeight, true);
assert.equal(verticalLayouts[1].totalLineHeight < verticalLayouts[2].totalLineHeight, true);
assert.equal(verticalLayouts[2].totalLineHeight < verticalLayouts[3].totalLineHeight, true);

const tightLineLayout = anchoredChordLineLayout(34, 26, 0.8);
const normalLineLayout = anchoredChordLineLayout(34, 26, 1);
const roomyLineLayout = anchoredChordLineLayout(34, 26, 1.5);
assert.equal(tightLineLayout.totalLineHeight, normalLineLayout.totalLineHeight);
assert.equal(roomyLineLayout.totalLineHeight, normalLineLayout.totalLineHeight);
assert.equal(tightLineLayout.rowSpacing < normalLineLayout.rowSpacing, true);
assert.equal(roomyLineLayout.rowSpacing > normalLineLayout.rowSpacing, true);

const lyricSizeLayouts = [24, 28, 34].map((lyricSize) => anchoredChordLineLayout(lyricSize, 26));
lyricSizeLayouts.forEach((layout, index) => {
  const lyricSize = [24, 28, 34][index];
  assert.equal(layout.chordAreaHeight, Math.ceil(26 * 1.2));
  assert.equal(layout.gap, Math.max(4, Math.ceil(26 * 0.2)));
  assert.equal(layout.lyricLineHeight, Math.ceil(lyricSize * 1.35));
  assert.equal(layout.lyricTop, layout.chordAreaHeight + layout.gap);
});
assert.equal(lyricSizeLayouts[0].totalLineHeight < lyricSizeLayouts[1].totalLineHeight, true);
assert.equal(lyricSizeLayouts[1].totalLineHeight < lyricSizeLayouts[2].totalLineHeight, true);

const collisionLayouts = [
  anchoredChordLineLayout(34, 30, 0.8),
  anchoredChordLineLayout(44, 42, 0.75),
  anchoredChordLineLayout(52, 48, 1.5)
];
collisionLayouts.forEach((layout) => {
  assert.equal(layout.gap >= 4, true);
  assert.equal(layout.lyricTop >= layout.chordAreaHeight + layout.gap, true);
  assert.equal(layout.totalLineHeight >= layout.lyricTop + layout.lyricLineHeight, true);
  assert.equal(layout.chordAreaHeight > 0, true);
  assert.equal(layout.lyricLineHeight > 0, true);
});

assert.equal(isOnSongArchiveFileName('All Songs(1).archive'), true);
assert.equal(isOnSongArchiveFileName('song.chopro'), false);

const onsongFixture = {
  $version: 100000,
  $archiver: 'NSKeyedArchiver',
  $top: { root: { $uid: 1 } },
  $objects: [
    '$null',
    { songs: { $uid: 2 } },
    { 'NS.objects': [{ $uid: 3 }, { $uid: 5 }] },
    { song: { $uid: 4 } },
    {
      title: '6th Avenue Heartache',
      byline: 'Wallflowers',
      key: 'F',
      transposedKey: 'G',
      capo: 3,
      tempo: 150,
      duration: 337,
      timeSignature: '4/4',
      content: 'F   C   Gm   Bb\nSirens ring and the streetlights glow',
      filepath: 'Charts/6th Avenue Heartache.txt',
      keywords: ['rock', 'capo']
    },
    { song: { $uid: 6 } },
    {
      title: 'Inline Test',
      byline: 'OpenStage',
      key: 'G',
      transposedKey: '',
      capo: 0,
      tempo: 120,
      duration: '3:45',
      timeSignature: '6/8',
      content: '[G]Amazing [C]grace',
      filepath: 'Charts/Inline Test.txt',
      keywords: 'worship;inline'
    }
  ]
};
const onsongImport = parseOnSongKeyedArchive(onsongFixture, 'All Songs(1).archive');
assert.equal(onsongImport.fileName, 'All Songs(1).archive');
assert.equal(onsongImport.songsFound, 2);
assert.equal(onsongImport.songs[0].song.title, '6th Avenue Heartache');
assert.equal(onsongImport.songs[0].song.artist, 'Wallflowers');
assert.equal(onsongImport.songs[0].song.key, 'F');
assert.equal(onsongImport.songs[0].song.performanceKey, 'G');
assert.equal(onsongImport.songs[0].song.capo, 3);
assert.equal(onsongImport.songs[0].song.bpm, 150);
assert.equal(onsongImport.songs[0].song.durationSeconds, 337);
assert.equal(onsongImport.songs[0].song.timeSignature, '4/4');
assert.equal(onsongImport.songs[0].song.chart, 'F   C   Gm   Bb\nSirens ring and the streetlights glow');
assert.equal(onsongImport.songs[0].song.rawChordPro, onsongImport.songs[0].song.chart);
assert.equal(onsongImport.songs[0].song.displayPreference, 'chords-over');
assert.deepEqual(onsongImport.songs[0].song.tags, ['rock', 'capo']);
assert.equal(onsongImport.songs[0].song.notes, 'Source file: Charts/6th Avenue Heartache.txt');
assert.equal(onsongImport.songs[1].song.durationSeconds, 225);
assert.equal(onsongImport.songs[1].song.displayPreference, 'inline');
assert.deepEqual(onsongImport.songs[1].song.tags, ['worship', 'inline']);

const capoSong = {
  id: 'capo-test-song',
  title: 'Capo Test',
  artist: '',
  key: 'G',
  capo: 3,
  bpm: 0,
  timeSignature: '4/4',
  tags: [],
  notes: '',
  chart: '[G]Hello [D/F#]walk',
  updatedAt: '2026-05-27T00:00:00.000Z'
};
clearRenderCache();
const capoZero = renderSong(capoSong, { transpose: 0, capo: 0, showNashvilleNumbers: false, songKey: 'G' });
assert.equal(capoZero.lines[0].tokens[0].display, 'G');
const capoThree = renderSong(capoSong, { transpose: 0, capo: 3, showNashvilleNumbers: false, songKey: 'G' });
assert.equal(capoThree.lines[0].tokens[0].display, 'E');
assert.equal(capoThree.lines[0].tokens[2].display, 'B/D#');
assert.equal(getRenderCacheSize(), 2);
const transposeCancelsCapo = renderSong(capoSong, { transpose: 2, capo: 2, showNashvilleNumbers: false, songKey: 'G' });
assert.equal(transposeCancelsCapo.lines[0].tokens[0].display, 'G');

clearRenderCache();
renderSong(capoSong, { transpose: 0, capo: 0, showNashvilleNumbers: false, songKey: 'G', lyricFontSize: 24 });
renderSong(capoSong, { transpose: 0, capo: 0, showNashvilleNumbers: false, songKey: 'G', lyricFontSize: 28 });
renderSong(capoSong, { transpose: 0, capo: 0, showNashvilleNumbers: false, songKey: 'G', lyricFontSize: 34 });
assert.equal(getRenderCacheSize(), 3);
clearRenderCache();
renderSong(capoSong, { transpose: 0, capo: 0, showNashvilleNumbers: false, songKey: 'G', songTitleFontSize: 42 });
renderSong(capoSong, { transpose: 0, capo: 0, showNashvilleNumbers: false, songKey: 'G', songTitleFontSize: 64 });
assert.equal(getRenderCacheSize(), 2);
clearRenderCache();
renderSong(capoSong, { transpose: 0, capo: 0, showNashvilleNumbers: false, songKey: 'G', songArtistFontSize: 28 });
renderSong(capoSong, { transpose: 0, capo: 0, showNashvilleNumbers: false, songKey: 'G', songArtistFontSize: 44 });
assert.equal(getRenderCacheSize(), 2);

const chordProMetadataSong = {
  ...capoSong,
  id: 'chordpro-metadata-song',
  title: 'Take On Me',
  artist: 'a-ha',
  chart: '{title: TAKE ON ME}\n{artist: A-HA}\n[G]Talking away',
  parsedChordPro: parseChordPro('{title: TAKE ON ME}\n{artist: A-HA}\n[G]Talking away'),
  updatedAt: '2026-05-27T00:00:10.000Z'
};
const chordProMetadataRendered = renderSong(chordProMetadataSong, { transpose: 0, capo: 0, showNashvilleNumbers: false, songKey: 'G' });
assert.equal(chordProMetadataRendered.lines[0].type, 'song-title');
assert.equal(chordProMetadataRendered.lines[0].value, 'Take On Me');
assert.equal(chordProMetadataRendered.lines[1].type, 'song-artist');
assert.equal(chordProMetadataRendered.lines[1].value, 'a-ha');

const shorthandMetadataSong = {
  ...capoSong,
  id: 'chordpro-shorthand-metadata-song',
  title: 'Sympathy For The Devil',
  artist: 'Rolling Stones',
  chart: '{t: Sympathy For The Devil}\n{st: Rolling Stones}\n[G]Please allow me',
  parsedChordPro: parseChordPro('{t: Sympathy For The Devil}\n{st: Rolling Stones}\n[G]Please allow me'),
  updatedAt: '2026-05-27T00:00:12.000Z'
};
const shorthandMetadataRendered = renderSong(shorthandMetadataSong, { transpose: 0, capo: 0, showNashvilleNumbers: false, songKey: 'G', songTitleFontSize: 58, songArtistFontSize: 46 });
assert.equal(shorthandMetadataRendered.lines[0].type, 'song-title');
assert.equal(shorthandMetadataRendered.lines[0].value, 'Sympathy For The Devil');
assert.equal(shorthandMetadataRendered.lines[1].type, 'song-artist');
assert.equal(shorthandMetadataRendered.lines[1].value, 'Rolling Stones');
assert.equal(shorthandMetadataRendered.lines.filter((line) => line.type === 'song-title').length, 1);
assert.equal(shorthandMetadataRendered.lines.filter((line) => line.type === 'song-artist').length, 1);

const legacyStoredShorthandSong = {
  ...shorthandMetadataSong,
  id: 'legacy-stored-shorthand-metadata-song',
  parsedChordPro: {
    directives: { t: ['Sympathy For The Devil'], st: ['Rolling Stones'] },
    warnings: [],
    lines: [
      { type: 'directive', raw: '{t: Sympathy For The Devil}', name: 't', value: 'Sympathy For The Devil' },
      { type: 'directive', raw: '{st: Rolling Stones}', name: 'st', value: 'Rolling Stones' },
      { type: 'lyrics', raw: '[G]Please allow me', tokens: [{ type: 'chord', value: 'G' }, { type: 'text', value: 'Please allow me' }] }
    ]
  },
  updatedAt: '2026-05-27T00:00:15.000Z'
};
const legacyStoredShorthandRendered = renderSong(legacyStoredShorthandSong, { transpose: 0, capo: 0, showNashvilleNumbers: false, songKey: 'G', songArtistFontSize: 45 });
assert.equal(legacyStoredShorthandRendered.lines[0].type, 'song-title');
assert.equal(legacyStoredShorthandRendered.lines[1].type, 'song-artist');
assert.equal(legacyStoredShorthandRendered.lines[1].value, 'Rolling Stones');

const rawFallbackShorthandSong = {
  ...shorthandMetadataSong,
  id: 'raw-fallback-shorthand-metadata-song',
  parsedChordPro: undefined,
  updatedAt: '2026-05-27T00:00:16.000Z'
};
const rawFallbackShorthandRendered = renderSong(rawFallbackShorthandSong, { transpose: 0, capo: 0, showNashvilleNumbers: false, songKey: 'G', songArtistFontSize: 45 });
assert.equal(rawFallbackShorthandRendered.lines[0].type, 'song-title');
assert.equal(rawFallbackShorthandRendered.lines[1].type, 'song-artist');
assert.equal(rawFallbackShorthandRendered.lines[1].value, 'Rolling Stones');

const subtitleMetadataSong = {
  ...capoSong,
  id: 'chordpro-subtitle-metadata-song',
  title: 'Sympathy For The Devil',
  artist: 'Rolling Stones',
  chart: '{title: Sympathy For The Devil}\n{subtitle: Rolling Stones}\n[G]Please allow me',
  parsedChordPro: parseChordPro('{title: Sympathy For The Devil}\n{subtitle: Rolling Stones}\n[G]Please allow me'),
  updatedAt: '2026-05-27T00:00:13.000Z'
};
const subtitleMetadataRendered = renderSong(subtitleMetadataSong, { transpose: 0, capo: 0, showNashvilleNumbers: false, songKey: 'G', songArtistFontSize: 46 });
assert.equal(subtitleMetadataRendered.lines[1].type, 'song-artist');
assert.equal(subtitleMetadataRendered.lines[1].value, 'Rolling Stones');

const artistMetadataSong = {
  ...capoSong,
  id: 'chordpro-artist-metadata-song',
  title: 'Sympathy For The Devil',
  artist: 'Rolling Stones',
  chart: '{title: Sympathy For The Devil}\n{artist: Rolling Stones}\n[G]Please allow me',
  parsedChordPro: parseChordPro('{title: Sympathy For The Devil}\n{artist: Rolling Stones}\n[G]Please allow me'),
  updatedAt: '2026-05-27T00:00:14.000Z'
};
const artistMetadataRendered = renderSong(artistMetadataSong, { transpose: 0, capo: 0, showNashvilleNumbers: false, songKey: 'G', songArtistFontSize: 46 });
assert.equal(artistMetadataRendered.lines[1].type, 'song-artist');
assert.equal(artistMetadataRendered.lines[1].value, 'Rolling Stones');

const onsongPlainMetadataSong = {
  ...capoSong,
  id: 'onsong-plain-metadata-song',
  title: 'Take On Me',
  artist: 'a-ha',
  chart: 'TAKE ON ME\na-ha\nF#m        D\nTalking away',
  parsedChordPro: parseChordPro('TAKE ON ME\na-ha\nF#m        D\nTalking away'),
  displayPreference: 'chords-over',
  updatedAt: '2026-05-27T00:00:11.000Z'
};
const onsongPlainMetadataRendered = renderSong(onsongPlainMetadataSong, { transpose: 0, capo: 0, showNashvilleNumbers: false, songKey: 'F#m' });
assert.equal(onsongPlainMetadataRendered.lines[0].type, 'song-title');
assert.equal(onsongPlainMetadataRendered.lines[0].value, 'Take On Me');
assert.equal(onsongPlainMetadataRendered.lines[1].type, 'song-artist');
assert.equal(onsongPlainMetadataRendered.lines[1].value, 'a-ha');
assert.equal(onsongPlainMetadataRendered.lines.filter((line) => line.type === 'lyrics' && line.tokens.map((token) => token.display).join('').trim().toLowerCase() === 'take on me').length, 0);
assert.equal(onsongPlainMetadataRendered.lines.filter((line) => line.type === 'song-title').length, 1);

const plainOnSongHeaderSong = {
  ...capoSong,
  id: 'plain-onsong-header-song',
  title: 'Stuck In The Middle With You',
  artist: 'Stealers Wheel',
  chart: 'Stuck In The Middle With You\nStealers Wheel\nD#   G#   Fm   D#   D#',
  parsedChordPro: undefined,
  displayPreference: 'chords-over',
  updatedAt: '2026-05-27T00:00:17.000Z'
};
const plainOnSongHeaderRendered = renderSong(plainOnSongHeaderSong, { transpose: 0, capo: 0, showNashvilleNumbers: false, songKey: 'D#', songArtistFontSize: 45 });
assert.equal(plainOnSongHeaderRendered.lines[0].type, 'song-title');
assert.equal(plainOnSongHeaderRendered.lines[0].value, 'Stuck In The Middle With You');
assert.equal(plainOnSongHeaderRendered.lines[1].type, 'song-artist');
assert.equal(plainOnSongHeaderRendered.lines[1].value, 'Stealers Wheel');
assert.equal(plainOnSongHeaderRendered.lines.filter((line) => line.type === 'lyrics' && line.tokens.map((token) => token.display).join('').trim() === 'Stealers Wheel').length, 0);

const inlineCapoSong = {
  ...capoSong,
  id: 'inline-capo-song',
  key: 'F',
  chart: '[F] [C] [Gm] [Bb]'
};
const inlineCapoThree = renderSong(inlineCapoSong, { transpose: 0, capo: 3, showNashvilleNumbers: false, songKey: 'F' });
assert.deepEqual(
  inlineCapoThree.lines[0].tokens.filter((token) => token.type === 'chord').map((token) => token.display),
  ['D', 'A', 'Em', 'G']
);

const chordOverSong = {
  ...capoSong,
  id: 'chord-over-capo-song',
  key: 'F',
  chart: 'F   C   Gm   Bb\nThis is the lyric line',
  displayPreference: 'chords-over',
  updatedAt: '2026-05-27T00:01:00.000Z'
};
const chordOverCapoThree = renderSong(chordOverSong, { transpose: 0, capo: 3, showNashvilleNumbers: false, songKey: 'F' });
assert.equal(chordOverCapoThree.lines[0].type, 'chord-over');
assert.equal(chordOverCapoThree.lines[0].chordLine, 'D   A   Em   G');
assert.equal(chordOverCapoThree.lines[0].lyricLine, 'This is the lyric line');

const standaloneHarmonyLine = {
  ...capoSong,
  id: 'standalone-harmony-line',
  chart: '[HARMONY](ooh...ooh....ooh...ooh)[/HARMONY]',
  displayPreference: 'inline',
  updatedAt: '2026-05-27T00:01:30.000Z'
};
const standaloneHarmonyRendered = renderSong(standaloneHarmonyLine, { transpose: 0, capo: 0, showNashvilleNumbers: false, songKey: 'G' });
assert.equal(standaloneHarmonyRendered.lines[0].type, 'lyrics');
assert.equal(standaloneHarmonyRendered.lines[0].tokens.map((token) => token.display).join(''), '[HARMONY](ooh...ooh....ooh...ooh)[/HARMONY]');
const plainHarmonyLine = {
  ...standaloneHarmonyLine,
  id: 'plain-harmony-line',
  chart: '[HARMONY]ooh...ooh....ooh...ooh[/HARMONY]',
  updatedAt: '2026-05-27T00:01:32.000Z'
};
const plainHarmonyRendered = renderSong(plainHarmonyLine, { transpose: 0, capo: 0, showNashvilleNumbers: false, songKey: 'G' });
assert.equal(plainHarmonyRendered.lines[0].type, 'lyrics');
const plainHarmonyDisplay = plainHarmonyRendered.lines[0].tokens.map((token) => token.display).join('');
assert.equal(plainHarmonyDisplay, '[HARMONY]ooh...ooh....ooh...ooh[/HARMONY]');
assert.equal(parseHarmonyText(plainHarmonyDisplay).text, 'ooh...ooh....ooh...ooh');
const mixedHarmonyLine = {
  ...standaloneHarmonyLine,
  id: 'mixed-harmony-line',
  chart: 'Lead lyric [HARMONY]backup phrase[/HARMONY] rest of line',
  updatedAt: '2026-05-27T00:01:33.000Z'
};
const mixedHarmonyRendered = renderSong(mixedHarmonyLine, { transpose: 0, capo: 0, showNashvilleNumbers: false, songKey: 'G' });
const mixedHarmonyDisplay = mixedHarmonyRendered.lines[0].tokens.map((token) => token.display).join('');
assert.equal(parseHarmonyText(mixedHarmonyDisplay).text, 'Lead lyric backup phrase rest of line');
assert.deepEqual(parseHarmonyText(mixedHarmonyDisplay).ranges, [{ start: 'Lead lyric '.length, end: 'Lead lyric backup phrase'.length }]);
const takeItEasyExcerpt = {
  ...capoSong,
  id: 'take-it-easy-harmony-excerpt',
  chart: '[G]Take it [HARMONY]EASY[/HARMONY], take it [D]EASY\n[HARMONY]ooh...ooh....ooh...ooh[/HARMONY]',
  parsedChordPro: parseChordPro('[G]Take it [HARMONY]EASY[/HARMONY], take it [D]EASY\n[HARMONY]ooh...ooh....ooh...ooh[/HARMONY]'),
  updatedAt: '2026-05-27T00:01:34.000Z'
};
const takeItEasyRendered = renderSong(takeItEasyExcerpt, { transpose: 0, capo: 0, showNashvilleNumbers: false, songKey: 'G' });
const takeItEasyChordedLine = chordTokensToAnchoredLine(takeItEasyRendered.lines[0].tokens);
const takeItEasyOohLine = takeItEasyRendered.lines[1].tokens.map((token) => token.display).join('');
assert.deepEqual(
  lyricHarmonyRenderModelFromParsed(takeItEasyChordedLine.lyricLine, takeItEasyChordedLine.harmonyRanges).runs.map((run) => ({ text: run.text, styled: run.styled })),
  [
    { text: 'Take it ', styled: false },
    { text: 'EASY', styled: true },
    { text: ', take it EASY', styled: false }
  ]
);
assert.deepEqual(lyricHarmonyRenderModel(takeItEasyOohLine).runs.map((run) => ({ text: run.text, styled: run.styled })), [
  { text: 'ooh...ooh....ooh...ooh', styled: true }
]);
const legacyHarmonyTokenSong = {
  ...standaloneHarmonyLine,
  id: 'legacy-harmony-token-song',
  parsedChordPro: {
    directives: {},
    warnings: [],
    lines: [
      {
        type: 'lyrics',
        raw: '[HARMONY](ooh...ooh....ooh...ooh)[/HARMONY]',
        tokens: [
          { type: 'chord', value: 'HARMONY' },
          { type: 'text', value: '(ooh...ooh....ooh...ooh)' },
          { type: 'chord', value: '/HARMONY' }
        ]
      }
    ]
  },
  updatedAt: '2026-05-27T00:01:31.000Z'
};
const legacyHarmonyRendered = renderSong(legacyHarmonyTokenSong, { transpose: 0, capo: 0, showNashvilleNumbers: false, songKey: 'G' });
assert.equal(legacyHarmonyRendered.lines[0].type, 'lyrics');
assert.equal(legacyHarmonyRendered.lines[0].tokens.map((token) => token.display).join(''), '[HARMONY](ooh...ooh....ooh...ooh)[/HARMONY]');

const chordOverSlash = {
  ...chordOverSong,
  id: 'chord-over-slash-song',
  chart: 'D/F#\nWalk down',
  updatedAt: '2026-05-27T00:02:00.000Z'
};
assert.equal(renderSong(chordOverSlash, { transpose: 0, capo: 2, showNashvilleNumbers: false, songKey: 'D' }).lines[0].chordLine, 'C/E');
assert.equal(renderSong(chordOverSong, { transpose: 2, capo: 2, showNashvilleNumbers: false, songKey: 'F' }).lines[0].chordLine, 'F   C   Gm   A#');
assert.equal(renderSong(chordOverSong, { transpose: 0, capo: 3, showNashvilleNumbers: true, songKey: 'F' }).lines[0].chordLine, '6   3   7m   2');
assert.equal(normalizePrompterCapoMode('custom'), 'custom');
assert.equal(normalizePrompterCapoMode('bad-mode'), 'follow-ipad');
assert.equal(normalizePrompterCapoValue(14), 12);
assert.equal(getEffectivePrompterCapo(2, { prompterCapoMode: 'follow-ipad', prompterCapoValue: 0 }), 2);
assert.equal(getEffectivePrompterCapo(2, { prompterCapoMode: 'no-capo', prompterCapoValue: 0 }), 0);
assert.equal(getEffectivePrompterCapo(2, { prompterCapoMode: 'custom', prompterCapoValue: 4 }), 4);
assert.equal(getPrompterCapoTransposeOffset(2, 0), 2);
assert.equal(getPrompterCapoTransposeOffset(2, 4), -2);
const prompterCapoSong = {
  ...chordOverSong,
  id: 'prompter-capo-song',
  key: 'Bm',
  chart: 'Bm\nConcert key stays fixed',
  updatedAt: '2026-07-04T00:00:00.000Z'
};
const ipadCapoTwo = renderSong(prompterCapoSong, { transpose: 0, capo: 2, showNashvilleNumbers: false, songKey: 'Bm' });
assert.equal(ipadCapoTwo.lines[0].type, 'chord-over');
assert.equal(ipadCapoTwo.lines[0].chordLine, 'Am');
const prompterNoCapo = renderSong(prompterCapoSong, { transpose: 0, capo: getEffectivePrompterCapo(2, { prompterCapoMode: 'no-capo', prompterCapoValue: 0 }), showNashvilleNumbers: false, songKey: 'Bm' });
assert.equal(prompterNoCapo.lines[0].type, 'chord-over');
assert.equal(prompterNoCapo.lines[0].chordLine, 'Bm');
const prompterCustomFour = renderSong(prompterCapoSong, { transpose: 0, capo: getEffectivePrompterCapo(2, { prompterCapoMode: 'custom', prompterCapoValue: 4 }), showNashvilleNumbers: false, songKey: 'Bm' });
assert.equal(prompterCustomFour.lines[0].type, 'chord-over');
assert.equal(prompterCustomFour.lines[0].chordLine, 'Gm');
assert.equal(getRenderCacheSize() >= 7, true);

const twilightReceiverExcerpt = {
  ...chordOverSong,
  id: 'twilight-zone-receiver-excerpt',
  displayPreference: 'chords-over',
  chart: `Bm
It's two A.M. the fear has gone

Em
I'm sitting here waiting the gun's still warm

F#m                                      Bm
Maybe my connection is tired of taking chances`,
  updatedAt: '2026-07-03T00:00:00.000Z'
};
const twilightReceiverRendered = renderSong(twilightReceiverExcerpt, {
  transpose: 0,
  capo: 0,
  showNashvilleNumbers: false,
  songKey: 'Bm',
  viewportWidth: 1920,
  displayMode: 'receiver'
});
const twilightReceiverChordRows = twilightReceiverRendered.lines.filter((line) => line.type === 'chord-over');
assert.equal(twilightReceiverChordRows.length, 3);
assert.equal(twilightReceiverChordRows[0].chordLine, 'Bm');
assert.equal(twilightReceiverChordRows[0].lyricLine, "It's two A.M. the fear has gone");
assert.equal(twilightReceiverChordRows[1].chordLine, 'Em');
assert.equal(twilightReceiverChordRows[1].lyricLine, "I'm sitting here waiting the gun's still warm");
assert.equal(twilightReceiverChordRows[2].chordLine, 'F#m                                      Bm');
assert.equal(twilightReceiverChordRows[2].lyricLine, 'Maybe my connection is tired of taking chances');
const twilightReceiverOpeningAnchored = chordOverTextToAnchoredLine(twilightReceiverChordRows[0].chordLine, twilightReceiverChordRows[0].lyricLine);
assert.equal(twilightReceiverOpeningAnchored.anchors[0].chord, 'Bm');
assert.equal(twilightReceiverOpeningAnchored.anchors[0].index, twilightReceiverChordRows[0].lyricLine.indexOf("It's"));
const twilightReceiverWaitingAnchored = chordOverTextToAnchoredLine(twilightReceiverChordRows[1].chordLine, twilightReceiverChordRows[1].lyricLine);
assert.equal(twilightReceiverWaitingAnchored.anchors[0].chord, 'Em');
assert.equal(twilightReceiverWaitingAnchored.anchors[0].index, twilightReceiverChordRows[1].lyricLine.indexOf("I'm"));
const twilightReceiverAnchored = chordOverTextToAnchoredLine(twilightReceiverChordRows[2].chordLine, twilightReceiverChordRows[2].lyricLine);
assert.equal(twilightReceiverAnchored.anchors[0].chord, 'F#m');
assert.equal(twilightReceiverAnchored.anchors[0].index, twilightReceiverChordRows[2].lyricLine.indexOf('Maybe'));
assert.equal(twilightReceiverAnchored.anchors[1].chord, 'Bm');
const twilightReceiverChanceIndex = twilightReceiverChordRows[2].lyricLine.indexOf('chances');
assert.equal(
  twilightReceiverAnchored.anchors[1].index >= twilightReceiverChanceIndex &&
    twilightReceiverAnchored.anchors[1].index < twilightReceiverChanceIndex + 'chances'.length,
  true
);

const twilightReceiverFrenzyExcerpt = {
  ...chordOverSong,
  id: 'twilight-zone-receiver-frenzy-excerpt',
  displayPreference: 'chords-over',
  chart: `F#m                                      Bm
Cannot decode, my whole life spins into a frenzy

F#m                                      Bm
Maybe my connection is tired of taking his chances`,
  updatedAt: '2026-07-04T00:00:00.000Z'
};
const twilightReceiverFrenzyRendered = renderSong(twilightReceiverFrenzyExcerpt, {
  transpose: 0,
  capo: 0,
  showNashvilleNumbers: false,
  songKey: 'Bm',
  viewportWidth: 1080,
  displayMode: 'receiver'
});
const twilightReceiverFrenzyRows = twilightReceiverFrenzyRendered.lines.filter((line) => line.type === 'chord-over');
assert.equal(twilightReceiverFrenzyRows.length, 2);
const frenzyAnchored = chordOverTextToAnchoredLine(twilightReceiverFrenzyRows[0].chordLine, twilightReceiverFrenzyRows[0].lyricLine);
assert.equal(frenzyAnchored.anchors[0].chord, 'F#m');
assert.equal(frenzyAnchored.anchors[0].index <= 2, true);
assert.equal(frenzyAnchored.anchors[1].chord, 'Bm');
assert.equal(frenzyAnchored.anchors[1].index >= twilightReceiverFrenzyRows[0].lyricLine.indexOf('a frenzy'), true);
assert.equal(frenzyAnchored.anchors[1].index / twilightReceiverFrenzyRows[0].lyricLine.length > 0.8, true);
const chancesAnchored = chordOverTextToAnchoredLine(twilightReceiverFrenzyRows[1].chordLine, twilightReceiverFrenzyRows[1].lyricLine);
assert.equal(chancesAnchored.anchors[0].chord, 'F#m');
assert.equal(chancesAnchored.anchors[0].index <= 2, true);
assert.equal(chancesAnchored.anchors[1].chord, 'Bm');
assert.equal(chancesAnchored.anchors[1].index >= twilightReceiverFrenzyRows[1].lyricLine.indexOf('his chances'), true);
assert.equal(chancesAnchored.anchors[1].index / twilightReceiverFrenzyRows[1].lyricLine.length > 0.8, true);

const standaloneChordRow = {
  ...chordOverSong,
  id: 'standalone-chord-row',
  chart: 'D#   G#   Fm   D#   D#',
  updatedAt: '2026-05-27T00:03:00.000Z'
};
const standaloneRendered = renderSong(standaloneChordRow, { transpose: 1, capo: 0, showNashvilleNumbers: false, songKey: 'D#' });
assert.equal(standaloneRendered.lines[0].type, 'chord-over');
assert.equal(standaloneRendered.lines[0].chordLine, 'E   A   F#m   E   E');

const funeralExcerptSong = {
  ...chordOverSong,
  id: 'funeral-for-a-friend-excerpt',
  chart: `Intro:

Em                 C                 G
(Instrumental opening - slow build)
Em                 D                 Am`,
  updatedAt: '2026-06-26T00:00:00.000Z'
};
clearRenderCache();
const funeralRendered = renderSong(funeralExcerptSong, { transpose: 0, capo: 0, showNashvilleNumbers: false, songKey: 'Em' });
const funeralChordRows = funeralRendered.lines.filter((line) => line.type === 'chord-over');
assert.equal(funeralChordRows[0].chordLine, 'Em                 C                 G');
assert.equal(funeralChordRows[0].chordLine.split(/\s+/)[0], 'Em');
assert.equal(funeralChordRows[0].chordLine.includes('Gm'), false);
assert.equal(funeralChordRows[1].chordLine, 'Em                 D                 Am');

const staleCacheOriginal = {
  ...chordOverSong,
  id: 'same-id-cache-swap',
  chart: 'Gm',
  updatedAt: '2026-06-26T00:01:00.000Z'
};
const staleCacheUpdated = {
  ...staleCacheOriginal,
  chart: 'Em'
};
clearRenderCache();
assert.equal(renderSong(staleCacheOriginal, { transpose: 0, capo: 0, showNashvilleNumbers: false, songKey: 'Gm' }).lines[0].chordLine, 'Gm');
assert.equal(renderSong(staleCacheUpdated, { transpose: 0, capo: 0, showNashvilleNumbers: false, songKey: 'Em' }).lines[0].chordLine, 'Em');

const standaloneSlashRow = {
  ...chordOverSong,
  id: 'standalone-slash-row',
  chart: 'G/B   A/C#   F#m7b5',
  updatedAt: '2026-05-27T00:04:00.000Z'
};
assert.equal(
  renderSong(standaloneSlashRow, { transpose: 0, capo: 2, showNashvilleNumbers: false, songKey: 'G' }).lines[0].chordLine,
  'F/A   G/B   Em7b5'
);

const standaloneBarRow = {
  ...chordOverSong,
  id: 'standalone-bar-row',
  chart: '| D# | G# | Fm | D# |',
  updatedAt: '2026-05-27T00:05:00.000Z'
};
assert.equal(
  renderSong(standaloneBarRow, { transpose: 1, capo: 0, showNashvilleNumbers: false, songKey: 'D#' }).lines[0].chordLine,
  '| E | A | F#m | E |'
);

const metadataLines = {
  ...chordOverSong,
  id: 'metadata-lines-not-chords',
  chart: 'Key: D#\nCapo: 1\nMIDI: *.0:36@0, CC115:0@0',
  updatedAt: '2026-05-27T00:06:00.000Z'
};
const metadataRendered = renderSong(metadataLines, { transpose: 1, capo: 0, showNashvilleNumbers: false, songKey: 'D#' });
assert.equal(metadataRendered.lines[0].type, 'lyrics');
assert.equal(metadataRendered.lines[0].tokens[0].display, 'Key: D#');
assert.equal(metadataRendered.lines[1].type, 'lyrics');
assert.equal(metadataRendered.lines[2].type, 'lyrics');

const setlistSongs = [
  { id: 'song-a', title: 'Zulu', artist: 'Beta', key: 'G', capo: 0, bpm: 120, durationSeconds: 180 },
  { id: 'song-b', title: 'Alpha', artist: 'Charlie', key: 'C', capo: 0, bpm: 80, durationSeconds: 240 },
  { id: 'song-c', title: 'Middle', artist: 'Alpha', key: 'D', capo: 0, bpm: 100, durationSeconds: 120 }
];
const namedSetlist = createNamedSetlist('Friday Night Gig', ['song-a', 'song-b'], '2026-05-27T00:00:00.000Z');
assert.equal(namedSetlist.name, 'Friday Night Gig');
assert.deepEqual(namedSetlist.songIds, ['song-a', 'song-b']);
assert.equal(JSON.parse(JSON.stringify(namedSetlist)).name, 'Friday Night Gig');
assert.deepEqual(addSongToSetlist(['song-a'], 'song-a'), ['song-a']);
assert.deepEqual(addSongToSetlist(['song-a'], 'song-a', true), ['song-a', 'song-a']);
assert.deepEqual(removeSongFromSetlist(['song-a', 'song-b'], 'song-a'), ['song-b']);
assert.deepEqual(sortSetlistSongIds(['song-a', 'song-b', 'song-c'], setlistSongs, 'title'), ['song-b', 'song-c', 'song-a']);
assert.deepEqual(sortSetlistSongIds(['song-a', 'song-b', 'song-c'], setlistSongs, 'artist'), ['song-c', 'song-a', 'song-b']);
assert.equal(getStageSongAt({ ...namedSetlist, songIds: ['song-a', 'song-b', 'song-c'] }, setlistSongs, 'song-b', 1).id, 'song-c');
assert.equal(getStageSongAt({ ...namedSetlist, songIds: ['song-a', 'song-b', 'song-c'] }, setlistSongs, 'song-b', -1).id, 'song-a');
assert.equal(getStageSongAt(namedSetlist, setlistSongs, 'song-b', 1), undefined);

const originalCryptoDescriptor = Object.getOwnPropertyDescriptor(globalThis, 'crypto');
Object.defineProperty(globalThis, 'crypto', {
  configurable: true,
  value: { randomUUID: () => 'uuid-supported' }
});
assert.equal(createId('test'), 'uuid-supported');
Object.defineProperty(globalThis, 'crypto', {
  configurable: true,
  value: {}
});
assert.equal(createId('fallback').startsWith('fallback-'), true);
Object.defineProperty(globalThis, 'crypto', {
  configurable: true,
  value: undefined
});
assert.equal(createId('missing').startsWith('missing-'), true);
if (originalCryptoDescriptor) {
  Object.defineProperty(globalThis, 'crypto', originalCryptoDescriptor);
} else {
  delete globalThis.crypto;
}

console.log('duration/autoscroll tests passed');
