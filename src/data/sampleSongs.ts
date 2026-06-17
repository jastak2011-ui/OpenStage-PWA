import type { SavedSetlist, SetlistItem, Song } from '../types';
import { parseChordProSong } from '../lib/chordpro';

const demoCharts = [
  {
    fileName: 'open-road.chordpro',
    text: `{title: Open Road}
{subtitle: Main stage opener}
{artist: OpenStage Demo}
{album: Browser Sessions}
{key: G}
{capo: 0}
{tempo: 104}
{time: 4/4}
{comment: Use this demo chart to test transpose, autoscroll, and keyboard controls.}

{start_of_verse}
[G]Wake up the room with a [C]steady hand
[Em]Count in the band, let the [D]evening land
{end_of_verse}

{start_of_chorus}
[C]We are rolling [G]out tonight
[D]Every voice in the [Em]house alight
[C]Keep the tempo, [G]hold the line
[D]Open road, open [G]sky
{end_of_chorus}`
  },
  {
    fileName: 'late-light.pro',
    text: `{title: Late Light}
{subtitle: Portrait prompter test}
{artist: OpenStage Demo}
{key: Am}
{capo: 2}
{tempo: 72}
{time: 6/8}
{comment: Portrait-friendly slow song with extra spacing.}

{start_of_verse}
[Am]Late light [F]falls across the [C]floor
[G]Soft shoes [Am]waiting by the [F]door
{end_of_verse}

{start_of_chorus}
[F]Hold on, [C]hold on
[G]Let the quiet [Am]sing
[F]Hold on, [C]hold on
[G]Every ending [Am]rings
{end_of_chorus}`
  },
  {
    fileName: 'northbound-train.cho',
    text: `{title: Northbound Train}
{artist: OpenStage Demo}
{album: Import Tests}
{key: D}
{capo: 1}
{tempo: 118}
{time: 4/4}
{comment: Includes slash chords and sevenths.}

{start_of_verse}
[D]Boots on the platform, [A/C#]rain on the rail
[Bm7]One more minute till the [G]northbound wails
{end_of_verse}

{start_of_chorus}
[G]Carry me [D/F#]over the [Em7]county line
[A7]Home by the [D]morning light
{end_of_chorus}`
  },
  {
    fileName: 'harbor-waltz.crd',
    text: `{title: Harbor Waltz}
{artist: OpenStage Demo}
{key: Bb}
{capo: 0}
{tempo: 90}
{time: 3/4}
{comment: Tests flat-key metadata and simple waltz phrasing.}

{start_of_verse}
[Bb]Lanterns move in [Eb]three-quarter time
[F7]Boats keep their [Bb]place in line
{end_of_verse}

{start_of_chorus}
[Gm]Turn, turn, [Eb]harbor light
[Bb/F]Bring us back [F7]home tonight
{end_of_chorus}`
  }
];

export const sampleSongs: Song[] = demoCharts.map(({ fileName, text }, index) => {
  const result = parseChordProSong(text, fileName);
  return {
    ...result.song,
    id: `song-demo-${index + 1}`
  };
});

export const sampleSetlist: SetlistItem[] = sampleSongs.slice(0, 3).map((song, index) => ({
  id: `set-${song.id}`,
  songId: song.id,
  order: index
}));

export const sampleSavedSetlists: SavedSetlist[] = [
  {
    id: 'setlist-demo-main',
    name: 'Demo Stage Set',
    songIds: sampleSongs.slice(0, 3).map((song) => song.id),
    createdAt: '2026-05-27T00:00:00.000Z',
    updatedAt: '2026-05-27T00:00:00.000Z',
    notes: 'Starter saved setlist for testing Stage navigation.'
  }
];
