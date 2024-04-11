/*
 * Copyright 2016 Google Inc.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import { fx } from "./effects";
import { Layer, LayerGroup, Rect, Size } from "./types";

export function makeContext({ w, h }: Size): CanvasRenderingContext2D {
  let canvas = document.createElement("canvas");
  canvas.width = w;
  canvas.height = h;
  canvas.style.setProperty("image-rendering", "optimizeQuality");
  return canvas.getContext("2d")!;
}

export function drawCenterInside(
  dstCtx: CanvasRenderingContext2D,
  src: any,
  dstRect: Rect,
  srcRect: Rect
) {
  if (srcRect.w / srcRect.h > dstRect.w / dstRect.h) {
    var h = (srcRect.h * dstRect.w) / srcRect.w;
    drawImageScaled(
      dstCtx,
      src,
      srcRect.x,
      srcRect.y,
      srcRect.w,
      srcRect.h,
      dstRect.x,
      dstRect.y + (dstRect.h - h) / 2,
      dstRect.w,
      h
    );
  } else {
    var w = (srcRect.w * dstRect.h) / srcRect.h;
    drawImageScaled(
      dstCtx,
      src,
      srcRect.x,
      srcRect.y,
      srcRect.w,
      srcRect.h,
      dstRect.x + (dstRect.w - w) / 2,
      dstRect.y,
      w,
      dstRect.h
    );
  }
}

export function drawCenterCrop(
  dstCtx: CanvasRenderingContext2D,
  src: any,
  dstRect: Rect,
  srcRect: Rect
) {
  if (srcRect.w / srcRect.h > dstRect.w / dstRect.h) {
    var w = (srcRect.h * dstRect.w) / dstRect.h;
    drawImageScaled(
      dstCtx,
      src,
      srcRect.x + (srcRect.w - w) / 2,
      srcRect.y,
      w,
      srcRect.h,
      dstRect.x,
      dstRect.y,
      dstRect.w,
      dstRect.h
    );
  } else {
    var h = (srcRect.w * dstRect.h) / dstRect.w;
    drawImageScaled(
      dstCtx,
      src,
      srcRect.x,
      srcRect.y + (srcRect.h - h) / 2,
      srcRect.w,
      h,
      dstRect.x,
      dstRect.y,
      dstRect.w,
      dstRect.h
    );
  }
}

export function drawImageScaled(
  dstCtx: CanvasRenderingContext2D,
  src: any,
  sx: number,
  sy: number,
  sw: number,
  sh: number,
  dx: number,
  dy: number,
  dw: number,
  dh: number
) {
  if (dw <= 0 || dh <= 0 || sw <= 0 || sh <= 0) {
    console.error("Width/height must be at least 0");
    return;
  }

  src = src.canvas || src;

  // algorithm: when scaling down, downsample by at most a factor of 2 per iteration
  // to avoid poor browser downsampling
  while (dw < sw / 2 || dh < sh / 2) {
    let tmpDw = Math.ceil(Math.max(dw, sw / 2));
    let tmpDh = Math.ceil(Math.max(dh, sh / 2));
    let tmpCtx = makeContext({ w: tmpDw, h: tmpDh });

    tmpCtx.clearRect(0, 0, tmpDw, tmpDh);
    tmpCtx.drawImage(src, sx, sy, sw, sh, 0, 0, tmpDw, tmpDh);

    src = tmpCtx.canvas;
    sx = sy = 0;
    sw = tmpDw;
    sh = tmpDh;
  }

  dstCtx.drawImage(src, sx, sy, sw, sh, dx, dy, dw, dh);
}

export function drawLayers(
  dstCtx: CanvasRenderingContext2D,
  size: Size,
  layerTree: LayerGroup
) {
  drawLayer_(dstCtx, layerTree);

  function drawLayer_(
    dstCtx: CanvasRenderingContext2D,
    layer: Layer | LayerGroup
  ) {
    let layerCtx = makeContext(size);

    if ("children" in layer) {
      drawGroup_(layerCtx, layer);
    } else if (layer.draw) {
      layer.draw(layerCtx);
    }

    if (layer.effects) {
      // apply effects in a new buffer
      let effectsCtx = makeContext(size);
      fx(layer.effects, effectsCtx, layerCtx, size);
      layerCtx = effectsCtx;
    }

    dstCtx.save();
    if ("opacity" in layer) {
      dstCtx.globalAlpha = layer.opacity!;
    }
    dstCtx.drawImage(layerCtx.canvas, 0, 0);
    dstCtx.restore();
  }

  function drawGroup_(dstCtx: CanvasRenderingContext2D, group: LayerGroup) {
    let dstCtxStack = [dstCtx];

    for (let layer of group.children.filter((layer) => !!layer) as Layer[]) {
      drawLayer_(dstCtxStack[dstCtxStack.length - 1], layer);
      if ("mask" in layer && layer.mask) {
        // draw future layers into a separate buffer (later gets masked)
        let maskedContentCtx = makeContext(size);
        dstCtxStack.push(maskedContentCtx);
      }
    }

    while (dstCtxStack.length > 1) {
      let targetCtx = dstCtxStack[dstCtxStack.length - 2];
      let contentCtx = dstCtxStack[dstCtxStack.length - 1];
      targetCtx.save();
      targetCtx.globalCompositeOperation = "source-atop";
      targetCtx.drawImage(contentCtx.canvas, 0, 0);
      targetCtx.restore();
      dstCtxStack.pop();
    }
  }
}
