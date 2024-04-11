// PORT of https://github.com/fiahfy/icns/
// MIT License https://github.com/fiahfy/icns/blob/master/LICENSE

const HEADER_SIZE = 8;

export const OS_TYPES = {
  16: ["icp4"],
  32: ["icp5", "ic11"],
  64: ["icp6", "ic12"],
  128: ["ic07"],
  256: ["ic08", "ic13"],
  512: ["ic09", "ic14"],
  1024: ["ic10"],
};

export function makeIcns(canvases: HTMLCanvasElement[]) {
  let images: Uint8ClampedArray[] = [];
  for (let canvas of canvases) {
    let w = canvas.width as keyof typeof OS_TYPES;
    let dataUrl = canvas.toDataURL();
    let data = window.atob(dataUrl.replace(/^(.*?);base64,/, ""));

    for (let osType of OS_TYPES[w] || []) {
      images.push(createPNGBuffer(osType, data));
    }
  }

  const totalSize =
    HEADER_SIZE + images.reduce((n, image) => n + image.length, 0);

  const header = createHeader(totalSize);
  const bufs = [header, ...images];

  return new Blob([mergedArrays(bufs)], { type: "image/icns" });
}

function createHeader(totalSize: number) {
  const buf = bufferAlloc(HEADER_SIZE);
  writeAscii(buf, 0, "icns");
  writeUInt32BE(buf, 4, totalSize);
  return buf;
}

function createPNGBuffer(osType: string, imageBytes: string) {
  let totalSize = imageBytes.length + 8;
  const buf = bufferAlloc(totalSize);
  writeAscii(buf, 0, osType);
  writeUInt32BE(buf, 4, totalSize);
  for (let i = 0; i < imageBytes.length; i++) {
    buf[8 + i] = imageBytes.charCodeAt(i);
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

function writeUInt32BE(arr: Uint8ClampedArray, offset: number, n: number) {
  writeUIntBE(arr, offset, n, 4);
}

function writeUIntBE(
  arr: Uint8ClampedArray,
  offset: number,
  n: number,
  size: number
) {
  for (let i = 0; i < size; i++) {
    arr[offset + (size - 1 - i)] = (n >> (i * 8)) & 0xff;
  }
}

function writeAscii(arr: Uint8ClampedArray, offset: number, str: string) {
  for (let i = 0; i < str.length; i++) {
    arr[offset + i] = str.charCodeAt(i);
  }
}
