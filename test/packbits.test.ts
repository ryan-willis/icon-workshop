import { expect, test } from "vitest";
import { encode } from "@fiahfy/packbits";
import { packBits } from "../src/util";

// https://en.wikipedia.org/wiki/Apple_Icon_Image_format#Compression
const unpacked = new Uint8ClampedArray([
  0x01, 0x02, 0x02, 0x03, 0x03, 0x03, 0x04, 0x04, 0x04, 0x04, 0x05, 0x05, 0x05,
  0x05, 0x05,
]);
const packed = new Uint8ClampedArray([
  0x02, 0x01, 0x02, 0x02, 0x80, 0x03, 0x81, 0x04, 0x82, 0x05,
]);

test("@fiahfy/packbits matches the wikipedia entry", () => {
  const buf1 = encode(Buffer.from(unpacked), { format: "icns" });
  const buf2 = Buffer.from(packed);
  expect(buf1).toEqual(buf2);
});

test("my version matches the wikipedia entry", () => {
  const buf1 = packBits(unpacked);
  const buf2 = new Uint8ClampedArray(packed);
  expect(buf1).toEqual(buf2);
});
