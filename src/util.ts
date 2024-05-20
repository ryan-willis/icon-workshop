import JSZip from "jszip";
import { Artifact } from "./imagelib/types";

export function sanitizeResourceName(s: string) {
  return s
    .toLowerCase()
    .replace(/[\s-.]/g, "_")
    .replace(/[^\w_]/g, "");
}

export function downloadFile(content: Blob | BlobPart, filename: string) {
  const anchor = document.createElement("a");
  anchor.style.display = "none";
  document.body.appendChild(anchor);
  let blob = content;
  if (!(content instanceof Blob)) {
    blob = new Blob([content], { type: "application/octet-stream" });
  }
  const url = window.URL.createObjectURL(blob as Blob);
  anchor.setAttribute("href", url);
  anchor.setAttribute("download", filename);
  anchor.click();
  setTimeout(() => {
    document.body.removeChild(anchor);
    window.URL.revokeObjectURL(url);
  }, 5000);
}

export async function generateZip(artifacts: Artifact[]): Promise<Blob> {
  const zip = new JSZip();
  for (const { filename, content } of artifacts) {
    zip.file(filename, content);
  }

  return await zip.generateAsync({ type: "blob" });
}

export function packBits(data: Uint8ClampedArray): Uint8ClampedArray {
  const packed: Uint8ClampedArray[] = [];

  let i = 0;
  while (i < data.length) {
    const byte = data[i];
    // if last 1 or 2 bytes remaining
    if (i + 2 >= data.length) {
      const length = data.length - i;
      const arr = new Uint8ClampedArray([length - 1]);
      packed.push(arr);
      packed.push(data.slice(i, data.length));
      break;
    }

    const repeat = byte === data[i + 1] && byte === data[i + 2];
    if (repeat) {
      let j = i + 2;
      let length = 3;
      while (++j < data.length && byte === data[j] && length < 130) {
        length++;
      }
      const arr = new Uint8ClampedArray([length + 125, byte]);
      packed.push(arr);
      i = j;
    } else {
      let j = i + 2;
      let length = 3;
      let prev = data[j];
      let repeatLength = 1;
      while (++j < data.length && length < 128) {
        if (prev === data[j]) {
          if (++repeatLength > 2) {
            break;
          }
        } else {
          prev = data[j];
          repeatLength = 1;
        }
        length++;
      }
      if (repeatLength > 2) {
        j -= 2;
        length -= 2;
      }
      const arr = new Uint8ClampedArray([length - 1]);
      packed.push(arr);
      packed.push(data.slice(i, j));
      i = j;
    }
  }

  return Uint8ClampedArray.from(flattenArray(packed));
}

export function flattenArray(arr: any) {
  return arr.reduce((a: any[], b: any[]) => [...a, ...b], []);
}
