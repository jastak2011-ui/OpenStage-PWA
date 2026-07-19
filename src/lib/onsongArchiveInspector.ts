import { parseBinaryPlist, type BinaryPlistUid, type BinaryPlistValue } from './binaryPlist';

export type InspectedPlistObject =
  | { index: number; offset: number; marker: number; kind: 'null'; value: null }
  | { index: number; offset: number; marker: number; kind: 'bool'; value: boolean }
  | { index: number; offset: number; marker: number; kind: 'int'; value: number; byteLength: number }
  | { index: number; offset: number; marker: number; kind: 'real'; value: number; byteLength: number }
  | { index: number; offset: number; marker: number; kind: 'date'; secondsSince2001: number; iso: string }
  | { index: number; offset: number; marker: number; kind: 'data'; byteLength: number }
  | { index: number; offset: number; marker: number; kind: 'string'; value: string; encoding: 'ascii' | 'utf16be'; length: number }
  | { index: number; offset: number; marker: number; kind: 'uid'; uid: number; byteLength: number }
  | { index: number; offset: number; marker: number; kind: 'array'; refs: number[] }
  | { index: number; offset: number; marker: number; kind: 'dict'; entries: Array<{ keyRef: number; key: string; valueRef: number; valueType: string; valueClass?: string }> };

export type OnSongArchiveInspection = {
  fileName: string;
  fileLength: number;
  header: string;
  trailer: {
    offsetIntSize: number;
    objectRefSize: number;
    objectCount: number;
    topObject: number;
    offsetTableOffset: number;
    trailerHex: string;
  };
  offsets: number[];
  offsetTableHex: string;
  objects: InspectedPlistObject[];
  topLevel: Record<string, unknown>;
  classDictionaries: Array<{ index: number; className: string; classes: string[] }>;
  reachableFromRoot: number[];
  roles: {
    root?: InspectedRole;
    songSetItemCollection: InspectedRole[];
    mutableArrays: InspectedRole[];
    songSetItems: InspectedRole[];
    songs: InspectedRole[];
  };
  relationships: OnSongSetRelationshipReport;
  songContentReports: OnSongExportedSongContentReport[];
  validation: {
    errors: string[];
    danglingRefs: Array<{ from: number; ref: number; key?: string }>;
  };
};

export type OnSongExportedSongContentReport = {
  objectIndex: number;
  title: InspectedResolvedValue;
  byline: InspectedResolvedValue;
  content: InspectedResolvedValue;
  lyrics: InspectedResolvedValue;
  remainingHarmonyTokens: string[];
  controlCharacters: Array<{ index: number; character: string; codePoint: string; reason: string }>;
  lyricsObjectType: string;
  contentObjectType: string;
  lyricsEqualsContent: boolean;
  importSafe: boolean;
};

export type OnSongSetRelationshipReport = {
  songSet?: {
    objectIndex: number;
    id: InspectedResolvedValue;
    title: InspectedResolvedValue;
    songsReference: InspectedResolvedValue;
    properties: Record<string, InspectedResolvedValue>;
  };
  collection?: {
    objectIndex: number;
    collectionReference: InspectedResolvedValue;
    classValue: InspectedResolvedValue;
    indexValue: InspectedResolvedValue;
    orderedItemRefs: number[];
  };
  items: Array<{
    itemObjectIndex: number;
    itemId: InspectedResolvedValue;
    setId: InspectedResolvedValue;
    songId: InspectedResolvedValue;
    songObjectIndex: number | null;
    referencedSongId: InspectedResolvedValue;
    orderIndex: InspectedResolvedValue;
    setIdMatchesParent: boolean;
    songIdMatchesReferencedSong: boolean;
    uniqueItemId: boolean;
    validOrderIndex: boolean;
  }>;
};

export type InspectedResolvedValue = {
  value: unknown;
  type: string;
  className?: string;
  ref?: number;
};

export type InspectedRole = {
  index: number;
  className?: string;
  keys: Array<{ key: string; valueType: string; valueClass?: string; valueRef: number }>;
};

export type OnSongArchiveDiff = {
  container: Array<Record<string, unknown>>;
  topLevel: Array<Record<string, unknown>>;
  classes: Array<Record<string, unknown>>;
  roles: Array<Record<string, unknown>>;
  objectGraph: Array<Record<string, unknown>>;
  summary: {
    genuineFile: string;
    generatedFile: string;
    genuineObjects: number;
    generatedObjects: number;
    genuineReachable: number;
    generatedReachable: number;
    issueCount: number;
  };
};

