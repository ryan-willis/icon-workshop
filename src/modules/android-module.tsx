import { BaseModule } from "../base-module";
import { makeContext } from "../imagelib/drawing";
import { ctxToBlob, loadImageFromUri } from "../imagelib/imageutil";
import androidAppIcons from "../preview/android-app-icons.webp";
import androidAppIconsMono from "../preview/android-app-icons-mono.webp";
import { ImageOverlays } from "../preview/ImageOverlays";
import pixel5BackgroundDark from "../preview/pixel5-bg-dark.webp";
import pixel5Background from "../preview/pixel5-bg.webp";
import { ShrinkToFit } from "../preview/ShrinkToFit";
import { renderAppIcon } from "./app-icon-renderer";
import {
  commonAppIconBackgroundPropertyGroup,
  commonAppIconBadgeProperties,
  commonAppIconForegroundPropertyGroup,
  commonAppIconShapeProperty,
} from "./common-properties";
import { fx } from "../imagelib/effects";
import { Artifact, GenerateContext, PropertyModel } from "../imagelib/types";

const DENSITIES = {
  xxxhdpi: 4,
  xxhdpi: 3,
  xhdpi: 2,
  hdpi: 1.5,
  // tvdpi: 1.33125,
  mdpi: 1,
  // ldpi: .75,
};

const THEME_PREVIEW_COLORS = {
  dark: {
    bg: "#22242a",
    fg: "#FFDBE0",
  },
  light: {
    bg: "#DEE0E5",
    fg: "#0B334F",
  },
};

const LEGACY_CONTENT_SIZE_BY_SHAPE = {
  square: 38,
  squircle: 42,
  circle: 44,
};

