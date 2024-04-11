import tinycolor from "tinycolor2";
import {
  drawCenterCrop,
  drawCenterInside,
  drawLayers,
  makeContext,
} from "../imagelib/drawing";
import {
  ellipsePath,
  loadImageFromUri,
  rectPath,
  roundRectPath,
  simpleSquirclePath,
} from "../imagelib/imageutil";
import { tryLoadWebFont } from "../property-editor/FontField";
import { drawTexture } from "../textures";
import { ICON_SETS } from "../property-editor/clipart/iconsets";
import {
  Effect,
  FontValue,
  GenerateContext,
  GradientValue,
  Layer,
  Rect,
  RenderConfig,
  Size,
} from "../imagelib/types";

export async function renderAppIcon(
  { values }: GenerateContext,
  {
    layer = "all",
    assetSize,
    contentSize,
    shape,
    finalEffects,
    badgeStyle = "default",
    androidMonochrome,
  }: RenderConfig
): Promise<CanvasRenderingContext2D> {
  // let foreSrcCtx = values.foreground ? values.foreground.ctx : null;
  let foreSrcCtx = await renderForeground({ values }, assetSize);
  let { fgType, fgMask, bgType, bgGradient, bgTexture, fgEffects, fgPadding } =
    values;
  let bgColor = tinycolor(values.bgColor); // TODO: the system should automatically tinycolor() this
  let fgColor = tinycolor(values.fgColor);
  if (androidMonochrome) {
    fgColor = tinycolor("#000");
    fgEffects = null;
  }
  let crop = fgType === "image" && values.fgScaling === "crop";

  contentSize = contentSize || assetSize;
  let targetRect: Rect = {
    x: (assetSize.w - contentSize.w) / 2,
    y: (assetSize.h - contentSize.h) / 2,
    ...contentSize,
  };

  let outCtx = makeContext(assetSize);

  let bgLayerEffects: Effect[] = [];
  if (bgType === "color") {
    bgLayerEffects = [
      {
        effect: "fill-color",
        color: bgColor.toHexString(),
      },
    ];
  } else if (bgType === "gradient") {
    let { color1, color2, angle }: GradientValue = bgGradient!;
    bgColor = tinycolor(color1);
    bgLayerEffects = [
      {
        effect: "fill-lineargradient",
        fromX:
          assetSize.w / 2 -
          (contentSize.w / 2) * Math.cos((angle * Math.PI) / 180),
        fromY:
          assetSize.h / 2 -
          (contentSize.w / 2) * Math.sin((angle * Math.PI) / 180),
        toX:
          assetSize.w / 2 +
          (contentSize.w / 2) * Math.cos((angle * Math.PI) / 180),
        toY:
          assetSize.h / 2 +
          (contentSize.w / 2) * Math.sin((angle * Math.PI) / 180),
        colors: [
          { offset: 0, color: color1 },
          { offset: 1, color: color2 },
        ],
      },
    ];
  }

  let backgroundLayer: Layer = {
    // background layer
    draw: (ctx) => {
      bgColor.setAlpha(1);
      ctx.save();
      if (layer === "background") {
        // just the adaptive android icon background
        ctx.scale(assetSize.w, assetSize.h);
      } else {
        ctx.translate(targetRect.x, targetRect.y);
        ctx.scale(targetRect.w, targetRect.h);
      }
      ctx.fillStyle = "#000";
      let renderShape: Path2D;
      if (shape === "circle") {
        renderShape = ellipsePath({ x: 0, y: 0, w: 1, h: 1 });
      } else if (shape === "squircle") {
        renderShape = simpleSquirclePath({ x: 0, y: 0, w: 1, h: 1 });
      } else if (shape === "square") {
        renderShape = roundRectPath({ x: 0, y: 0, w: 1, h: 1 }, 3 / 48);
      } else if (shape === "square-sharp") {
        renderShape = rectPath({ x: 0, y: 0, w: 1, h: 1 });
      } else if (shape instanceof Path2D) {
        renderShape = shape;
      } else {
        throw new Error("Unknown shape");
      }
      ctx.fill(renderShape);
      ctx.restore();
    },
    mask: layer !== "background",
    effects: bgLayerEffects,
  };

  let foregroundLayer: Layer = {
    // foreground content layer
    draw: (ctx) => {
      if (!foreSrcCtx) {
        return;
      }

      let contentRect = { ...targetRect };
      if (fgPadding) {
        contentRect.y += (fgPadding.top / 100) * targetRect.h;
        contentRect.x += (fgPadding.left / 100) * targetRect.w;
        contentRect.w -=
          ((fgPadding.right + fgPadding.left) / 100) * targetRect.w;
        contentRect.h -=
          ((fgPadding.bottom + fgPadding.top) / 100) * targetRect.h;
      }

      // // adjust content target area for badge
      // // works well for text/clipart, but not full-bleed images
      // if (values.badge) {
      //   let scale = contentSize!.w / 48;
      //   contentRect.h -= 10 * scale;
      // }

      let drawFn_ = crop ? drawCenterCrop : drawCenterInside;
      drawFn_(ctx, foreSrcCtx, contentRect, {
        x: 0,
        y: 0,
        w: foreSrcCtx.canvas.width,
        h: foreSrcCtx.canvas.height,
      });
    },
    effects: [],
  };

  if (fgEffects === "shadow") {
    foregroundLayer.effects!.push({ effect: "cast-shadow" });
  }

  // recolor foreground
  if (!((fgType === "image" && !fgMask) || fgType === "text")) {
    foregroundLayer.effects!.push({
      effect: "fill-color",
      color: fgColor.toRgbString(),
    });
  }

  if (fgEffects === "elevate" || fgEffects === "shadow") {
    let scale = contentSize.w / 48;
    foregroundLayer.effects = [
      ...foregroundLayer.effects!,
      {
        effect: "outer-shadow",
        color: "rgba(0, 0, 0, 0.2)",
        translateY: 0.25 * scale,
      },
      {
        effect: "outer-shadow",
        color: "rgba(0, 0, 0, 0.2)",
        blur: 1 * scale,
        translateY: 1 * scale,
      },
    ];
  }

  let bgImageLayer: Layer | null = null;
  let bgImg: HTMLImageElement;
  if (bgType === "image") {
    let { url } = values.bgImage || {};
    if (url) {
      bgImg = await loadImageFromUri(url);
      // use the middle 2/3 of the image (because of android adaptive icons)
      let bgTargetRect = {
        x: targetRect.x - targetRect.w / 4,
        y: targetRect.y - targetRect.h / 4,
        w: (targetRect.w * 3) / 2,
        h: (targetRect.h * 3) / 2,
      };
      bgImageLayer = {
        draw: (ctx) =>
          drawCenterCrop(ctx, bgImg, bgTargetRect, {
            x: 0,
            y: 0,
            w: bgImg.naturalWidth,
            h: bgImg.naturalHeight,
          }),
      };
    }
  }

  let bgTextureLayer: Layer | null = null;
  if (bgTexture) {
    bgTextureLayer = {
      draw: (ctx) => {
        // draw center-cropped ("cover" in object-fit terms)
        ctx.save();
        ctx.translate(targetRect.x, targetRect.y);
        let scale = Math.max(targetRect.w, targetRect.h);
        ctx.translate((targetRect.w - scale) / 2, (targetRect.h - scale) / 2);
        ctx.scale(scale, scale);
        drawTexture(ctx, bgTexture);
        ctx.restore();
      },
    };
  }

  let { badge, badgeColor } = values;
  badgeColor = tinycolor(badgeColor);

  drawLayers(outCtx, assetSize, {
    children: [
      (layer === "all" || layer === "background") && backgroundLayer,
      (layer === "all" || layer === "background") && bgImageLayer,
      (layer === "all" || layer === "background") && bgTextureLayer,
      (layer === "all" || layer === "foreground") && foregroundLayer,
      fgEffects === "score" &&
        layer !== "background" && {
          draw: (ctx: CanvasRenderingContext2D) => {
            ctx.fillStyle = "rgba(0, 0, 0, .1)";
            ctx.fillRect(0, 0, assetSize.w, assetSize.h / 2);
          },
        },
      badge &&
        (layer === "all" || layer === "foreground") && {
          draw: (ctx: CanvasRenderingContext2D) => {
            let scale = contentSize!.w / 48;
            const badgeScale = badgeStyle === "default" ? 1 : 0.75;
            scale = scale * badgeScale;
            badge = badge!.toLocaleUpperCase();
            if (!hasEmoji(badge)) {
              badge = badge.split("").join(String.fromCharCode(0x2006));
            }
            ctx.font = `700 ${5 * scale}px Inter`;
            let fm = ctx.measureText(badge);
            let badgeTextColor = tinycolor
              .mostReadable(badgeColor, ["#fff", "#444"])
              .toRgbString();
            if (badgeStyle === "default") {
              let badgeHeight = (shape === "circle" ? 12 : 10) * scale;
              ctx.fillStyle = badgeColor.toRgbString();
              ctx.fillRect(
                0,
                targetRect.y + targetRect.h - badgeHeight,
                assetSize.w,
                badgeHeight + assetSize.h - targetRect.h
              );
              ctx.fillStyle = badgeTextColor;
              ctx.textAlign = "center";
              ctx.textBaseline = "alphabetic"; // pretty consistent across browsers
              ctx.fillText(
                badge,
                assetSize.w / 2,
                targetRect.y +
                  targetRect.h -
                  badgeHeight +
                  2.5 * scale +
                  fm.actualBoundingBoxAscent
              );
            } else if (badgeStyle === "side") {
              let badgeHeight = 9 * scale;
              let badgeWidth = fm.width + 10 * scale;
              ctx.fillStyle = badgeColor.toRgbString();
              ctx.fill(
                roundRectPath(
                  {
                    x: targetRect.w - badgeWidth,
                    y: targetRect.y + targetRect.h - badgeHeight,
                    w: badgeWidth,
                    h: badgeHeight,
                  },
                  { tl: badgeHeight / 2 }
                )
              );
              ctx.fillStyle = badgeTextColor;
              ctx.textAlign = "left";
              ctx.textBaseline = "alphabetic"; // pretty consistent across browsers
              ctx.fillText(
                badge,
                targetRect.w - badgeWidth + 5 * scale,
                targetRect.y +
                  targetRect.h -
                  badgeHeight +
                  2.5 * scale +
                  fm.actualBoundingBoxAscent
              );
            }
          },
          effects: [
            {
              effect: "outer-shadow",
              color: "rgba(0, 0, 0, 0.2)",
              translateY: (-0.5 * contentSize.w * 1) / 48,
              // blur: .5 * contentSize.w * 1 / 48,
            },
          ],
        },
    ],
    effects: finalEffects,
  });

  return outCtx;
}

