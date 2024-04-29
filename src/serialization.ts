import { compressSync, decompressSync } from "fflate";
import base64 from "base64-js";

const ENC = new TextEncoder();
const DEC = new TextDecoder();

interface IconDocument {
  values: { [key: string]: Record<string, string | boolean> };
  modules: string[];
}

export function documentToUrl(doc: IconDocument): string {
  doc = JSON.parse(JSON.stringify(doc));

  // TODO: somehow persist the blobs?
  for (const key in doc.values) {
    const val = doc.values[key];
    if (!!val.filterBlobs) {
      for (const subKey in val) {
        const subVal = val[subKey];
        if (String(subVal).startsWith("blob:")) {
          delete doc.values[key];
        }
      }
    }
  }

  return window.encodeURIComponent(
    base64.fromByteArray(
      compressSync(ENC.encode(JSON.stringify(doc)), { mtime: 0 })
    )
  );
}

export function documentFromUrl(url: string): IconDocument {
  return JSON.parse(
    DEC.decode(
      decompressSync(base64.toByteArray(window.decodeURIComponent(url)))
    )
  ) as IconDocument;
}
