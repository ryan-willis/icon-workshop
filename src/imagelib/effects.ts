/*
 Copyright 2021 Google LLC

 Licensed under the Apache License, Version 2.0 (the "License");
 you may not use this file except in compliance with the License.
 You may obtain a copy of the License at

      https://www.apache.org/licenses/LICENSE-2.0

 Unless required by applicable law or agreed to in writing, software
 distributed under the License is distributed on an "AS IS" BASIS,
 WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 See the License for the specific language governing permissions and
 limitations under the License.
 */

import tinycolor from "tinycolor2";
import { makeContext } from "./drawing";
import { Effect, Size } from "./types";

const OUTER_EFFECTS = new Set(["outer-shadow", "cast-shadow"]);
const INNER_EFFECTS = new Set(["inner-shadow", "score"]);
const FILL_EFFECTS = new Set([
  "fill-color",
  "fill-lineargradient",
  "fill-radialgradient",
]);

const SUPPORTS_CANVAS_FILTERS = (() =>
  document.createElement("canvas").getContext("2d")!.filter === "none")();

export function fx(
  effects: Effect[],
  dstCtx: CanvasRenderingContext2D,
  src: CanvasImageSource | CanvasRenderingContext2D,
  size: Size
) {
  effects = effects || [];

  let outerEffects = effects.filter((e) => !!e && OUTER_EFFECTS.has(e.effect));
  let innerEffects = effects.filter((e) => !!e && INNER_EFFECTS.has(e.effect));
  let fillEffects = effects.filter((e) => !!e && FILL_EFFECTS.has(e.effect));

  let tmpCtx: CanvasRenderingContext2D, bufferCtx: CanvasRenderingContext2D;

  // First render outer effects
  let padLeft: number, padRight: number, padBottom: number, padTop: number;
  padLeft =
    padRight =
    padBottom =
    padTop =
      outerEffects.reduce(
        (r, e) => Math.max(r, "blur" in e ? e.blur || 0 : 0),
        0
      );

  let paddedSize = {
    w: size.w + padLeft + padRight,
    h: size.h + padTop + padBottom,
  };

  tmpCtx = makeContext(paddedSize);

  outerEffects.forEach((effect) => {
    switch (effect.effect) {
      case "cast-shadow":
        tmpCtx.clearRect(0, 0, paddedSize.w, paddedSize.h);
        tmpCtx.drawImage("canvas" in src ? src.canvas : src, padLeft, padTop);
        renderCastShadow_(tmpCtx, paddedSize.w, paddedSize.h);
        dstCtx.drawImage(
          tmpCtx.canvas,
          padLeft,
          padTop,
          size.w,
          size.h,
          0,
          0,
          size.w,
          size.h
        );
        break;

      case "outer-shadow":
        let tColor = tinycolor(effect.color || "#000");
        let alpha = tColor.getAlpha();
        tColor.setAlpha(1);

        if (SUPPORTS_CANVAS_FILTERS) {
          tmpCtx.save();
          tmpCtx.clearRect(0, 0, paddedSize.w, paddedSize.h);
          tmpCtx.filter = `blur(${effect.blur || 0}px)`;
          tmpCtx.drawImage("canvas" in src ? src.canvas : src, padLeft, padTop);
          tmpCtx.globalCompositeOperation = "source-atop";
          tmpCtx.fillStyle = tColor.toRgbString();
          tmpCtx.fillRect(0, 0, paddedSize.w, paddedSize.h);
          tmpCtx.restore();

          dstCtx.save();
          dstCtx.translate(effect.translateX || 0, effect.translateY || 0);
          dstCtx.globalAlpha = alpha;
          dstCtx.drawImage(
            tmpCtx.canvas,
            padLeft,
            padTop,
            size.w,
            size.h,
            0,
            0,
            size.w,
            size.h
          );
          dstCtx.restore();
        } else {
          dstCtx.save();
          dstCtx.globalAlpha = alpha;
          dstCtx.shadowOffsetX = paddedSize.w;
          dstCtx.shadowOffsetY = 0;
          dstCtx.shadowColor = tColor.toRgbString();
          dstCtx.shadowBlur = canvasShadowBlurForRadius_(effect.blur || 0);
          dstCtx.drawImage(
            "canvas" in src ? src.canvas : src,
            (effect.translateX || 0) - paddedSize.w,
            effect.translateY || 0
          );
          dstCtx.restore();
        }
        break;

      default:
        throw new Error("Unexpected");
    }
  });

  // Next, render the source, fill effects (first one), and inner effects
  // in a buffer (bufferCtx)
  bufferCtx = makeContext(size);
  tmpCtx = makeContext(size);
  tmpCtx.drawImage("canvas" in src ? src.canvas : src, 0, 0);
  tmpCtx.globalCompositeOperation = "source-atop";

  // Fill effects
  let fillOpacity = 1.0;
  fillEffects.forEach((effect) => {
    fillOpacity = "opacity" in effect ? effect.opacity || 1 : 1;

    tmpCtx.save();

    switch (effect.effect) {
      case "fill-color": {
        tmpCtx.fillStyle = effect.color;
        break;
      }

      case "fill-lineargradient": {
        let gradient = tmpCtx.createLinearGradient(
          effect.fromX,
          effect.fromY,
          effect.toX,
          effect.toY
        );
        (effect.colors || []).forEach(({ offset, color }) =>
          gradient.addColorStop(offset, color)
        );
        tmpCtx.fillStyle = gradient;
        break;
      }

      case "fill-radialgradient": {
        let gradient = tmpCtx.createRadialGradient(
          effect.centerX,
          effect.centerY,
          0,
          effect.centerX,
          effect.centerY,
          effect.radius
        );
        (effect.colors || []).forEach(({ offset, color }) =>
          gradient.addColorStop(offset, color)
        );
        tmpCtx.fillStyle = gradient;
        break;
      }

      default:
        throw new Error("Unexpected");
    }

    tmpCtx.fillRect(0, 0, size.w, size.h);
    tmpCtx.restore();
  });

  bufferCtx.save();
  bufferCtx.globalAlpha = fillOpacity;
  bufferCtx.drawImage(tmpCtx.canvas, 0, 0);
  bufferCtx.restore();

  // Render inner effects
  padLeft = padTop = padRight = padBottom = 0;
  innerEffects.forEach((effect) => {
    let blur = "blur" in effect ? effect.blur || 0 : 0;
    let translateX = "translateX" in effect ? effect.translateX || 0 : 0;
    let translateY = "translateY" in effect ? effect.translateY || 0 : 0;
    padLeft = Math.max(padLeft, blur + Math.max(0, translateX));
    padTop = Math.max(padTop, blur + Math.max(0, translateY));
    padRight = Math.max(padRight, blur + Math.max(0, -translateX));
    padBottom = Math.max(padBottom, blur + Math.max(0, -translateY));
  });

  paddedSize = {
    w: size.w + padLeft + padRight,
    h: size.h + padTop + padBottom,
  };

  tmpCtx = makeContext(paddedSize);

  innerEffects.forEach((effect) => {
    switch (effect.effect) {
      case "inner-shadow":
        tmpCtx.save();
        tmpCtx.clearRect(0, 0, paddedSize.w, paddedSize.h);
        if (SUPPORTS_CANVAS_FILTERS) {
          tmpCtx.filter = `blur(${effect.blur || 0}px)`;
          tmpCtx.drawImage(
            bufferCtx.canvas,
            padLeft + (effect.translateX || 0),
            padTop + (effect.translateY || 0)
          );
        } else {
          tmpCtx.shadowOffsetX = paddedSize.w;
          tmpCtx.shadowOffsetY = 0;
          tmpCtx.shadowColor = "#000"; // color doesn't matter
          tmpCtx.shadowBlur = canvasShadowBlurForRadius_(effect.blur || 0);
          tmpCtx.drawImage(
            bufferCtx.canvas,
            padLeft + (effect.translateX || 0) - paddedSize.w,
            padTop + (effect.translateY || 0)
          );
        }
        tmpCtx.globalCompositeOperation = "source-out";
        tmpCtx.fillStyle = effect.color;
        tmpCtx.fillRect(0, 0, paddedSize.w, paddedSize.h);
        tmpCtx.restore();

        bufferCtx.save();
        bufferCtx.globalCompositeOperation = "source-atop";
        bufferCtx.drawImage(tmpCtx.canvas, -padLeft, -padTop);
        bufferCtx.restore();
        break;
      default:
        throw new Error("Unexpected");
    }
  });

  // Draw buffer (source, fill, inner effects) on top of outer effects
  dstCtx.drawImage(bufferCtx.canvas, 0, 0);
}