export function inspectOnSongArchive(buffer: ArrayBuffer, fileName = 'archive'): OnSongArchiveInspection {
  const data = new Uint8Array(buffer);
  const parsedArchive = parseBinaryPlist(buffer);
  const header = readAscii(data, 0, Math.min(8, data.length));
  if (header !== 'bplist00') throw new Error('Not a binary plist archive.');
  if (data.length < 40) throw new Error('Invalid binary plist length.');

  const trailerOffset = data.length - 32;
  const offsetIntSize = data[trailerOffset + 6];
  const objectRefSize = data[trailerOffset + 7];
  const objectCount = readUInt(data, trailerOffset + 8, 8);
  const topObject = readUInt(data, trailerOffset + 16, 8);
  const offsetTableOffset = readUInt(data, trailerOffset + 24, 8);
  const offsets = Array.from({ length: objectCount }, (_, index) => readUInt(data, offsetTableOffset + index * offsetIntSize, offsetIntSize));

  const parseObject = (index: number): InspectedPlistObject => {
    const offset = offsets[index];
    const marker = data[offset];
    const type = marker >> 4;
    const info = marker & 0x0f;

    if (type === 0x0) {
      if (info === 0x0) return { index, offset, marker, kind: 'null', value: null };
      if (info === 0x8 || info === 0x9) return { index, offset, marker, kind: 'bool', value: info === 0x9 };
      throw new Error(`Unsupported simple object marker 0x${marker.toString(16)} at object ${index}.`);
    }
    if (type === 0x1) {
      const byteLength = 2 ** info;
      return { index, offset, marker, kind: 'int', value: readUInt(data, offset + 1, byteLength), byteLength };
    }
    if (type === 0x2) {
      const byteLength = 2 ** info;
      const value = byteLength === 4 ? readFloat32(data, offset + 1) : readFloat64(data, offset + 1);
      return { index, offset, marker, kind: 'real', value, byteLength };
    }
    if (type === 0x3) {
      const secondsSince2001 = readFloat64(data, offset + 1);
      return {
        index,
        offset,
        marker,
        kind: 'date',
        secondsSince2001,
        iso: new Date(Date.UTC(2001, 0, 1) + secondsSince2001 * 1000).toISOString()
      };
    }
    if (type === 0x4) {
      const length = readLength(data, offset, info);
      return { index, offset, marker, kind: 'data', byteLength: length.length };
    }
    if (type === 0x5 || type === 0x6) {
      const length = readLength(data, offset, info);
      return {
        index,
        offset,
        marker,
        kind: 'string',
        value: type === 0x5 ? readAscii(data, length.start, length.length) : readUtf16(data, length.start, length.length),
        encoding: type === 0x5 ? 'ascii' : 'utf16be',
        length: length.length
      };
    }
    if (type === 0x8) {
      const byteLength = info + 1;
      return { index, offset, marker, kind: 'uid', uid: readUInt(data, offset + 1, byteLength), byteLength };
    }
    if (type === 0xa) {
      const length = readLength(data, offset, info);
      const refs = Array.from({ length: length.length }, (_, refIndex) => readUInt(data, length.start + refIndex * objectRefSize, objectRefSize));
      return { index, offset, marker, kind: 'array', refs };
    }
    if (type === 0xd) {
      const length = readLength(data, offset, info);
      const keyRefs = Array.from({ length: length.length }, (_, refIndex) => readUInt(data, length.start + refIndex * objectRefSize, objectRefSize));
      const valueStart = length.start + length.length * objectRefSize;
      const valueRefs = Array.from({ length: length.length }, (_, refIndex) => readUInt(data, valueStart + refIndex * objectRefSize, objectRefSize));
      return {
        index,
        offset,
        marker,
        kind: 'dict',
        entries: keyRefs.map((keyRef, entryIndex) => ({
          keyRef,
          key: objectString(parseObject(keyRef)),
          valueRef: valueRefs[entryIndex],
          valueType: '',
        }))
      };
    }
    throw new Error(`Unsupported object marker 0x${marker.toString(16)} at object ${index}.`);
  };

  const objects = offsets.map((_, index) => parseObject(index));
  objects.forEach((object) => {
    if (object.kind !== 'dict') return;
    object.entries = object.entries.map((entry) => {
      const target = objects[entry.valueRef];
      return {
        ...entry,
        valueType: target ? target.kind : 'dangling',
        valueClass: target ? classNameForObject(objects, target.index) : undefined
      };
    });
  });

  const topObjectValue = objects[topObject];
  const topLevel = topObjectValue?.kind === 'dict' ? dictToObject(objects, topObjectValue.index) : {};
  const rootUid = uidValue(topLevel.$top, objects, 'root');
  const archiveObjects = archiveObjectTable(parsedArchive);
  const reachableFromRoot = rootUid === undefined ? [] : collectArchiveReachable(archiveObjects, rootUid);
  const classDictionaries: Array<{ index: number; className: string; classes: string[] }> = [];
  archiveObjects.forEach((object, index) => {
    if (!isArchiveDict(object)) return;
    const className = archiveDictValue(object, '$classname');
    if (typeof className !== 'string') return;
    const classes = archiveDictValue(object, '$classes');
    classDictionaries.push({
      index,
      className,
      classes: Array.isArray(classes) ? classes.map(String) : []
    });
  });
  const roles = {
    root: rootUid === undefined ? undefined : archiveRoleFor(archiveObjects, rootUid),
    songSetItemCollection: archiveRolesByClass(archiveObjects, 'SongSetItemCollection'),
    mutableArrays: archiveRolesByClass(archiveObjects, 'NSMutableArray'),
    songSetItems: archiveRolesByClass(archiveObjects, 'SongSetItem'),
    songs: archiveRolesByClass(archiveObjects, 'Song')
  };
  const relationships = buildSetRelationshipReport(archiveObjects, rootUid);
  const songContentReports = buildSongContentReports(archiveObjects);
  const danglingRefs: Array<{ from: number; ref: number; key?: string }> = [];
  objects.forEach((object) => {
    refsForObject(object).forEach((ref) => {
      if (ref.ref < 0 || ref.ref >= objects.length) danglingRefs.push({ from: object.index, ref: ref.ref, key: ref.key });
    });
  });

  return {
    fileName,
    fileLength: data.length,
    header,
    trailer: {
      offsetIntSize,
      objectRefSize,
      objectCount,
      topObject,
      offsetTableOffset,
      trailerHex: hex(data.slice(trailerOffset))
    },
    offsets,
    offsetTableHex: hex(data.slice(offsetTableOffset, trailerOffset)),
    objects,
    topLevel,
    classDictionaries,
    reachableFromRoot,
    roles,
    relationships,
    songContentReports,
    validation: {
      errors: [
        ...(topObject >= objects.length ? [`topObject ${topObject} is outside object table`] : []),
        ...(objects.length !== objectCount ? [`parsed object count ${objects.length} does not match trailer object count ${objectCount}`] : []),
        ...(offsetTableOffset >= trailerOffset ? ['offset table points beyond object data'] : [])
      ],
      danglingRefs
    }
  };
}

