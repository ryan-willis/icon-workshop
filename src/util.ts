import JSZip from "jszip";
import { Artifact } from "./imagelib/types";

export function sanitizeResourceName(s: string) {
  return s
    .toLowerCase()
    .replace(/[\s-.]/g, "_")
    .replace(/[^\w_]/g, "");
}

export function downloadFile(content: Blob | BlobPart, filename: string) {
  let anchor = document.createElement("a");
  anchor.style.display = "none";
  document.body.appendChild(anchor);
  let blob = content;
  if (!(content instanceof Blob)) {
    blob = new Blob([content], { type: "application/octet-stream" });
  }
  let url = window.URL.createObjectURL(blob as Blob);
  anchor.setAttribute("href", url);
  anchor.setAttribute("download", filename);
  anchor.click();
  setTimeout(() => {
    document.body.removeChild(anchor);
    window.URL.revokeObjectURL(url);
  }, 5000);
}

export async function generateZip(artifacts: Artifact[]): Promise<Blob> {
  let zip = new JSZip();
  for (let { filename, content } of artifacts) {
    zip.file(filename, content);
  }

  return await zip.generateAsync({ type: "blob" });
}

export function debounce(delay: number, fn: Function) {
  let timeout: NodeJS.Timeout | null;

  return (...args: any[]) => {
    if (timeout) {
      clearTimeout(timeout);
    }
    timeout = setTimeout(() => {
      fn(...args);
      timeout = null;
    }, delay);
  };
}