function renderCastShadow_(
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number
) {
  let tmpCtx = makeContext({ w, h });
  // render the cast shadow
  for (let o = 1; o < Math.max(w, h); o++) {
    tmpCtx.drawImage(ctx.canvas, o, o);
  }
  tmpCtx.globalCompositeOperation = "source-in";
  tmpCtx.fillStyle = "#000";
  tmpCtx.fillRect(0, 0, w, h);
  let gradient = tmpCtx.createLinearGradient(0, 0, w, h);
  gradient.addColorStop(0, "rgba(0, 0, 0, .2)");
  gradient.addColorStop(1, "rgba(0, 0, 0, 0)");
  tmpCtx.fillStyle = gradient;
  tmpCtx.fillRect(0, 0, w, h);
  ctx.clearRect(0, 0, w, h);
  ctx.drawImage(tmpCtx.canvas, 0, 0);
}

// determined empirically: http://codepen.io/anon/pen/ggLOqJ
const BLUR_MULTIPLIER =
  [
    { re: /chrome/i, mult: 2.7 },
    { re: /safari/i, mult: 1.8 },
    { re: /firefox/i, mult: 1.7 },
  ].find(({ re }) => re.test(navigator.userAgent))?.mult || 1.7;

function canvasShadowBlurForRadius_(radius: number) {
  return radius * BLUR_MULTIPLIER;
}