export function diffOnSongArchiveInspections(genuine: OnSongArchiveInspection, generated: OnSongArchiveInspection): OnSongArchiveDiff {
  const container = compareFields('container', genuine, generated, ['header', 'fileLength']);
  container.push(...compareFields('trailer', genuine.trailer, generated.trailer, ['offsetIntSize', 'objectRefSize', 'objectCount', 'topObject', 'offsetTableOffset']));

  const topLevel = compareFields('topLevel', genuine.topLevel, generated.topLevel, ['$archiver', '$version']);
  const topDiff = compareValue('$top', normalizeForJson(genuine.topLevel.$top), normalizeForJson(generated.topLevel.$top));
  if (topDiff) topLevel.push(topDiff);

  const classes = compareClassDictionaries(genuine, generated);
  const roles = [
    ...compareRoleSet('root', genuine.roles.root ? [genuine.roles.root] : [], generated.roles.root ? [generated.roles.root] : []),
    ...compareRoleSet('SongSetItemCollection', genuine.roles.songSetItemCollection, generated.roles.songSetItemCollection),
    ...compareRoleSet('NSMutableArray', genuine.roles.mutableArrays, generated.roles.mutableArrays),
    ...compareRoleSet('SongSetItem', genuine.roles.songSetItems, generated.roles.songSetItems),
    ...compareRoleSet('Song', genuine.roles.songs, generated.roles.songs)
  ];

  const objectGraph = [
    ...compareReachableClassCounts(genuine, generated),
    ...compareReachableKinds(genuine, generated)
  ];
  const issueCount = container.length + topLevel.length + classes.length + roles.length + objectGraph.length;

  return {
    container,
    topLevel,
    classes,
    roles,
    objectGraph,
    summary: {
      genuineFile: genuine.fileName,
      generatedFile: generated.fileName,
      genuineObjects: genuine.objects.length,
      generatedObjects: generated.objects.length,
      genuineReachable: genuine.reachableFromRoot.length,
      generatedReachable: generated.reachableFromRoot.length,
      issueCount
    }
  };
}

function compareFields(section: string, genuine: Record<string, unknown>, generated: Record<string, unknown>, keys: string[]) {
  return keys.map((key) => compareValue(`${section}.${key}`, genuine[key], generated[key])).filter(Boolean) as Array<Record<string, unknown>>;
}

