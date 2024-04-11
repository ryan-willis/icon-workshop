import tinycolor from "tinycolor2";
import { BaseModule } from "../base-module";
import { makeContext } from "../imagelib/drawing";
import { ctxToBlob } from "../imagelib/imageutil";
import { tryLoadWebFont } from "../property-editor/FontField";
import { renderAppIcon } from "./app-icon-renderer";
import { commonAppIconShapeProperty } from "./common-properties";
import {
  Artifact,
  GenerateContext,
  PropertyModel,
  Rect,
} from "../imagelib/types";

const FG_WIDTH = 1024;
const FG_HEIGHT = 500;

export const PlayStoreModule = new (class extends BaseModule {
  type = "play-store";
  label = "Play Store Banner (Beta)";

  requires = ["android"];

  async generateArtifacts(context: GenerateContext): Promise<Artifact[]> {
    return [
      {
        filename: "play_store_feature_graphic.png",
        content: generateFeatureGraphic(context, 1.0).then((c) => ctxToBlob(c)),
      },
    ];
  }

  async generatePreview(
    context: GenerateContext
  ): Promise<{ [id: string]: string }> {
    return {
      main: (await generateFeatureGraphic(context, 0.4)).canvas.toDataURL(),
    };
  }

  propertyModel: PropertyModel = {
    groups: [
      {
        title: "Feature Graphic",
        noHeader: true,
        properties: [
          {
            id: "psTitle",
            title: "Title",
            default: "Your App",
            type: "text",
          },
          {
            id: "psTagline",
            title: "Tagline",
            type: "text",
          },
          {
            id: "psFont",
            title: "Font",
            type: "font",
            default: {
              family: "Roboto",
            },
          },
          {
            id: "psBg",
            title: "BG",
            default: "#311B92",
            type: "color",
          },
          {
            id: "psFg",
            title: "Text",
            default: "#FFFFFF",
            type: "color",
          },
          {
            id: "psIcon",
            title: "Icon",
            default: true,
            type: "boolean",
          },
          {
            id: "psLayout",
            title: "Layout",
            default: "h",
            type: "enum",
            inline: true,
            options: [
              ["h", "Horizontal"],
              ["v", "Vertical"],
            ],
            depends: (values) => !!values.psIcon,
          },
          {
            ...commonAppIconShapeProperty,
            depends: (values) => !!values.psIcon,
          },
        ],
      },
    ],
  };
})();

async function generateFeatureGraphic(context: GenerateContext, scale = 1) {
  let {
    psLayout,
    psIcon,
    psBg,
    psFg,
    psTitle,
    psTagline,
    psFont: psf,
    bgShape,
  } = context.values;
  const psFont = psf!;

  let horizontal = psLayout === "h";

  // prepare icon
  let iconSize = horizontal ? 250 : 225;
  let iconCtx =
    psIcon &&
    (await renderAppIcon(context, {
      assetSize: { w: iconSize, h: iconSize },
      shape: bgShape!,
    }));

  // prepare output context
  let ctx = makeContext({ w: FG_WIDTH * scale, h: FG_HEIGHT * scale });
  ctx.scale(scale, scale);
  ctx.beginPath();
  ctx.rect(0, 0, FG_WIDTH, FG_HEIGHT);
  ctx.fillStyle = psBg!;
  ctx.fill();

  // measure and draw text
  await tryLoadWebFont(psFont.family, {
    bold: psFont.bold,
    italic: psFont.italic,
  });
  let font = (size: number) => `
    ${psFont.italic ? "italic" : ""}
    ${psFont.bold ? "bold" : ""}
    ${size}px
    ${psFont.family}`;

  if (!psIcon || horizontal) {
    // horizontal or no-icon lockup
    let iconSpace = psIcon ? iconSize + 64 : 0;
    let titleArgs: TextArgs = {
      align: psIcon ? "left" : "center",
      mode: "shrink",
      fontSize: 84,
      font,
    };
    let taglineArgs: TextArgs = {
      align: psIcon ? "left" : "center",
      mode: "wrap",
      fontSize: 40,
      leading: 10,
      font,
    };
    let taglineMargin = 24;

    // measure title and subtitle
    let mTitle = measureText(
      ctx,
      psTitle!,
      FG_WIDTH - 160 - iconSpace,
      titleArgs
    );
    let mTagline = measureText(
      ctx,
      psTagline!,
      FG_WIDTH - 160 - iconSpace,
      taglineArgs
    );
    let contentWidth = Math.max(mTitle.w, mTagline.w) + iconSpace;

    // draw icon
    if (psIcon && iconCtx)
      ctx.drawImage(
        iconCtx.canvas,
        (FG_WIDTH - contentWidth) / 2,
        (FG_HEIGHT - iconSize) / 2,
        iconSize,
        iconSize
      );

    // draw title and subtitle
    let color = tinycolor(psFg);
    ctx.fillStyle = color.toRgbString();
    text(
      ctx,
      psTitle,
      {
        x: (FG_WIDTH - contentWidth) / 2 + iconSpace,
        y:
          (FG_HEIGHT -
            mTitle.h -
            (psTagline ? mTagline.h + taglineMargin : 0)) /
          2,
        w: Math.max(mTitle.w, mTagline.w),
      },
      titleArgs
    );

    if (psTagline) {
      color.setAlpha(0.75);
      ctx.fillStyle = color.toRgbString();
      text(
        ctx,
        psTagline,
        {
          x: (FG_WIDTH - contentWidth) / 2 + iconSpace,
          y:
            (FG_HEIGHT - mTitle.h - mTagline.h - taglineMargin) / 2 +
            mTitle.h +
            taglineMargin,
          w: Math.max(mTitle.w, mTagline.w),
        },
        taglineArgs
      );
    }
  } else {
    // vertical lockup, icon guaranteed
    let titleArgs: TextArgs = {
      align: "center",
      mode: "shrink",
      fontSize: 64,
      font,
    };
    let taglineArgs: TextArgs = {
      align: "center",
      mode: "shrink",
      fontSize: 40,
      font,
    };
    let iconMargin = 40;
    let taglineMargin = 12;

    let mTitle = measureText(ctx, psTitle!, FG_WIDTH - 160, titleArgs);
    let mTagline = measureText(ctx, psTagline!, FG_WIDTH - 160, taglineArgs);

    let contentHeight =
      iconSize +
      iconMargin +
      mTitle.h +
      (psTagline ? mTagline.h + taglineMargin : 0);

    // draw icon
    if (iconCtx)
      ctx.drawImage(
        iconCtx.canvas,
        (FG_WIDTH - iconSize) / 2,
        (FG_HEIGHT - contentHeight) / 2,
        iconSize,
        iconSize
      );

    // draw title and subtitle
    let color = tinycolor(psFg);
    ctx.fillStyle = color.toRgbString();
    text(
      ctx,
      psTitle,
      {
        x: 80,
        y: (FG_HEIGHT - contentHeight) / 2 + iconSize + iconMargin,
        w: FG_WIDTH - 160,
      },
      titleArgs
    );

    if (psTagline) {
      color.setAlpha(0.75);
      ctx.fillStyle = color.toRgbString();
      text(
        ctx,
        psTagline,
        {
          x: 80,
          y:
            (FG_HEIGHT - contentHeight) / 2 +
            iconSize +
            iconMargin +
            mTitle.h +
            taglineMargin,
          w: FG_WIDTH - 160,
        },
        taglineArgs
      );
    }
  }

  return ctx;
}

