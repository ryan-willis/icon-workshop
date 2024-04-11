// PORT of https://github.com/kevva/to-ico
// MIT License (https://github.com/kevva/to-ico/blob/master/license)

const BITMAP_SIZE = 40;
const COLOR_MODE = 0;
const HEADER_SIZE = 6;
const DIRECTORY_SIZE = 16;

export function makeIco(canvases: HTMLCanvasElement[]) {
  const bufs = [createHeader(canvases.length)];

  let offset = HEADER_SIZE + DIRECTORY_SIZE * canvases.length;

  let imageDatas = canvases.map((canvas) => {
    let ctx = canvas.getContext("2d");
    return ctx!.getImageData(0, 0, canvas.width, canvas.width);
  });

  for (const imageData of imageDatas) {
    const dir = createDirectory(imageData, offset);
    bufs.push(dir);
    offset += imageData.data.length + BITMAP_SIZE;
  }

  for (const imageData of imageDatas) {
    const header = createBitmap(imageData, COLOR_MODE);
    const dib = createDib(imageData);
    bufs.push(header, dib);
  }

  return new Blob([mergedArrays(bufs)], { type: "image/x-icon" });
}

function createHeader(n: number) {
  const buf = bufferAlloc(HEADER_SIZE);
  writeUInt16LE(buf, 0, 0);
  writeUInt16LE(buf, 2, 1);
  writeUInt16LE(buf, 4, n);
  return buf;
}

function createDirectory(
  data: ImageData & {
    bpp?: number;
  },
  offset: number
) {
  const buf = bufferAlloc(DIRECTORY_SIZE);
  const size = data.data.length + BITMAP_SIZE;
  const width = data.width === 256 ? 0 : data.width;
  const height = data.height === 256 ? 0 : data.height;
  const bpp = data.bpp! * 8;
  writeUInt8(buf, 0, width);
  writeUInt8(buf, 1, height);
  writeUInt8(buf, 2, 0);
  writeUInt8(buf, 3, 0);
  writeUInt16LE(buf, 4, 1);
  writeUInt16LE(buf, 6, bpp);
  writeUInt32LE(buf, 8, size);
  writeUInt32LE(buf, 12, offset);
  return buf;
}

const writeInt32LE = writeUInt32LE;

function createBitmap(imageData: ImageData, compression: number) {
  const bpp = 4;
  const buf = bufferAlloc(BITMAP_SIZE);
  writeUInt32LE(buf, 0, BITMAP_SIZE);
  writeInt32LE(buf, 4, imageData.width);
  writeInt32LE(buf, 8, imageData.height * 2);
  writeUInt16LE(buf, 12, 1);
  writeUInt16LE(buf, 14, bpp * 8);
  writeUInt32LE(buf, 16, compression);
  writeUInt32LE(buf, 20, imageData.data.length);
  writeInt32LE(buf, 24, 0);
  writeInt32LE(buf, 28, 0);
  writeUInt32LE(buf, 32, 0);
  writeUInt32LE(buf, 36, 0);
  return buf;
}

function createDib(imageData: ImageData) {
  const { data, width, height } = imageData;
  const bpp = 4;
  const cols = width * bpp;
  const rows = height * cols;
  const end = rows - cols;
  const buf = bufferAlloc(data.length);

  for (let row = 0; row < rows; row += cols) {
    for (let col = 0; col < cols; col += bpp) {
      let pos = row + col;
      const r = data[pos];
      const g = data[pos + 1];
      const b = data[pos + 2];
      const a = data[pos + 3];
      pos = end - row + col;
      writeUInt8(buf, pos, b);
      writeUInt8(buf, pos + 1, g);
      writeUInt8(buf, pos + 2, r);
      writeUInt8(buf, pos + 3, a);
    }
  }

  return buf;
}

function mergedArrays(arrs: Uint8ClampedArray[]) {
  let totalSize = arrs.reduce((s, a) => s + a.length, 0);
  let buf = bufferAlloc(totalSize);
  let pos = 0;
  for (let i = 0; i < arrs.length; i++) {
    let arr = arrs[i];
    buf.set(arr, pos);
    pos += arr.length;
  }
  return buf;
}

function bufferAlloc(size: number) {
  return new Uint8ClampedArray(new ArrayBuffer(size));
}

function writeUInt8(arr: Uint8ClampedArray, offset: number, n: number) {
  writeUIntLE(arr, offset, n, 1);
}

function writeUInt16LE(arr: Uint8ClampedArray, offset: number, n: number) {
  writeUIntLE(arr, offset, n, 2);
}

function writeUInt32LE(arr: Uint8ClampedArray, offset: number, n: number) {
  writeUIntLE(arr, offset, n, 4);
}

function writeUIntLE(
  arr: Uint8ClampedArray,
  offset: number,
  n: number,
  size: number
) {
  for (let i = 0; i < size; i++) {
    arr[offset + i] = (n >> (i * 8)) & 0xff;
  }
}