function compareValue(path: string, genuine: unknown, generated: unknown) {
  if (JSON.stringify(genuine) === JSON.stringify(generated)) return null;
  return { path, genuine, generated };
}

function compareClassDictionaries(genuine: OnSongArchiveInspection, generated: OnSongArchiveInspection) {
  const issues: Array<Record<string, unknown>> = [];
  const genuineByName = new Map(genuine.classDictionaries.map((item) => [item.className, item]));
  const generatedByName = new Map(generated.classDictionaries.map((item) => [item.className, item]));
  Array.from(new Set([...genuineByName.keys(), ...generatedByName.keys()])).sort().forEach((className) => {
    const realClass = genuineByName.get(className);
    const generatedClass = generatedByName.get(className);
    if (!realClass) issues.push({ path: `class.${className}`, issue: 'extra class in generated archive', generated: generatedClass });
    else if (!generatedClass) issues.push({ path: `class.${className}`, issue: 'missing class in generated archive', genuine: realClass });
    else if (JSON.stringify(realClass.classes) !== JSON.stringify(generatedClass.classes)) {
      issues.push({ path: `class.${className}.$classes`, genuine: realClass.classes, generated: generatedClass.classes });
    }
  });
  return issues;
}

function compareRoleSet(roleName: string, genuine: InspectedRole[], generated: InspectedRole[]) {
  const issues: Array<Record<string, unknown>> = [];
  if (genuine.length !== generated.length) issues.push({ path: `role.${roleName}.count`, genuine: genuine.length, generated: generated.length });
  const count = Math.min(genuine.length, generated.length);
  for (let index = 0; index < count; index += 1) {
    const realRole = genuine[index];
    const generatedRole = generated[index];
    const realKeys = new Map(realRole.keys.map((key) => [key.key, key]));
    const generatedKeys = new Map(generatedRole.keys.map((key) => [key.key, key]));
    Array.from(new Set([...realKeys.keys(), ...generatedKeys.keys()])).sort().forEach((key) => {
      const realKey = realKeys.get(key);
      const generatedKey = generatedKeys.get(key);
      if (!realKey) issues.push({ path: `role.${roleName}[${index}].${key}`, issue: 'extra key in generated archive', generated: generatedKey });
      else if (!generatedKey) issues.push({ path: `role.${roleName}[${index}].${key}`, issue: 'missing key in generated archive', genuine: realKey });
      else if (realKey.valueType !== generatedKey.valueType || realKey.valueClass !== generatedKey.valueClass) {
        issues.push({ path: `role.${roleName}[${index}].${key}`, issue: 'value type/class mismatch', genuine: realKey, generated: generatedKey });
      }
    });
  }
  return issues;
}

function compareReachableClassCounts(genuine: OnSongArchiveInspection, generated: OnSongArchiveInspection) {
  const classCounts = (inspection: OnSongArchiveInspection) => {
    const counts: Record<string, number> = {};
    inspection.reachableFromRoot.forEach((index) => {
      const className = classNameForObject(inspection.objects, index) || inspection.objects[index]?.kind || 'unknown';
      counts[className] = (counts[className] || 0) + 1;
    });
    return counts;
  };
  const realCounts = classCounts(genuine);
  const generatedCounts = classCounts(generated);
  return Array.from(new Set([...Object.keys(realCounts), ...Object.keys(generatedCounts)])).sort()
    .map((key) => compareValue(`reachable.classCount.${key}`, realCounts[key] || 0, generatedCounts[key] || 0))
    .filter(Boolean) as Array<Record<string, unknown>>;
}

function compareReachableKinds(genuine: OnSongArchiveInspection, generated: OnSongArchiveInspection) {
  const kindCounts = (inspection: OnSongArchiveInspection) => {
    const counts: Record<string, number> = {};
    inspection.reachableFromRoot.forEach((index) => {
      const kind = inspection.objects[index]?.kind || 'unknown';
      counts[kind] = (counts[kind] || 0) + 1;
    });
    return counts;
  };
  const realCounts = kindCounts(genuine);
  const generatedCounts = kindCounts(generated);
  return Array.from(new Set([...Object.keys(realCounts), ...Object.keys(generatedCounts)])).sort()
    .map((key) => compareValue(`reachable.kindCount.${key}`, realCounts[key] || 0, generatedCounts[key] || 0))
    .filter(Boolean) as Array<Record<string, unknown>>;
}

function archiveObjectTable(parsedArchive: BinaryPlistValue) {
  const objects = isArchiveDict(parsedArchive) ? archiveDictValue(parsedArchive, '$objects') : undefined;
  return Array.isArray(objects) ? objects as BinaryPlistValue[] : [];
}