interface TextArgs {
  fontSize: number;
  font: Function | string;
  mode: "shrink" | "wrap";
  align?: "left" | "center";
  leading?: number;
  measureOnly?: boolean;
}

function measureText(
  ctx: CanvasRenderingContext2D,
  t: string,
  w: number,
  args: any
) {
  return text(ctx, t, { x: 0, y: 0, w }, { ...args, measureOnly: true });
}

function text(
  ctx: CanvasRenderingContext2D,
  text = "",
  { x, y, w }: Omit<Rect, "h">,
  {
    fontSize = 15,
    font = "Roboto",
    align = "left",
    mode = "shrink",
    leading = 0,
    measureOnly = false,
  }: TextArgs
) {
  if (measureOnly && !text) {
    return { w: 0, h: 0 };
  }

  if (typeof font !== "function") {
    let family = font;
    font = (s: number) => `${s}px ${family}`;
  }
  let l = align === "center" ? w / 2 : 0;
  ctx.textBaseline = "alphabetic"; // pretty consistent across browsers
  ctx.textAlign = align === "center" ? "center" : "left";
  let actualW = 0,
    actualH = 0;
  if (mode === "wrap") {
    let yy = y;
    // wrap
    ctx.font = font(fontSize);
    let pieces = (text.match(/[^ -]+[ -]?|[ -]/g) || []).filter((s) => !!s);
    let firstLine = true;
    while (pieces.length) {
      for (let n = pieces.length; n >= 1; n--) {
        let s = pieces.slice(0, n).join("");
        let fm = ctx.measureText("A");
        let tm = ctx.measureText(s);
        if (tm.width <= w || n === 1) {
          if (!firstLine) {
            yy += leading || 0;
          }
          !measureOnly &&
            ctx.fillText(s, x + l, yy + fm.actualBoundingBoxAscent);
          yy += fontSize; // fm.actualBoundingBoxDescent + fm.actualBoundingBoxAscent
          actualW = Math.max(actualW, tm.width);
          actualH = yy - y;
          pieces = pieces.slice(n);
          firstLine = false;
          break;
        }
      }
    }
  } else {
    // shrink (single line)
    while (fontSize > 5) {
      ctx.font = font(fontSize);
      let fm = ctx.measureText("A");
      let tm = ctx.measureText(text);
      if (tm.width <= w) {
        !measureOnly &&
          ctx.fillText(text, x + l, y + fm.actualBoundingBoxAscent);
        actualW = tm.width;
        actualH = fontSize; //fm.actualBoundingBoxDescent + fm.actualBoundingBoxAscent;
        break;
      } else {
        --fontSize;
      }
    }
  }
  // if (!measureOnly) {
  //   ctx.strokeStyle = '#f00';
  //   ctx.beginPath();
  //   ctx.rect(x, y, actualW, actualH);
  //   ctx.stroke();
  //   ctx.strokeStyle = '#0f0';
  //   ctx.beginPath();
  //   ctx.rect(x, y, actualW, actualH);
  //   ctx.stroke();
  // }
  return { w: actualW, h: actualH };
}
