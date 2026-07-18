import type { SavedSetlist, Song } from '../types';
import { createSongUuid } from './ids';
import { sanitizeChartForOnSong } from './onsongSanitize';
import { writeBinaryPlist, type BinaryPlistWritableValue } from './binaryPlistWriter';

export type OnSongArchiveExportSong = Pick<
  Song,
  | 'id'
  | 'songUuid'
  | 'version'
  | 'title'
  | 'artist'
  | 'key'
  | 'performanceKey'
  | 'capo'
  | 'bpm'
  | 'timeSignature'
  | 'durationSeconds'
  | 'tags'
  | 'notes'
  | 'chart'
  | 'rawChordPro'
>;

export function createOnSongSetlistArchive(setlist: SavedSetlist, songs: OnSongArchiveExportSong[]): Uint8Array {
  const builder = new OnSongArchiveBuilder();
  return builder.build(setlist, songs);
}

export function createOnSongSetlistArchiveFileName(setlistName: string) {
  return `${sanitizeFileName(setlistName || 'OpenStage Setlist')}.archive`;
}

class OnSongArchiveBuilder {
  private readonly objects: BinaryPlistWritableValue[] = ['$null'];
  private readonly nullUid = uid(0);
  private readonly songClassUid = this.addClass('Song', ['Song', 'OSItem', 'NSObject']);
  private readonly songSetItemClassUid = this.addClass('SongSetItem', ['SongSetItem', 'NSObject']);
  private readonly mutableArrayClassUid = this.addClass('NSMutableArray', ['NSMutableArray', 'NSArray', 'NSObject']);
  private readonly songSetItemCollectionClassUid = this.addClass('SongSetItemCollection', ['SongSetItemCollection', 'OSCollection', 'NSObject']);
  private readonly songSetClassUid = this.addClass('SongSet', ['SongSet', 'OSItem', 'NSObject']);

  build(setlist: SavedSetlist, songs: OnSongArchiveExportSong[]) {
    const now = new Date();
    const setId = toOnSongId(setlist.id || createSongUuid());
    const itemUids = songs.map((song, index) => {
      const songId = toOnSongId(song.songUuid || song.id || createSongUuid());
      const songUid = this.addSong(song, songId, now);
      return this.addObject({
        ID: this.addString(JSON.stringify({ setID: setId, songID: songId, orderIndex: index })),
        songID: this.addString(songId),
        bookID: this.nullUid,
        orderIndex: index,
        setID: this.addString(setId),
        song: songUid,
        $class: this.songSetItemClassUid
      });
    });

    const itemArrayUid = this.addObject({
      'NS.objects': itemUids,
      $class: this.mutableArrayClassUid
    });
    const collectionUid = this.addObject({
      collection: itemArrayUid,
      class: this.addString('SongSetItem'),
      index: this.nullUid,
      $class: this.songSetItemCollectionClassUid
    });
    const rootUid = this.addObject({
      modified: this.nullUid,
      playbackContinuity: 0,
      useSeparateStyles: this.nullUid,
      title: this.addString(setlist.name.trim() || 'OpenStage Setlist'),
      unarchived: this.nullUid,
      summary: this.nullUid,
      songs: collectionUid,
      archived: this.nullUid,
      providerName: this.addString('OpenStage'),
      sceneID: this.nullUid,
      orderDirection: 0,
      datetime: this.addArchiveDate(now),
      quantity: this.nullUid,
      orderMethod: this.addString('orderIndex'),
      user: this.nullUid,
      providerUri: this.nullUid,
      expires: this.nullUid,
      ID: this.addString(setId),
      hasTime: this.nullUid,
      created: this.addArchiveDate(dateOrNow(setlist.createdAt, now)),
      orderIndex: 0,
      $class: this.songSetClassUid
    });

    return writeBinaryPlist({
      $version: 100000,
      $archiver: 'NSKeyedArchiver',
      $top: { root: rootUid },
      $objects: this.objects
    });
  }