function archiveRoleFor(objects: BinaryPlistValue[], index: number): InspectedRole {
  const object = objects[index];
  return {
    index,
    className: archiveClassNameForObject(objects, index),
    keys: isArchiveDict(object)
      ? Object.entries(object)
          .filter(([key]) => key !== '$class')
          .map(([key, value]) => ({
            key,
            valueType: archiveValueType(value),
            valueClass: isBinaryPlistUid(value) ? archiveClassNameForObject(objects, value.$uid) : undefined,
            valueRef: isBinaryPlistUid(value) ? value.$uid : -1
          }))
      : []
  };
}

function archiveRolesByClass(objects: BinaryPlistValue[], className: string) {
  return objects
    .map((_, index) => index)
    .filter((index) => archiveClassNameForObject(objects, index) === className)
    .map((index) => archiveRoleFor(objects, index));
}

function collectArchiveReachable(objects: BinaryPlistValue[], root: number) {
  const seen = new Set<number>();
  const visit = (index: number) => {
    if (seen.has(index) || index < 0 || index >= objects.length) return;
    seen.add(index);
    archiveRefsForValue(objects[index]).forEach(visit);
  };
  visit(root);
  return Array.from(seen).sort((a, b) => a - b);
}

function archiveRefsForValue(value: BinaryPlistValue): number[] {
  if (isBinaryPlistUid(value)) return [value.$uid];
  if (Array.isArray(value)) return value.flatMap(archiveRefsForValue);
  if (isArchiveDict(value)) return Object.values(value).flatMap(archiveRefsForValue);
  return [];
}

function archiveClassNameForObject(objects: BinaryPlistValue[], index: number) {
  const object = objects[index];
  const classUid = isArchiveDict(object) ? archiveDictValue(object, '$class') : undefined;
  if (!isBinaryPlistUid(classUid)) return undefined;
  const classObject = objects[classUid.$uid];
  const className = isArchiveDict(classObject) ? archiveDictValue(classObject, '$classname') : undefined;
  return typeof className === 'string' ? className : undefined;
}

function archiveValueType(value: unknown) {
  if (isBinaryPlistUid(value)) return 'uid';
  if (Array.isArray(value)) return 'array';
  if (value instanceof Uint8Array) return 'data';
  if (value instanceof Date) return 'date';
  if (value === null) return 'null';
  return typeof value;
}

function buildSetRelationshipReport(objects: BinaryPlistValue[], rootUid: number | undefined): OnSongSetRelationshipReport {
  const root = rootUid === undefined ? undefined : objects[rootUid];
  const songSet = rootUid === undefined || !isArchiveDict(root) ? undefined : {
    objectIndex: rootUid,
    id: resolvedField(objects, root, 'ID'),
    title: resolvedField(objects, root, 'title'),
    songsReference: resolvedField(objects, root, 'songs'),
    properties: Object.fromEntries(Object.keys(root)
      .filter((key) => key !== '$class')
      .map((key) => [key, resolvedField(objects, root, key)]))
  };
  const collectionRef = songSet?.songsReference.ref;
  const collectionObject = collectionRef === undefined ? undefined : objects[collectionRef];
  const collection = collectionRef === undefined || !isArchiveDict(collectionObject) ? undefined : {
    objectIndex: collectionRef,
    collectionReference: resolvedField(objects, collectionObject, 'collection'),
    classValue: resolvedField(objects, collectionObject, 'class'),
    indexValue: resolvedField(objects, collectionObject, 'index'),
    orderedItemRefs: collectionItemRefs(objects, collectionObject)
  };
  const itemIds = new Map<string, number>();
  const itemObjects = collection?.orderedItemRefs.length
    ? collection.orderedItemRefs
    : objects.map((object, index) => archiveClassNameForObject(objects, index) === 'SongSetItem' ? index : -1).filter((index) => index >= 0);
  const parentComparableSetId = comparableSetId(songSet?.id);

  const items = itemObjects.map((itemObjectIndex) => {
    const itemObject = objects[itemObjectIndex];
    const itemId = isArchiveDict(itemObject) ? resolvedField(objects, itemObject, 'ID') : emptyResolvedValue();
    const setId = isArchiveDict(itemObject) ? resolvedField(objects, itemObject, 'setID') : emptyResolvedValue();
    const songId = isArchiveDict(itemObject) ? resolvedField(objects, itemObject, 'songID') : emptyResolvedValue();
    const song = isArchiveDict(itemObject) ? resolvedField(objects, itemObject, 'song') : emptyResolvedValue();
    const orderIndex = isArchiveDict(itemObject) ? resolvedField(objects, itemObject, 'orderIndex') : emptyResolvedValue();
    const songObject = typeof song.ref === 'number' ? objects[song.ref] : undefined;
    const referencedSongId = isArchiveDict(songObject) ? resolvedField(objects, songObject, 'ID') : emptyResolvedValue();
    const itemIdKey = String(itemId.value ?? '');
    itemIds.set(itemIdKey, (itemIds.get(itemIdKey) || 0) + 1);
    return {
      itemObjectIndex,
      itemId,
      setId,
      songId,
      songObjectIndex: typeof song.ref === 'number' ? song.ref : null,
      referencedSongId,
      orderIndex,
      setIdMatchesParent: parentComparableSetId ? String(setId.value ?? '') === parentComparableSetId : true,
      songIdMatchesReferencedSong: String(songId.value ?? '') === String(referencedSongId.value ?? ''),
      uniqueItemId: true,
      validOrderIndex: typeof orderIndex.value === 'number' && Number.isInteger(orderIndex.value)
    };
  });
  return {
    songSet,
    collection,
    items: items.map((item) => ({
      ...item,
      uniqueItemId: (itemIds.get(String(item.itemId.value ?? '')) || 0) === 1
    }))
  };
}

