import { parseBinaryPlist, type BinaryPlistUid, type BinaryPlistValue } from './binaryPlist';

type ArchiveDictionary = Record<string, unknown>;

export type OnSongArchiveValidationResult = {
  ok: boolean;
  errors: string[];
  summary: {
    archiveObjectCount: number;
    archiver: string;
    version: number;
    topRootUid: number | null;
    classNames: string[];
    songCount: number;
    setItemCount: number;
  };
};

export function validateOnSongArchive(buffer: ArrayBuffer): OnSongArchiveValidationResult {
  const errors: string[] = [];
  let plist: BinaryPlistValue;
  try {
    plist = parseBinaryPlist(buffer);
  } catch (error) {
    return emptyValidation([error instanceof Error ? error.message : 'Invalid binary plist.']);
  }

  if (!isPlainObject(plist)) return emptyValidation(['Archive root is not a dictionary.']);
  const archive = plist as Record<string, BinaryPlistValue>;
  const objects = archive.$objects;
  const top = archive.$top;
  const archiver = typeof archive.$archiver === 'string' ? archive.$archiver : '';
  const version = typeof archive.$version === 'number' ? archive.$version : 0;
  const topRoot = isArchiveDictionary(top) ? dictionaryValue(top, 'root') : undefined;
  const topRootUid = isUid(topRoot) ? topRoot.$uid : null;

  if (archiver !== 'NSKeyedArchiver') errors.push('Missing NSKeyedArchiver marker.');
  if (version !== 100000) errors.push('Unexpected NSKeyedArchiver version.');
  if (!Array.isArray(objects)) errors.push('Missing $objects array.');
  if (topRootUid === null) errors.push('Missing $top.root UID.');

  if (!Array.isArray(objects)) return emptyValidation(errors);
  if (objects[0] !== '$null') errors.push('$objects[0] must be $null.');
  if (topRootUid !== null && (topRootUid < 0 || topRootUid >= objects.length)) errors.push('$top.root UID points outside $objects.');

  const classNames: string[] = [];
  let songCount = 0;
  let setItemCount = 0;

  objects.forEach((object, index) => {
    visitUids(object, (childUid, path) => {
      if (childUid < 0 || childUid >= objects.length) errors.push(`Dangling UID ${childUid} at $objects[${index}]${path}.`);
    });

    if (isArchiveDictionary(object)) {
      const className = dictionaryValue(object, '$classname');
      if (typeof className === 'string') classNames.push(className);
      if (isClassNamed(objects, dictionaryValue(object, '$class'), 'Song')) songCount += 1;
      if (isClassNamed(objects, dictionaryValue(object, '$class'), 'SongSetItem')) setItemCount += 1;
    }
  });

  ['SongSet', 'SongSetItemCollection', 'NSMutableArray', 'SongSetItem', 'Song', 'NSDate', 'NSMutableString'].forEach((name) => {
    if (!classNames.includes(name)) errors.push(`Missing required class ${name}.`);
  });
  const topRootObject = topRootUid !== null ? objects[topRootUid] : undefined;
  const topRootClass = isArchiveDictionary(topRootObject) ? dictionaryValue(topRootObject, '$class') : undefined;
  if (topRootUid !== null && !isClassNamed(objects, topRootClass, 'SongSet')) {
    errors.push('$top.root is not a SongSet.');
  }

  return {
    ok: errors.length === 0,
    errors,
    summary: {
      archiveObjectCount: objects.length,
      archiver,
      version,
      topRootUid,
      classNames,
      songCount,
      setItemCount
    }
  };
}

function emptyValidation(errors: string[]): OnSongArchiveValidationResult {
  return {
    ok: false,
    errors,
    summary: {
      archiveObjectCount: 0,
      archiver: '',
      version: 0,
      topRootUid: null,
      classNames: [],
      songCount: 0,
      setItemCount: 0
    }
  };
}

function visitUids(value: unknown, visitor: (uid: number, path: string) => void, path = '', visited = new Set<unknown>()) {
  if (!value || typeof value !== 'object' || visited.has(value)) return;
  visited.add(value);
  if (isUid(value)) {
    visitor(value.$uid, path);
    return;
  }
  if (Array.isArray(value)) {
    value.forEach((item, index) => visitUids(item, visitor, `${path}[${index}]`, visited));
    return;
  }
  Object.entries(value).forEach(([key, child]) => visitUids(child, visitor, `${path}.${key}`, visited));
}

function isClassNamed(objects: BinaryPlistValue[], classUid: unknown, name: string) {
  if (!isUid(classUid)) return false;
  const classObject = objects[classUid.$uid];
  return isArchiveDictionary(classObject) && dictionaryValue(classObject, '$classname') === name;
}

function isUid(value: unknown): value is BinaryPlistUid {
  return isPlainObject(value) && typeof value.$uid === 'number';
}

function isPlainObject(value: unknown): value is ArchiveDictionary {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value) && !(value instanceof Date) && !(value instanceof Uint8Array);
}

function isArchiveDictionary(value: unknown): value is ArchiveDictionary {
  return isPlainObject(value) && !isUid(value);
}

function dictionaryValue(object: ArchiveDictionary, key: string) {
  return object[key];
}
