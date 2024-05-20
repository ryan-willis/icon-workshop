// PORT of https://github.com/fiahfy/icns/
// MIT License https://github.com/fiahfy/icns/blob/master/LICENSE

import { flattenArray, packBits } from "../util";

const HEADER_SIZE = 8;

export const OS_TYPES = {
  16: ["is32"],
  32: ["il32", "ic11"],
  48: ["ih32"],
  64: ["ic12"],
  128: ["it32", "ic07"],
  256: ["ic08", "ic13"],
  512: ["ic09", "ic14"],
  1024: ["ic10"],
};

function getMaskforOSType(osType: string) {
  switch (osType) {
    case "is32":
      return "s8mk";
    case "il32":
      return "l8mk";
    case "ih32":
      return "h8mk";
    case "it32":
      return "t8mk";
    default:
      return "    ";
  }
}

export function makeIcns(canvases: HTMLCanvasElement[]) {
  const images: Uint8ClampedArray[] = [];
  for (const canvas of canvases) {
    const w = canvas.width as keyof typeof OS_TYPES;
    const dataUrl = canvas.toDataURL("image/png");
    const pngData = window.atob(dataUrl.replace(/^(.*?);base64,/, ""));

    const imageData = canvas
      .getContext("2d")!
      .getImageData(0, 0, w, canvas.height);

    for (const osType of OS_TYPES[w] || []) {
      if (["is32", "il32", "ih32", "it32"].includes(osType)) {
        images.push(...createRGBBufferPair(osType, imageData));
      } else {
        images.push(createPNGBuffer(osType, pngData));
      }
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

function createRGBBufferPair(osType: string, imageBytes: ImageData) {
  // see https://en.wikipedia.org/wiki/Apple_Icon_Image_format#Compression
  const headerSize = HEADER_SIZE + (osType === "it32" ? 4 : 0);
  const channelSize = imageBytes.data.length / 4;
  const [red, green, blue, alpha] = [
    bufferAlloc(channelSize),
    bufferAlloc(channelSize),
    bufferAlloc(channelSize),
    bufferAlloc(channelSize),
  ];
  for (let i = 0; i < imageBytes.data.length; i += 4) {
    red[i / 4] = imageBytes.data[i];
    green[i / 4] = imageBytes.data[i + 1];
    blue[i / 4] = imageBytes.data[i + 2];
    alpha[i / 4] = imageBytes.data[i + 3];
  }
  const packedImageChannels = [red, green, blue].map(packBits);
  const packedData = flattenArray(packedImageChannels);
  const rgbSize = packedData.length + headerSize;
  const rgb = bufferAlloc(rgbSize);
  writeAscii(rgb, 0, osType);
  writeUInt32BE(rgb, 4, rgbSize);
  writeAscii(rgb, headerSize, "RGB ");
  rgb.set(packedData, headerSize);

  const maskSize = HEADER_SIZE + channelSize;
  const mask = bufferAlloc(maskSize);
  writeAscii(mask, 0, getMaskforOSType(osType));
  writeUInt32BE(mask, 4, maskSize);
  mask.set(alpha, HEADER_SIZE);
  return [rgb, mask];
}

function createPNGBuffer(osType: string, imageBytes: string) {
  const totalSize = imageBytes.length + HEADER_SIZE;
  const buf = bufferAlloc(totalSize);
  writeAscii(buf, 0, osType);
  writeUInt32BE(buf, 4, totalSize);
  for (let i = 0; i < imageBytes.length; i++) {
    buf[8 + i] = imageBytes.charCodeAt(i);
  }
  return buf;
}

function mergedArrays(arrs: Uint8ClampedArray[]) {
  const totalSize = arrs.reduce((s, a) => s + a.length, 0);
  const buf = bufferAlloc(totalSize);
  let pos = 0;
  for (let i = 0; i < arrs.length; i++) {
    const arr = arrs[i];
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
