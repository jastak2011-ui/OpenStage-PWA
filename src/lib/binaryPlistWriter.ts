import type { BinaryPlistValue } from './binaryPlist';

export type BinaryPlistWritableValue = BinaryPlistValue;

export function writeBinaryPlist(root: BinaryPlistWritableValue): Uint8Array {
  const objectValues: BinaryPlistWritableValue[] = [];
  const objectRefs = new Map<object, number>();
  const primitiveRefs = new Map<string, number>();

  const collect = (value: BinaryPlistWritableValue): number => {
    if (isReferenceObject(value)) {
      const cached = objectRefs.get(value);
      if (cached !== undefined) return cached;
    } else {
      const key = primitiveKey(value);
      const cached = primitiveRefs.get(key);
      if (cached !== undefined) return cached;
    }

    const index = objectValues.length;
    objectValues.push(value);
    if (isReferenceObject(value)) {
      objectRefs.set(value, index);
    } else {
      primitiveRefs.set(primitiveKey(value), index);
    }

    if (Array.isArray(value)) value.forEach((item) => collect(item));
    else if (isPlainObject(value) && !isUid(value)) {
      Object.entries(value).forEach(([key, child]) => {
        collect(key);
        collect(child);
      });
    }

    return index;
  };

  collect(root);
  const objectRefSize = byteSizeFor(Math.max(0, objectValues.length - 1));

  const encode = (value: BinaryPlistWritableValue): Uint8Array => {
    if (value === null) return bytes(0x00);
    if (value === false) return bytes(0x08);
    if (value === true) return bytes(0x09);
    if (typeof value === 'number') {
      if (Number.isInteger(value) && value >= 0 && value <= Number.MAX_SAFE_INTEGER) return encodeInteger(value);
      return concat([bytes(0x23), encodeFloat64(value)]);
    }
    if (typeof value === 'string') return encodeString(value);
    if (value instanceof Date) return concat([bytes(0x33), encodeFloat64((value.getTime() - Date.UTC(2001, 0, 1)) / 1000)]);
    if (value instanceof Uint8Array) return concat([encodeLength(0x40, value.length), value]);
    if (isUid(value)) return concat([bytes(0x80 + byteSizeFor(value.$uid) - 1), encodeUInt(value.$uid, byteSizeFor(value.$uid))]);
    if (Array.isArray(value)) {
      return concat([
        encodeLength(0xa0, value.length),
        ...value.map((item) => encodeUInt(refFor(item), objectRefSize))
      ]);
    }
    if (isPlainObject(value)) {
      const entries = Object.entries(value);
      return concat([
        encodeLength(0xd0, entries.length),
        ...entries.map(([key]) => encodeUInt(refFor(key), objectRefSize)),
        ...entries.map(([, child]) => encodeUInt(refFor(child), objectRefSize))
      ]);
    }
    return bytes(0x00);
  };

  const refFor = (value: BinaryPlistWritableValue) => {
    if (isReferenceObject(value)) return objectRefs.get(value) ?? collect(value);
    return primitiveRefs.get(primitiveKey(value)) ?? collect(value);
  };

  const flattenedObjects = objectValues.map((value) => encode(value));

  const header = ascii('bplist00');
  const offsets: number[] = [];
  let cursor = header.length;
  flattenedObjects.forEach((object) => {
    offsets.push(cursor);
    cursor += object.length;
  });

  const offsetIntSize = byteSizeFor(cursor);
  const offsetTableOffset = cursor;
  const offsetTable = concat(offsets.map((offset) => encodeUInt(offset, offsetIntSize)));
  const trailer = new Uint8Array(32);
  trailer[6] = offsetIntSize;
  trailer[7] = objectRefSize;
  writeUInt(trailer, 8, objectValues.length, 8);
  writeUInt(trailer, 16, 0, 8);
  writeUInt(trailer, 24, offsetTableOffset, 8);

  return concat([header, ...flattenedObjects, offsetTable, trailer]);
}

function encodeLength(markerBase: number, length: number) {
  if (length < 15) return bytes(markerBase + length);
  const integer = encodeInteger(length);
  return concat([bytes(markerBase + 0x0f), integer]);
}

function encodeInteger(value: number) {
  const size = byteSizeFor(value);
  return concat([bytes(0x10 + Math.log2(size)), encodeUInt(value, size)]);
}

function encodeString(value: string) {
  if (/^[\x00-\x7f]*$/.test(value)) return concat([encodeLength(0x50, value.length), ascii(value)]);
  const data = new Uint8Array(value.length * 2);
  for (let index = 0; index < value.length; index += 1) writeUInt(data, index * 2, value.charCodeAt(index), 2);
  return concat([encodeLength(0x60, value.length), data]);
}

function encodeFloat64(value: number) {
  const data = new Uint8Array(8);
  new DataView(data.buffer).setFloat64(0, value, false);
  return data;
}

function encodeUInt(value: number, size: number) {
  const data = new Uint8Array(size);
  writeUInt(data, 0, value, size);
  return data;
}

function writeUInt(data: Uint8Array, offset: number, value: number, size: number) {
  let remaining = value;
  for (let index = size - 1; index >= 0; index -= 1) {
    data[offset + index] = remaining & 0xff;
    remaining = Math.floor(remaining / 256);
  }
}

function byteSizeFor(value: number) {
  if (value <= 0xff) return 1;
  if (value <= 0xffff) return 2;
  if (value <= 0xffffffff) return 4;
  return 8;
}

function ascii(value: string) {
  const data = new Uint8Array(value.length);
  for (let index = 0; index < value.length; index += 1) data[index] = value.charCodeAt(index);
  return data;
}

function bytes(...values: number[]) {
  return new Uint8Array(values);
}

function concat(chunks: Uint8Array[]) {
  const size = chunks.reduce((sum, chunk) => sum + chunk.length, 0);
  const output = new Uint8Array(size);
  let offset = 0;
  chunks.forEach((chunk) => {
    output.set(chunk, offset);
    offset += chunk.length;
  });
  return output;
}

function isUid(value: unknown): value is { $uid: number } {
  return isPlainObject(value) && typeof value.$uid === 'number';
}

function isPlainObject(value: unknown): value is Record<string, BinaryPlistWritableValue> {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value) && !(value instanceof Date) && !(value instanceof Uint8Array);
}

function isReferenceObject(value: BinaryPlistWritableValue): value is Record<string, BinaryPlistWritableValue> | BinaryPlistWritableValue[] {
  return Boolean(value) && typeof value === 'object' && !(value instanceof Date) && !(value instanceof Uint8Array) && !isUid(value);
}

function primitiveKey(value: BinaryPlistWritableValue) {
  if (value instanceof Date) return `date:${value.getTime()}`;
  if (value instanceof Uint8Array) return `data:${Array.from(value).join(',')}`;
  if (isUid(value)) return `uid:${value.$uid}`;
  return `${typeof value}:${String(value)}`;
}
