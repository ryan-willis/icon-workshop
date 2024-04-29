import { getSvgPath as figmaSquircleSvgPath } from "figma-squircle";
import { Rect, Size } from "./types";

export function loadImageFromUri(uri: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = document.createElement("img");
    img.onload = () => resolve(img);
    img.onerror = () => reject();
    img.src = uri;
  });
}

export function ctxToBlob(ctx: CanvasRenderingContext2D): Promise<Blob> {
  return new Promise((resolve, reject) => {
    ctx.canvas.toBlob((blob) => {
      if (blob) {
        resolve(blob);
      } else {
        reject(new Error("No blob returned"));
      }
    }, "image/png");
  });
}

export function ellipsePath({ x, y, w, h }: Rect): Path2D {
  const p = new Path2D();
  p.ellipse((x + w) / 2, (y + h) / 2, w / 2, h / 2, 0, 0, 2 * Math.PI, false);
  return p;
}

export function rectPath({ x, y, w, h }: Rect): Path2D {
  const p = new Path2D();
  p.rect(x, y, w, h);
  p.closePath();
  return p;
}

export interface CornerRadii {
  tl?: number;
  tr?: number;
  bl?: number;
  br?: number;
}

export function roundRectPath(
  { x, y, w, h }: Rect,
  r: number | CornerRadii
): Path2D {
  const {
    tl = 0,
    tr = 0,
    bl = 0,
    br = 0,
  } = typeof r === "number" ? { tl: r, tr: r, bl: r, br: r } : r;
  const p = new Path2D();
  p.moveTo(x + w - tr, y);
  p.arcTo(x + w, y, x + w, y + tr, tr);
  p.lineTo(x + w, y + h - br);
  p.arcTo(x + w, y + h, x + w - br, y + h, br);
  p.lineTo(x + bl, y + h);
  p.arcTo(x, y + h, x, y + h - bl, bl);
  p.lineTo(x, y + tl);
  p.arcTo(x, y, x + tl, y, tl);
  p.closePath();
  return p;
}

export function simpleSquirclePath({ x, y, w, h }: Rect, smooth = 0.1) {
  const l = x;
  const t = y;
  const r = x + w;
  const b = y + h;
  const p = new Path2D();
  p.moveTo((l + r) / 2, t);
  p.bezierCurveTo(r - smooth * w, t, r, t + smooth * h, r, (t + b) / 2);
  p.bezierCurveTo(r, b - smooth * h, r - smooth * h, b, (l + r) / 2, b);
  p.bezierCurveTo(l + smooth * w, b, l, b - smooth * h, l, (t + b) / 2);
  p.bezierCurveTo(l, t + smooth * h, l + smooth * w, t, (l + r) / 2, t);
  p.closePath();
  return p;
}

export const IOS_RADIUS = 0.242; // 28.6 / 118
export const MACOS_RADIUS = 0.225; // 185 / 824

export function figmaSquirclePath({ w, h }: Size, r: number): Path2D {
  return new Path2D(
    figmaSquircleSvgPath({
      cornerRadius: r * w,
      cornerSmoothing: 0.61,
      width: w,
      height: h,
    })
  );
}