async function renderForeground(
  { values }: GenerateContext,
  maxFinalSize?: Size
): Promise<CanvasRenderingContext2D | null> {
  let { fgType, fgColor } = values;
  fgColor = tinycolor(fgColor);

  switch (fgType) {
    case "image": {
      let { url, svg } = values.fgImage || {};
      if (!url) {
        return null;
      }
      let img = await loadImageFromUri(url);
      let origSize: Size = {
        w: img.naturalWidth,
        h: img.naturalHeight,
      };
      let size = { ...origSize };
      if (svg && maxFinalSize) {
        if (size.w / size.h > maxFinalSize.w / maxFinalSize.h) {
          size.w = maxFinalSize.w;
          size.h = (size.w * origSize.h) / origSize.w;
        } else {
          size.h = maxFinalSize.h;
          size.w = (size.h * origSize.w) / origSize.h;
        }
      }
      let ctx = makeContext(size);
      // don't specify source width and height because it breaks
      // SVGs that don't have a width or height set (i.e. viewbox only)
      // and is irrelevant for PNGs
      ctx.drawImage(
        img,
        // 0, 0, origSize.w, origSize.h,
        0,
        0,
        size.w,
        size.h
      );
      return ctx;
    }

    case "clipart": {
      let size = { w: 1536, h: 1536 };
      let { icon, set } = values.fgClipart!;
      let iconSetInfo = ICON_SETS[set || "default"];

      await tryLoadWebFont(iconSetInfo.family);

      let ctx = makeContext(size);
      ctx.fillStyle = "#000";
      ctx.font = `${size.h}px/${size.h}px '${iconSetInfo.family}'`;
      ctx.textBaseline = "alphabetic";
      ctx.fillText(icon, 0, size.h);
      return ctx;
    }

    case "text": {
      let size = { w: 6144, h: 1536 };
      let textHeight = size.h * 0.75;
      let ctx = makeContext(size);
      let text = ` ${values.fgText} `;
      let font: FontValue = values.fgFont!;

      await tryLoadWebFont(font.family, {
        bold: font.bold,
        italic: font.italic,
      });

      let setupCanvas_ = () => {
        ctx.fillStyle = fgColor.toHexString();
        ctx.font = `
          ${font.italic ? "italic" : ""}
          ${font.bold ? "bold" : ""}
          ${textHeight}px
          "${font.family}"`;
        ctx.textBaseline = "alphabetic";
      };

      setupCanvas_();
      size.w = Math.ceil(
        Math.min(ctx.measureText(text).width, 128000) || size.w
      );
      ctx.canvas.width = size.w;
      ctx = ctx.canvas.getContext("2d")!;
      setupCanvas_();
      ctx.fillText(text, 0, textHeight);
      return ctx;
    }
  }

  return Promise.resolve(makeContext({ w: 0, h: 0 }));
}

function hasEmoji(str: string) {
  return (str || "").match(/\p{Emoji}/u);
}