export const AndroidModule = new (class extends BaseModule {
  type = "android";
  label = "Android Icon";

  async generatePreview(
    context: GenerateContext
  ): Promise<{ [id: string]: string }> {
    const scale = 2;
    const assetSize = { w: 46 * scale, h: 46 * scale };
    const { bgShape, darkTheme, themed } = context.values;

    // render the actual icon
    const appIcon = await renderAppIcon(context, {
      assetSize,
      shape: bgShape!,
    });

    // render contextual apps
    const otherIconsSheet = await loadImageFromUri(
      themed ? androidAppIconsMono : androidAppIcons
    );
    let otherIconsSheetSrc: CanvasImageSource | CanvasRenderingContext2D =
      otherIconsSheet;
    const oSize = otherIconsSheet.naturalHeight;
    const numOtherApps = Math.floor(otherIconsSheet.naturalWidth / oSize);
    const ctx = makeContext({ w: oSize, h: oSize });
    const otherAppPreviews: string[] = [];

    const main = appIcon.canvas.toDataURL();
    let mainThemed = main;
    if (themed) {
      const { fg, bg } = THEME_PREVIEW_COLORS[darkTheme ? "dark" : "light"];

      // draw the app icon, themed
      ctx.fillStyle = bg;
      ctx.fillRect(0, 0, oSize, oSize);
      const appIconMono = await renderAppIcon(context, {
        assetSize,
        shape: bgShape!,
        layer: "foreground",
        androidMonochrome: true,
      });
      fx([{ effect: "fill-color", color: fg }], ctx, appIconMono, {
        w: oSize,
        h: oSize,
      });
      mainThemed = (
        await renderAppIcon(
          {
            values: {
              fgType: "image",
              fgImage: { url: ctx.canvas.toDataURL() },
            },
          },
          { assetSize, shape: bgShape! }
        )
      ).canvas.toDataURL();

      // draw the sprite sheet of other app icons, themed
      const sheetSize = {
        w: otherIconsSheet.naturalWidth,
        h: otherIconsSheet.naturalHeight,
      };
      const sheetCtx = makeContext(sheetSize);
      sheetCtx.fillStyle = bg;
      sheetCtx.fillRect(0, 0, sheetSize.w, sheetSize.h);
      fx(
        [{ effect: "fill-color", color: fg }],
        sheetCtx,
        otherIconsSheet,
        sheetSize
      );
      otherIconsSheetSrc = sheetCtx.canvas;
    }

    for (let i = 0; i < numOtherApps; i++) {
      ctx.clearRect(0, 0, oSize, oSize);
      ctx.drawImage(
        otherIconsSheetSrc,
        0 + oSize * i,
        0,
        oSize,
        oSize,
        0,
        0,
        oSize,
        oSize
      );
      otherAppPreviews[i] = (
        await renderAppIcon(
          {
            values: {
              fgType: "image",
              fgImage: { url: ctx.canvas.toDataURL() },
            },
          },
          { assetSize, shape: bgShape! }
        )
      ).canvas.toDataURL();
    }

    return {
      main,
      mainThemed,
      app1: otherAppPreviews[0],
      app2: otherAppPreviews[1],
      app3: otherAppPreviews[2],
      app4: otherAppPreviews[3],
    };
  }

  renderPreview(
    { mainThemed, app1, app2, app3, app4 }: Record<string, string>,
    {
      darkTheme,
    }: {
      darkTheme: boolean;
    }
  ) {
    const images = [app1, app2, mainThemed, app3, app4];

    return (
      <ShrinkToFit>
        <ImageOverlays
          src={darkTheme ? pixel5BackgroundDark : pixel5Background}
          width={494}
          height={914}
          overlays={images.map((src, i) => ({
            src,
            x: 90 + i * 67,
            y: 248,
            width: 46,
            height: 46,
          }))}
        />
      </ShrinkToFit>
    );
  }

  async generateArtifacts(context: GenerateContext): Promise<Artifact[]> {
    const { filename, bgShape } = context.values;
    // @ts-expect-error okie
    const legacyContentSize = LEGACY_CONTENT_SIZE_BY_SHAPE[bgShape];

    return [
      // adaptive XML
      {
        filename: `res/mipmap-anydpi-v26/${filename}.xml`,
        content: makeAdaptiveIconXml(filename!),
      },
      // web/play version
      {
        filename: "play_store_512.png",
        content: renderAppIcon(context, {
          assetSize: { w: 512, h: 512 },
          shape: "square-sharp",
        }).then((c) => ctxToBlob(c)),
      },
      // for each density...
      ...Object.entries(DENSITIES).flatMap(([density, scale]) => [
        // adaptive background
        {
          filename: `res/mipmap-${density}/${filename}_background.png`,
          content: renderAppIcon(context, {
            assetSize: { w: 108 * scale, h: 108 * scale },
            contentSize: { w: 72 * scale, h: 72 * scale },
            shape: "square-sharp",
            layer: "background",
          }).then((c) => ctxToBlob(c)),
        },
        // adaptive foreground
        {
          filename: `res/mipmap-${density}/${filename}_foreground.png`,
          content: renderAppIcon(context, {
            assetSize: { w: 108 * scale, h: 108 * scale },
            contentSize: { w: 72 * scale, h: 72 * scale },
            shape: "square-sharp",
            layer: "foreground",
          }).then((c) => ctxToBlob(c)),
        },
        // monochrome foreground
        {
          filename: `res/mipmap-${density}/${filename}_monochrome.png`,
          content: renderAppIcon(context, {
            assetSize: { w: 108 * scale, h: 108 * scale },
            contentSize: { w: 72 * scale, h: 72 * scale },
            shape: "square-sharp",
            layer: "foreground",
            androidMonochrome: true,
          }).then((c) => ctxToBlob(c)),
        },
        // legacy
        {
          filename: `res/mipmap-${density}/${filename}.png`,
          content: renderAppIcon(context, {
            assetSize: { w: 48 * scale, h: 48 * scale },
            contentSize: {
              w: legacyContentSize * scale,
              h: legacyContentSize * scale,
            },
            shape: bgShape!,
            finalEffects: makeLegacyFinalEffects(scale),
          }).then((c) => ctxToBlob(c)),
        },
      ]),
    ];
  }

  propertyModel: PropertyModel = {
    groups: [
      commonAppIconForegroundPropertyGroup,
      commonAppIconBackgroundPropertyGroup,
      {
        title: "More",
        collapsible: true,
        properties: [
          ...commonAppIconBadgeProperties,
          {
            id: "filename",
            title: "Filename",
            default: "ic_launcher",
            type: "text",
          },
          {
            ...commonAppIconShapeProperty,
            title: "Shape",
          },
          {
            id: "themed",
            title: "Themed",
            default: false,
            type: "boolean",
          },
        ],
      },
    ],
  };
})();

interface Effect {
  effect: string;
  [key: string]: string | number | Record<string, string | number>[];
}

function makeLegacyFinalEffects(scale: number): Effect[] {
  return [
    {
      effect: "inner-shadow",
      color: "rgba(255, 255, 255, 0.2)",
      translateY: 0.25 * scale,
    },
    {
      effect: "inner-shadow",
      color: "rgba(0, 0, 0, 0.2)",
      translateY: -0.25 * scale,
    },
    {
      effect: "outer-shadow",
      color: "rgba(0, 0, 0, 0.3)",
      blur: 0.7 * scale,
      translateY: 0.7 * scale,
    },
    {
      effect: "fill-radialgradient",
      centerX: 0,
      centerY: 0,
      radius: 48 * scale,
      colors: [
        { offset: 0, color: "rgba(255,255,255,.1)" },
        { offset: 1, color: "rgba(255,255,255,0)" },
      ],
    },
  ];
}

// // legacy version
// let ctx = regenerateRaw_({ mult });
// // this.zipper.add({
// //   name: `res/mipmap-${density}/${values.name}.png`,
// //   canvas: ctx.canvas
// // });

function makeAdaptiveIconXml(name: string) {
  return `<?xml version="1.0" encoding="utf-8"?>
<adaptive-icon xmlns:android="http://schemas.android.com/apk/res/android">
  <background android:drawable="@mipmap/${name}_background"/>
  <foreground android:drawable="@mipmap/${name}_foreground"/>
  <monochrome android:drawable="@mipmap/${name}_monochrome"/>
</adaptive-icon>`;
}
