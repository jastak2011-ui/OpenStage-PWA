import assert from 'node:assert/strict';
import {
  advanceVirtualScrollTop,
  calculateAutoscrollPixelsPerSecond,
  detectAutoscrollHeartbeatStall,
  estimateBpmAutoscrollDurationSeconds
} from './autoscroll-test-target.mjs';
import { parseDurationInput } from './format-test-target.mjs';
import { applyPerformanceChordTransform } from './chords-test-target.mjs';
import {
  chordOverTextToAnchoredLine,
  chordTokensToAnchoredLine,
  convertInlineChordLine,
  inlineChordsToChordOverLyrics
} from './chordLayout-test-target.mjs';
import { markHarmonyRange, parseHarmonyText, removeHarmonyRange, stripHarmonyMarkup } from './harmony-test-target.mjs';
import { createId } from './ids-test-target.mjs';
import { parseCsvSongs, parseJsonSongs, songsToCsv, songsToJson } from './importExport-test-target.mjs';
import { getStageSwipeDirection } from './stageGestures-test-target.mjs';
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
  getEffectiveLineSpacing,
  lineSpacingUpdate
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

const favoriteCsvSong = parseCsvSongs('title,artist,favorite,chart\n"Favorite Tune","OpenStage","true","[G]Go"')[0];
assert.equal(favoriteCsvSong.favorite, true);
const exportedFavoriteCsv = songsToCsv([favoriteCsvSong]);
assert.match(exportedFavoriteCsv.split('\n')[0], /favorite/);
assert.match(exportedFavoriteCsv, /"true"/);
const favoriteJsonSong = parseJsonSongs(songsToJson([favoriteCsvSong]))[0];
assert.equal(favoriteJsonSong.favorite, true);
const legacyJsonSong = parseJsonSongs('[{"title":"Legacy Tune","chart":"[C]Old"}]')[0];
assert.equal(legacyJsonSong.favorite, false);
const harmonyText = parseHarmonyText('Take it [HARMONY]easy[/HARMONY]');
assert.equal(harmonyText.text, 'Take it easy');
assert.deepEqual(harmonyText.ranges, [{ start: 8, end: 12 }]);
assert.equal(stripHarmonyMarkup('[HARMONY]Full line[/HARMONY]'), 'Full line');
assert.equal(markHarmonyRange('Take it easy', 8, 12), 'Take it [HARMONY]easy[/HARMONY]');
assert.equal(removeHarmonyRange('Take it [HARMONY]easy[/HARMONY]', 0, 999), 'Take it easy');
const harmonyCsvSong = parseCsvSongs('title,chart\n"Harmony Tune","[G]Take it [HARMONY]easy[/HARMONY]"')[0];
assert.equal(harmonyCsvSong.chart, '[G]Take it [HARMONY]easy[/HARMONY]');
assert.equal(songsToJson([harmonyCsvSong]).includes('[HARMONY]easy[/HARMONY]'), true);
assert.equal(getStageSwipeDirection({ startX: 240, startY: 200, endX: 120, endY: 210 }), 1);
assert.equal(getStageSwipeDirection({ startX: 120, startY: 200, endX: 240, endY: 210 }), -1);
assert.equal(getStageSwipeDirection({ startX: 120, startY: 200, endX: 155, endY: 205 }), 0);
assert.equal(getStageSwipeDirection({ startX: 120, startY: 200, endX: 190, endY: 300 }), 0);

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

const slowFrame = advanceVirtualScrollTop(10, 1 / 60, 1.2, 100);
assert.equal(slowFrame.reachedEnd, false);
assert.equal(slowFrame.nextScrollTop > 10, true);
assert.equal(slowFrame.nextScrollTop < 11, true);

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

const chordOverSlash = {
  ...chordOverSong,
  id: 'chord-over-slash-song',
  chart: 'D/F#\nWalk down',
  updatedAt: '2026-05-27T00:02:00.000Z'
};
assert.equal(renderSong(chordOverSlash, { transpose: 0, capo: 2, showNashvilleNumbers: false, songKey: 'D' }).lines[0].chordLine, 'C/E');
assert.equal(renderSong(chordOverSong, { transpose: 2, capo: 2, showNashvilleNumbers: false, songKey: 'F' }).lines[0].chordLine, 'F   C   Gm   A#');
assert.equal(renderSong(chordOverSong, { transpose: 0, capo: 3, showNashvilleNumbers: true, songKey: 'F' }).lines[0].chordLine, '6   3   7m   2');
assert.equal(getRenderCacheSize() >= 7, true);

const standaloneChordRow = {
  ...chordOverSong,
  id: 'standalone-chord-row',
  chart: 'D#   G#   Fm   D#   D#',
  updatedAt: '2026-05-27T00:03:00.000Z'
};
const standaloneRendered = renderSong(standaloneChordRow, { transpose: 1, capo: 0, showNashvilleNumbers: false, songKey: 'D#' });
assert.equal(standaloneRendered.lines[0].type, 'chord-over');
assert.equal(standaloneRendered.lines[0].chordLine, 'E   A   F#m   E   E');

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
