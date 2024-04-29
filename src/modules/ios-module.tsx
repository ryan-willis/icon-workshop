import { BaseModule } from "../base-module";
import {
  ctxToBlob,
  figmaSquirclePath,
  IOS_RADIUS,
} from "../imagelib/imageutil";
import { ImageOverlays } from "../preview/ImageOverlays";
import { renderAppIcon } from "./app-icon-renderer";
import {
  commonAppIconBackgroundPropertyGroup,
  commonAppIconBadgeProperties,
  commonAppIconForegroundPropertyGroup,
} from "./common-properties";
import iphone13Background from "../preview/iphone13-bg.webp";
import iphone13BackgroundDark from "../preview/iphone13-bg-dark.webp";
import { ShrinkToFit } from "../preview/ShrinkToFit";
import { Artifact, GenerateContext, PropertyModel } from "../imagelib/types";

type Idiom = "iphone" | "ipad" | "car" | "ios-marketing";

interface ArtifactSpec {
  sizePixels: number;
  size: number;
  scale: number;
  idiom: Idiom;
}

const ARTIFACT_SPECS: { [modifier: string]: ArtifactSpec } = {
  // app icons
  "@2x": { scale: 2, size: 60, sizePixels: 120, idiom: "iphone" },
  "@3x": { scale: 3, size: 60, sizePixels: 180, idiom: "iphone" },
  "~ipad": { scale: 1, size: 76, sizePixels: 76, idiom: "ipad" },
  "@2x~ipad": { scale: 2, size: 76, sizePixels: 152, idiom: "ipad" },
  "-83.5@2x~ipad": { scale: 2, size: 83.5, sizePixels: 167, idiom: "ipad" }, // ipad pro
  // spotlight
  "-40@2x": { scale: 2, size: 40, sizePixels: 80, idiom: "iphone" },
  "-40@3x": { scale: 3, size: 40, sizePixels: 120, idiom: "iphone" },
  "-40~ipad": { scale: 1, size: 40, sizePixels: 40, idiom: "ipad" },
  "-40@2x~ipad": { scale: 2, size: 40, sizePixels: 80, idiom: "ipad" },
  // notifications
  "-20@2x": { scale: 2, size: 20, sizePixels: 40, idiom: "iphone" },
  "-20@3x": { scale: 3, size: 20, sizePixels: 60, idiom: "iphone" },
  "-20~ipad": { scale: 1, size: 20, sizePixels: 20, idiom: "ipad" },
  "-20@2x~ipad": { scale: 2, size: 20, sizePixels: 40, idiom: "ipad" },
  // settings
  "-29": { scale: 1, size: 29, sizePixels: 29, idiom: "iphone" },
  "-29@2x": { scale: 2, size: 29, sizePixels: 58, idiom: "iphone" },
  "-29@3x": { scale: 3, size: 29, sizePixels: 87, idiom: "iphone" },
  "-29~ipad": { scale: 1, size: 29, sizePixels: 29, idiom: "ipad" },
  "-29@2x~ipad": { scale: 2, size: 29, sizePixels: 58, idiom: "ipad" },
  // carplay
  "-60@2x~car": { scale: 2, size: 60, sizePixels: 120, idiom: "car" },
  "-60@3x~car": { scale: 3, size: 60, sizePixels: 180, idiom: "car" },
  // store
  "~ios-marketing": {
    scale: 1,
    size: 1024,
    sizePixels: 1024,
    idiom: "ios-marketing",
  },
};

export const IosModule = new (class extends BaseModule {
  type = "ios";
  label = "iOS Icon";

  async generatePreview(
    context: GenerateContext
  ): Promise<{ [id: string]: string }> {
    return {
      main: (
        await renderAppIcon(context, {
          assetSize: { w: 120, h: 120 },
          shape: figmaSquirclePath({ w: 1, h: 1 }, IOS_RADIUS),
        })
      ).canvas.toDataURL(),
    };
  }

  renderPreview(
    { main }: { main: string },
    { darkTheme }: { darkTheme: boolean }
  ) {
    return (
      <ShrinkToFit>
        <ImageOverlays
          src={darkTheme ? iphone13BackgroundDark : iphone13Background}
          width={524}
          height={978}
          overlays={[
            {
              src: main,
              x: 94,
              y: 138,
              width: 60,
              height: 60,
            },
          ]}
        />
      </ShrinkToFit>
    );
  }

  async generateArtifacts(context: GenerateContext): Promise<Artifact[]> {
    const blobPromises: Record<number, Promise<Blob>> = {};
    for (const { sizePixels } of Array.from(
      new Set(Object.values(ARTIFACT_SPECS))
    )) {
      blobPromises[sizePixels] = renderAppIcon(context, {
        assetSize: { w: sizePixels, h: sizePixels },
        shape: "square-sharp",
      }).then((ctx) => ctxToBlob(ctx));
    }
    return [
      // Contents.json
      // https://developer.apple.com/library/archive/documentation/Xcode/Reference/xcode_ref-Asset_Catalog_Format/Contents.html
      {
        filename: "Contents.json",
        content: makeContentsJSON(),
      },
      // PNGs
      ...Object.entries(ARTIFACT_SPECS).map(([modifier, { sizePixels }]) => ({
        filename: `AppIcon${modifier}.png`,
        content: blobPromises[sizePixels],
      })),
    ];
  }

  propertyModel: PropertyModel = {
    groups: [
      commonAppIconForegroundPropertyGroup,
      commonAppIconBackgroundPropertyGroup,
      {
        title: "More",
        collapsible: true,
        properties: [...commonAppIconBadgeProperties],
      },
    ],
  };
})();

const DEFAULT_SIZES: { [idiom: string]: number } = {
  iphone: 60,
  ipad: 76,
  "ios-marketing": 1024,
};

function makeModifierString({ size, idiom, scale }: ArtifactSpec) {
  return [
    size === DEFAULT_SIZES[idiom] ? "" : `-${size}`,
    scale === 1 ? "" : `@${scale}x`,
    idiom === "iphone" ? "" : `~${idiom}`,
  ].join("");
}

for (const [mod, spec] of Object.entries(ARTIFACT_SPECS)) {
  if (mod !== makeModifierString(spec)) {
    console.warn(
      "iOS module artifact spec",
      mod,
      "does not match",
      makeModifierString(spec)
    );
  }
}

function makeContentsJSON() {
  return JSON.stringify(
    {
      images: Object.entries(ARTIFACT_SPECS).map(
        ([modifier, { idiom, scale, size }]) => ({
          filename: `AppIcon${modifier}.png`,
          idiom,
          scale: `${scale}x`,
          size: `${size}x${size}`,
        })
      ),
      info: {
        author: "iconworkshop",
        version: 1,
      },
    },
    null,
    2
  );
}
