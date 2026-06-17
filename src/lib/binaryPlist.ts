export type BinaryPlistValue =
  | null
  | boolean
  | number
  | string
  | Date
  | Uint8Array
  | BinaryPlistUid
  | BinaryPlistValue[]
  | { [key: string]: BinaryPlistValue };

export type BinaryPlistUid = {
  $uid: number;
};

export function parseBinaryPlist(buffer: ArrayBuffer): BinaryPlistValue {
  const data = new Uint8Array(buffer);
  if (readAscii(data, 0, 8) !== 'bplist00') throw new Error('Not a binary plist.');
  if (data.length < 40) throw new Error('Invalid binary plist.');

  const trailer = data.length - 32;
  const offsetIntSize = data[trailer + 6];
  const objectRefSize = data[trailer + 7];
  const objectCount = readUInt(data, trailer + 8, 8);
  const topObject = readUInt(data, trailer + 16, 8);
  const offsetTableOffset = readUInt(data, trailer + 24, 8);
  const offsets: number[] = [];

  for (let index = 0; index < objectCount; index += 1) {
    offsets.push(readUInt(data, offsetTableOffset + index * offsetIntSize, offsetIntSize));
  }

  const parseObject = (objectIndex: number): BinaryPlistValue => {
    const offset = offsets[objectIndex];
    const marker = data[offset];
    const type = marker >> 4;
    const info = marker & 0x0f;

    if (type === 0x0) {
      if (info === 0x0) return null;
      if (info === 0x8) return false;
      if (info === 0x9) return true;
      throw new Error(`Unsupported simple plist object 0x${marker.toString(16)}.`);
    }

    if (type === 0x1) {
      const length = 2 ** info;
      return readUInt(data, offset + 1, length);
    }

    if (type === 0x2) {
      const length = 2 ** info;
      if (length === 4) return readFloat32(data, offset + 1);
      if (length === 8) return readFloat64(data, offset + 1);
      throw new Error('Unsupported real size.');
    }

    if (type === 0x3) {
      const seconds = readFloat64(data, offset + 1);
      return new Date(Date.UTC(2001, 0, 1) + seconds * 1000);
    }

    if (type === 0x4) {
      const { length, start } = readLength(data, offset, info, parseObject);
      return data.slice(start, start + length);
    }

    if (type === 0x5) {
      const { length, start } = readLength(data, offset, info, parseObject);
      return readAscii(data, start, length);
    }

    if (type === 0x6) {
      const { length, start } = readLength(data, offset, info, parseObject);
      let value = '';
      for (let cursor = 0; cursor < length; cursor += 1) {
        value += String.fromCharCode(readUInt(data, start + cursor * 2, 2));
      }
      return value;
    }

    if (type === 0x8) return { $uid: readUInt(data, offset + 1, info + 1) };

    if (type === 0xa) {
      const { length, start } = readLength(data, offset, info, parseObject);
      const values: BinaryPlistValue[] = [];
      for (let index = 0; index < length; index += 1) {
        values.push(parseObject(readUInt(data, start + index * objectRefSize, objectRefSize)));
      }
      return values;
    }

    if (type === 0xd) {
      const { length, start } = readLength(data, offset, info, parseObject);
      const keyStart = start;
      const valueStart = start + length * objectRefSize;
      const object: Record<string, BinaryPlistValue> = {};
      for (let index = 0; index < length; index += 1) {
        const key = parseObject(readUInt(data, keyStart + index * objectRefSize, objectRefSize));
        const value = parseObject(readUInt(data, valueStart + index * objectRefSize, objectRefSize));
        object[String(key)] = value;
      }
      return object;
    }

    throw new Error(`Unsupported binary plist object type 0x${type.toString(16)}.`);
  };

  return parseObject(topObject);
}

function readLength(
  data: Uint8Array,
  offset: number,
  info: number,
  parseObject: (index: number) => BinaryPlistValue
) {
  if (info < 0x0f) return { length: info, start: offset + 1 };
  const marker = data[offset + 1];
  if ((marker >> 4) !== 0x1) throw new Error('Invalid binary plist length object.');
  const intSize = 2 ** (marker & 0x0f);
  return {
    length: Number(parseObjectFromInlineInteger(data, offset + 2, intSize)),
    start: offset + 2 + intSize
  };
}

function parseObjectFromInlineInteger(data: Uint8Array, offset: number, length: number) {
  return readUInt(data, offset, length);
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

function readFloat32(data: Uint8Array, offset: number) {
  return new DataView(data.buffer, data.byteOffset + offset, 4).getFloat32(0, false);
}

function readFloat64(data: Uint8Array, offset: number) {
  return new DataView(data.buffer, data.byteOffset + offset, 8).getFloat64(0, false);
}