function buildSongContentReports(objects: BinaryPlistValue[]): OnSongExportedSongContentReport[] {
  return objects
    .map((object, objectIndex) => ({ object, objectIndex }))
    .filter(({ objectIndex }) => archiveClassNameForObject(objects, objectIndex) === 'Song')
    .map(({ object, objectIndex }) => {
      const songObject = isArchiveDict(object) ? object : {};
      const content = resolvedField(objects, songObject, 'content');
      const lyrics = resolvedField(objects, songObject, 'lyrics');
      const contentText = typeof content.value === 'string' ? content.value : '';
      const lyricsText = typeof lyrics.value === 'string' ? lyrics.value : '';
      const suspicious = suspiciousCharactersForOnSong(`${contentText}\n${lyricsText}`);
      const remainingHarmonyTokens = [
        ...(contentText.match(/\[\/?HARMONY\]/gi) ?? []),
        ...(lyricsText.match(/\[\/?HARMONY\]/gi) ?? [])
      ];
      return {
        objectIndex,
        title: resolvedField(objects, songObject, 'title'),
        byline: resolvedField(objects, songObject, 'byline'),
        content,
        lyrics,
        remainingHarmonyTokens,
        controlCharacters: suspicious,
        lyricsObjectType: lyrics.className ?? lyrics.type,
        contentObjectType: content.className ?? content.type,
        lyricsEqualsContent: lyricsText === contentText,
        importSafe: Boolean(contentText.trim()) && lyricsText === contentText && remainingHarmonyTokens.length === 0 && suspicious.length === 0
      };
    });
}

function suspiciousCharactersForOnSong(value: string) {
  const suspicious: Array<{ index: number; character: string; codePoint: string; reason: string }> = [];
  for (let index = 0; index < value.length; index += 1) {
    const codePoint = value.codePointAt(index);
    if (codePoint === undefined) continue;
    const character = String.fromCodePoint(codePoint);
    if (codePoint > 0xffff) index += 1;
    const reason = unsupportedOnSongCharacterReason(codePoint);
    if (reason) {
      suspicious.push({
        index,
        character,
        codePoint: `U+${codePoint.toString(16).toUpperCase().padStart(4, '0')}`,
        reason
      });
    }
  }
  return suspicious;
}

function unsupportedOnSongCharacterReason(codePoint: number) {
  if ((codePoint >= 0x0000 && codePoint <= 0x0008) || codePoint === 0x000b || codePoint === 0x000c || (codePoint >= 0x000e && codePoint <= 0x001f) || codePoint === 0x007f) return 'control';
  if (
    codePoint === 0x200b ||
    codePoint === 0x200c ||
    codePoint === 0x200d ||
    codePoint === 0x2060 ||
    codePoint === 0xfeff ||
    (codePoint >= 0xfe00 && codePoint <= 0xfe0f)
  ) return 'zero-width';
  if ((codePoint >= 0xe000 && codePoint <= 0xf8ff) || (codePoint >= 0xf0000 && codePoint <= 0xffffd) || (codePoint >= 0x100000 && codePoint <= 0x10fffd)) return 'private-use';
  return '';
}

function collectionItemRefs(objects: BinaryPlistValue[], collectionObject: Record<string, BinaryPlistValue>) {
  const collectionValue = archiveDictValue(collectionObject, 'collection');
  if (!isBinaryPlistUid(collectionValue)) return [];
  const arrayObject = objects[collectionValue.$uid];
  if (!isArchiveDict(arrayObject)) return [];
  const items = archiveDictValue(arrayObject, 'NS.objects');
  return Array.isArray(items) ? items.filter(isBinaryPlistUid).map((item) => item.$uid) : [];
}