  private addSong(song: OnSongArchiveExportSong, songId: string, now: Date) {
    const cleanChart = sanitizeChartForOnSong(song.rawChordPro || song.chart || '').trim();
    const title = song.title?.trim() || 'Untitled Song';
    const artist = song.artist?.trim() || '';
    const key = song.key?.trim() || '';
    const performanceKey = song.performanceKey?.trim() || key;
    const capo = finiteNumber(song.capo, 0);
    const tempo = finiteNumber(song.bpm, 0);
    const duration = finiteNumber(song.durationSeconds, 0);
    const timeSignature = song.timeSignature?.trim() || '';

    return this.addObject({
      ID: this.addString(songId),
      songUuid: this.addString(song.songUuid || songId),
      version: finiteNumber(song.version, 1),
      user: this.nullUid,
      key: key ? this.addString(key) : this.nullUid,
      title: this.addString(title),
      sortTitle: this.addString(title),
      byline: artist ? this.addString(artist) : this.nullUid,
      bylineAlpha: artist ? this.addString(artist.slice(0, 1).toUpperCase()) : this.nullUid,
      content: this.addString(cleanChart),
      lyrics: this.addObject({ 'NS.string': this.addString(stripChordMarkers(cleanChart)) }),
      filepath: this.addString(`${sanitizeFileName(title)}.txt`),
      capo,
      tempo: tempo || this.nullUid,
      duration: duration || this.nullUid,
      timeSignature: timeSignature ? this.addString(timeSignature) : this.nullUid,
      keywords: Array.isArray(song.tags) && song.tags.length ? this.addArray(song.tags.map((tag) => this.addString(tag))) : this.nullUid,
      notes: song.notes?.trim() ? this.addString(song.notes.trim()) : this.nullUid,
      transposedKey: performanceKey ? this.addString(performanceKey) : this.nullUid,
      showTitle: true,
      showChords: true,
      showLyrics: true,
      showMetadata: true,
      showNotes: true,
      showSectionLabels: true,
      chordPosition: 0,
      chordStyle: 0,
      fontName: this.addString('Helvetica'),
      fontSize: 16,
      headerFontName: this.addString('Helvetica-Bold'),
      headerFontSize: 24,
      chordFontName: this.addString('Helvetica-Bold'),
      chordFontSize: 16,
      metadataFontName: this.addString('Helvetica'),
      metadataFontSize: 16,
      monospacedFontName: this.addString('Courier'),
      monospacedFontSize: 16,
      lineSpacing: 1,
      beatsPerLine: 4,
      zoomScale: 1,
      zoomPointX: 0,
      zoomPointY: 0,
      diagramPosition: 0,
      showCapoedChords: 0,
      adjustForCapo: false,
      performTransposition: true,
      language: this.addString('en'),
      imported: 1,
      deleted: 0,
      usefile: 0,
      loaned: 0,
      favorite: this.nullUid,
      created: this.addArchiveDate(now),
      modified: this.addArchiveDate(now),
      viewed: this.addArchiveDate(now),
      lastImportedOn: this.addArchiveDate(now),
      syncTimestamp: this.addArchiveDate(now),
      $class: this.songClassUid
    });
  }

  private addClass(className: string, classes: string[]) {
    return this.addObject({ $classname: className, $classes: classes });
  }

  private addArchiveDate(date: Date) {
    return this.addObject({ 'NS.time': (date.getTime() - Date.UTC(2001, 0, 1)) / 1000 });
  }

  private addArray(items: ReturnType<typeof uid>[]) {
    return this.addObject({
      'NS.objects': items,
      $class: this.mutableArrayClassUid
    });
  }

  private addString(value: string) {
    return this.addObject(value);
  }

  private addObject(value: BinaryPlistWritableValue) {
    this.objects.push(value);
    return uid(this.objects.length - 1);
  }
}

function uid(index: number) {
  return { $uid: index };
}

function finiteNumber(value: unknown, fallback: number) {
  const number = Number(value);
  return Number.isFinite(number) ? number : fallback;
}

function dateOrNow(value: string | undefined, fallback: Date) {
  const date = value ? new Date(value) : fallback;
  return Number.isFinite(date.getTime()) ? date : fallback;
}

function toOnSongId(value: string) {
  return value.trim() || createSongUuid();
}

function stripChordMarkers(chart: string) {
  return chart.replace(/\[[^\]]+\]/g, '').replace(/^[ \t]*[A-G](?:#|b)?(?:m(?!aj)|maj|min|dim|aug|sus|add|\d|[#b()+-])*?(?:\s+[A-G](?:#|b)?(?:m(?!aj)|maj|min|dim|aug|sus|add|\d|[#b()+-])*?)*[ \t]*$/gim, '');
}

function sanitizeFileName(value: string) {
  const safe = value.trim().replace(/[<>:"/\\|?*\x00-\x1f]/g, '-').replace(/\s+/g, ' ').slice(0, 80);
  return safe || 'OpenStage Setlist';
}
