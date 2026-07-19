import type { SavedSetlist, Song } from '../types';
import { createSongUuid } from './ids';
import { sanitizeOnSongExportText } from './onsongSanitize';
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
  private readonly dateClassUid = this.addClass('NSDate', ['NSDate', 'NSObject']);
  private readonly mutableStringClassUid = this.addClass('NSMutableString', ['NSMutableString', 'NSString', 'NSObject']);
  private readonly songClassUid = this.addClass('Song', ['Song', 'OSItem', 'NSObject']);
  private readonly songSetItemClassUid = this.addClass('SongSetItem', ['SongSetItem', 'NSObject']);
  private readonly mutableArrayClassUid = this.addClass('NSMutableArray', ['NSMutableArray', 'NSArray', 'NSObject']);
  private readonly songSetItemCollectionClassUid = this.addClass('SongSetItemCollection', ['SongSetItemCollection', 'OSCollection', 'NSObject']);
  private readonly songSetClassUid = this.addClass('SongSet', ['SongSet', 'OSItem', 'NSObject']);

  build(setlist: SavedSetlist, songs: OnSongArchiveExportSong[]) {
    const now = new Date();
    const setId = createOnSongArchiveId();
    console.info('ONSONG_ARCHIVE_WRITER_INPUT', {
      setlistName: setlist.name,
      setlistSongIdCount: setlist.songIds.length,
      inputSongCount: songs.length,
      songs: songs.map((song, index) => ({
        index,
        id: song.id,
        title: song.title,
        chartLength: (song.rawChordPro || song.chart || '').length
      }))
    });
    const itemUids = songs.map((song, index) => {
      const songId = createOnSongArchiveId();
      const songUid = this.addSong(song, songId, now);
      const itemUid = this.addObject({
        ID: this.addString(JSON.stringify({ setID: setId, songID: songId, orderIndex: index })),
        songID: this.addString(songId),
        bookID: this.nullUid,
        orderIndex: this.addNumber(index),
        setID: this.addString(setId),
        song: songUid,
        $class: this.songSetItemClassUid
      });
      console.info('ONSONG_ARCHIVE_WRITER_ITEM', {
        index,
        title: song.title,
        songObjectIndex: songUid.$uid,
        songSetItemObjectIndex: itemUid.$uid
      });
      return itemUid;
    });

    const itemArrayUid = this.addObject({
      'NS.objects': itemUids,
      $class: this.mutableArrayClassUid
    });
    console.info('ONSONG_ARCHIVE_WRITER_COLLECTION', {
      setlistName: setlist.name,
      songSetItemReferenceCount: itemUids.length,
      songSetItemObjectIndexes: itemUids.map((item) => item.$uid),
      collectionArrayObjectIndex: itemArrayUid.$uid
    });
    const collectionUid = this.addObject({
      collection: itemArrayUid,
      class: this.addString('SongSetItem'),
      index: this.nullUid,
      $class: this.songSetItemCollectionClassUid
    });
    const rootUid = this.addObject({
      modified: this.nullUid,
      playbackContinuity: this.addNumber(0),
      useSeparateStyles: this.nullUid,
      title: this.addString(setlist.name.trim() || 'OpenStage Setlist'),
      unarchived: this.nullUid,
      summary: this.nullUid,
      songs: collectionUid,
      archived: this.nullUid,
      providerName: this.nullUid,
      sceneID: this.nullUid,
      orderDirection: this.addNumber(0),
      datetime: this.addArchiveDate(now),
      quantity: this.nullUid,
      orderMethod: this.addString('orderIndex'),
      user: this.nullUid,
      providerUri: this.nullUid,
      expires: this.nullUid,
      ID: this.nullUid,
      hasTime: this.nullUid,
      created: this.nullUid,
      orderIndex: this.nullUid,
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
    const originalChart = song.rawChordPro || song.chart || '';
    const exportTextReport = sanitizeOnSongExportText(originalChart);
    const cleanChart = exportTextReport.strippedLyrics;
    const title = song.title?.trim() || 'Untitled Song';
    const artist = song.artist?.trim() || '';
    const key = song.key?.trim() || '';
    const performanceKey = song.performanceKey?.trim() || key;
    const capo = finiteNumber(song.capo, 0);
    const tempo = finiteNumber(song.bpm, 0);
    const duration = finiteNumber(song.durationSeconds, 0);
    const timeSignature = song.timeSignature?.trim() || '';
    const exportSongReport = {
      title,
      originalLyrics: exportTextReport.originalLyrics,
      strippedLyrics: exportTextReport.strippedLyrics,
      originalTitle: song.title ?? '',
      finalTitle: title,
      originalByline: song.artist ?? '',
      finalByline: artist,
      originalLyricsLength: exportTextReport.originalLyrics.length,
      strippedLyricsLength: exportTextReport.strippedLyrics.length,
      remainingHarmonyTokens: exportTextReport.remainingHarmonyTokens,
      controlCharacters: exportTextReport.controlCharacters,
      lyricsObjectType: 'NSMutableString',
      contentObjectType: 'NSString',
      lyricsEqualsContent: true,
      importSafe: exportTextReport.importSafe
    };
    console.info('ONSONG_EXPORT_SONG_CONTENT_REPORT', exportSongReport);

    return this.addObject({
      ID: this.addString(songId),
      user: this.nullUid,
      key: key ? this.addString(key) : this.nullUid,
      title: this.addString(title),
      sortTitle: this.addString(title),
      byline: artist ? this.addString(artist) : this.nullUid,
      bylineAlpha: artist ? this.addString(artist.slice(0, 1).toUpperCase()) : this.nullUid,
      content: this.addString(cleanChart),
      lyrics: this.addMutableString(cleanChart),
      filepath: this.addString(`${sanitizeFileName(title)}.txt`),
      capo: this.addNumber(capo),
      tempo: tempo ? this.addNumber(tempo) : this.nullUid,
      duration: duration ? this.addNumber(duration) : this.nullUid,
      timeSignature: timeSignature ? this.addString(timeSignature) : this.nullUid,
      keywords: Array.isArray(song.tags) && song.tags.length ? this.addArray(song.tags.map((tag) => this.addString(tag))) : this.nullUid,
      notes: this.nullUid,
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
      fontSize: this.addNumber(16),
      headerFontName: this.addString('Helvetica-Bold'),
      headerFontSize: this.addNumber(24),
      chordFontName: this.addString('Helvetica-Bold'),
      chordFontSize: this.addNumber(16),
      metadataFontName: this.addString('Helvetica'),
      metadataFontSize: this.addNumber(16),
      monospacedFontName: this.addString('Courier'),
      monospacedFontSize: this.addNumber(16),
      lineSpacing: this.addNumber(1),
      beatsPerLine: this.addNumber(4),
      zoomScale: this.addNumber(1),
      zoomPointX: 0,
      zoomPointY: 0,
      diagramPosition: 0,
      showCapoedChords: this.addNumber(0),
      adjustForCapo: false,
      performTransposition: true,
      language: this.addString('en'),
      imported: this.addNumber(1),
      deleted: this.addNumber(0),
      usefile: this.addNumber(0),
      loaned: this.addNumber(0),
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
    return this.addObject({
      'NS.time': (date.getTime() - Date.UTC(2001, 0, 1)) / 1000,
      $class: this.dateClassUid
    });
  }

  private addMutableString(value: string) {
    return this.addObject({
      $class: this.mutableStringClassUid,
      'NS.string': value
    });
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

  private addNumber(value: number) {
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

function createOnSongArchiveId() {
  return createSongUuid().toUpperCase();
}

function sanitizeFileName(value: string) {
  const safe = value.trim().replace(/[<>:"/\\|?*\x00-\x1f]/g, '-').replace(/\s+/g, ' ').slice(0, 80);
  return safe || 'OpenStage Setlist';
}