function resolvedField(objects: BinaryPlistValue[], object: Record<string, BinaryPlistValue>, key: string): InspectedResolvedValue {
  const value = archiveDictValue(object, key);
  return resolveArchiveValue(objects, value);
}

function resolveArchiveValue(objects: BinaryPlistValue[], value: unknown): InspectedResolvedValue {
  if (isBinaryPlistUid(value)) {
    const target = objects[value.$uid];
    return {
      value: primitiveArchiveValue(target),
      type: archiveValueType(value),
      className: archiveClassNameForObject(objects, value.$uid),
      ref: value.$uid
    };
  }
  return {
    value: primitiveArchiveValue(value),
    type: archiveValueType(value)
  };
}

function primitiveArchiveValue(value: unknown): unknown {
  if (value === '$null') return '$null';
  if (isBinaryPlistUid(value)) return { $uid: value.$uid };
  if (isArchiveDict(value) && typeof value['NS.time'] === 'number') return value['NS.time'];
  if (isArchiveDict(value) && typeof value['NS.string'] === 'string') return value['NS.string'];
  if (isArchiveDict(value)) return '[object]';
  if (Array.isArray(value)) return `[array:${value.length}]`;
  return value;
}

function comparableSetId(value: InspectedResolvedValue | undefined) {
  if (!value || value.value === '$null' || value.value === undefined || value.value === null) return '';
  return String(value.value);
}

function emptyResolvedValue(): InspectedResolvedValue {
  return { value: undefined, type: 'missing' };
}

function roleFor(objects: InspectedPlistObject[], index: number): InspectedRole {
  const object = objects[index];
  return {
    index,
    className: classNameForObject(objects, index),
    keys: object?.kind === 'dict' ? object.entries.map((entry) => ({
      key: entry.key,
      valueType: entry.valueType,
      valueClass: entry.valueClass,
      valueRef: entry.valueRef
    })) : []
  };
}

function rolesByClass(objects: InspectedPlistObject[], className: string) {
  return objects
    .filter((object) => classNameForObject(objects, object.index) === className)
    .map((object) => roleFor(objects, object.index));
}

function classNameForObject(objects: InspectedPlistObject[], objectIndex: number) {
  const object = objects[objectIndex];
  if (!object || object.kind !== 'dict') return undefined;
  const classEntry = object.entries.find((entry) => entry.key === '$class');
  if (!classEntry) return undefined;
  const classObject = objects[classEntry.valueRef];
  if (!classObject || classObject.kind !== 'dict') return undefined;
  const nameEntry = classObject.entries.find((entry) => entry.key === '$classname');
  const nameObject = nameEntry ? objects[nameEntry.valueRef] : undefined;
  return nameObject?.kind === 'string' ? nameObject.value : undefined;
}

function dictToObject(objects: InspectedPlistObject[], index: number): Record<string, unknown> {
  const object = objects[index];
  if (!object || object.kind !== 'dict') return {};
  const result: Record<string, unknown> = {};
  object.entries.forEach((entry) => {
    result[entry.key] = objectValue(objects, entry.valueRef);
  });
  return result;
}

function objectValue(objects: InspectedPlistObject[], index: number): unknown {
  const object = objects[index];
  if (!object) return { $dangling: index };
  if (object.kind === 'null') return '$null';
  if (object.kind === 'bool' || object.kind === 'int' || object.kind === 'real' || object.kind === 'string') return object.value;
  if (object.kind === 'date') return { 'NS.time': object.secondsSince2001 };
  if (object.kind === 'uid') return { $uid: object.uid };
  if (object.kind === 'array') return { 'NS.objects': object.refs.map((ref) => ({ $objectRef: ref })) };
  if (object.kind === 'dict') return Object.fromEntries(object.entries.map((entry) => [entry.key, { $objectRef: entry.valueRef, type: entry.valueType, className: entry.valueClass }]));
  if (object.kind === 'data') return { byteLength: object.byteLength };
  return undefined;
}

function arrayValue(value: unknown, objects: InspectedPlistObject[]) {
  if (!value || typeof value !== 'object' || !('$objectRef' in value)) return [];
  const object = objects[Number((value as { $objectRef: number }).$objectRef)];
  if (!object || object.kind !== 'array') return [];
  return object.refs.map((ref) => objectValue(objects, ref));
}

