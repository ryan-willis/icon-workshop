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

// export function debounce<T>(delay: number, fn: (...args: T[]) => void) {
//   let timeout: NodeJS.Timeout | null;

//   return (...args: T[]) => {
//     if (timeout) {
//       clearTimeout(timeout);
//     }
//     timeout = setTimeout(() => {
//       fn(...args);
//       timeout = null;
//     }, delay);
//   };
// }