function uidValue(value: unknown, objects: InspectedPlistObject[], key: string) {
  if (value && typeof value === 'object' && key in value) {
    const direct = (value as Record<string, unknown>)[key];
    if (direct && typeof direct === 'object' && '$uid' in direct) return Number((direct as { $uid: number }).$uid);
    if (direct && typeof direct === 'object' && '$objectRef' in direct) {
      const uidObject = objects[Number((direct as { $objectRef: number }).$objectRef)];
      return uidObject?.kind === 'uid' ? uidObject.uid : undefined;
    }
  }
  if (!value || typeof value !== 'object' || !('$objectRef' in value)) return undefined;
  const object = objects[Number((value as { $objectRef: number }).$objectRef)];
  if (!object || object.kind !== 'dict') return undefined;
  const entry = object.entries.find((item) => item.key === key);
  const uidObject = entry ? objects[entry.valueRef] : undefined;
  return uidObject?.kind === 'uid' ? uidObject.uid : undefined;
}

function stringEntryValue(objects: InspectedPlistObject[], object: Extract<InspectedPlistObject, { kind: 'dict' }>, key: string) {
  const entry = object.entries.find((item) => item.key === key);
  const target = entry ? objects[entry.valueRef] : undefined;
  return target?.kind === 'string' ? target.value : undefined;
}

function arrayEntryValues(objects: InspectedPlistObject[], object: Extract<InspectedPlistObject, { kind: 'dict' }>, key: string) {
  const entry = object.entries.find((item) => item.key === key);
  const target = entry ? objects[entry.valueRef] : undefined;
  return target?.kind === 'array' ? target.refs.map((ref) => objectValue(objects, ref)) : [];
}

function collectReachable(objects: InspectedPlistObject[], root: number) {
  const seen = new Set<number>();
  const visit = (index: number) => {
    if (seen.has(index) || index < 0 || index >= objects.length) return;
    seen.add(index);
    refsForObject(objects[index]).forEach((ref) => visit(ref.ref));
  };
  visit(root);
  return Array.from(seen).sort((a, b) => a - b);
}

function refsForObject(object: InspectedPlistObject): Array<{ ref: number; key?: string }> {
  if (object.kind === 'uid') return [{ ref: object.uid, key: '$uid' }];
  if (object.kind === 'array') return object.refs.map((ref) => ({ ref }));
  if (object.kind === 'dict') return object.entries.flatMap((entry) => [{ ref: entry.keyRef, key: `${entry.key}:key` }, { ref: entry.valueRef, key: entry.key }]);
  return [];
}

function objectString(object: InspectedPlistObject) {
  return object.kind === 'string' ? object.value : `$object-${object.index}`;
}

function readLength(data: Uint8Array, offset: number, info: number) {
  if (info < 0x0f) return { length: info, start: offset + 1 };
  const marker = data[offset + 1];
  const type = marker >> 4;
  const intInfo = marker & 0x0f;
  if (type !== 0x1) throw new Error(`Invalid length marker at offset ${offset}.`);
  const intSize = 2 ** intInfo;
  return { length: readUInt(data, offset + 2, intSize), start: offset + 2 + intSize };
}

function readUInt(data: Uint8Array, offset: number, length: number) {
  let value = 0;
  for (let index = 0; index < length; index += 1) value = value * 256 + data[offset + index];
  return value;
}

function readAscii(data: Uint8Array, offset: number, length: number) {
  let value = '';
  for (let index = 0; index < length; index += 1) value += String.fromCharCode(data[offset + index]);
  return value;
}

function readUtf16(data: Uint8Array, offset: number, length: number) {
  let value = '';
  for (let index = 0; index < length; index += 1) value += String.fromCharCode(readUInt(data, offset + index * 2, 2));
  return value;
}

function readFloat32(data: Uint8Array, offset: number) {
  return new DataView(data.buffer, data.byteOffset + offset, 4).getFloat32(0, false);
}

function readFloat64(data: Uint8Array, offset: number) {
  return new DataView(data.buffer, data.byteOffset + offset, 8).getFloat64(0, false);
}

function hex(data: Uint8Array) {
  return Array.from(data).map((byte) => byte.toString(16).padStart(2, '0')).join('');
}

function normalizeForJson(value: unknown) {
  return JSON.parse(JSON.stringify(value));
}

function isBinaryPlistUid(value: unknown): value is BinaryPlistUid {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value) && typeof (value as BinaryPlistUid).$uid === 'number';
}

function isArchiveDict(value: unknown): value is Record<string, BinaryPlistValue> {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value) && !(value instanceof Uint8Array) && !isBinaryPlistUid(value);
}

function archiveDictValue(object: Record<string, unknown>, key: string) {
  return object[key];
}
