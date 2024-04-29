import { BaseModule } from "../base-module";
import { makeContext } from "../imagelib/drawing";
import {
  ctxToBlob,
  figmaSquirclePath,
  IOS_RADIUS,
  roundRectPath,
} from "../imagelib/imageutil";
import chromeTabBackground from "../preview/chrome-tab.webp";
import chromeTabBackgroundDark from "../preview/chrome-tab-dark.webp";
import { ImageOverlays } from "../preview/ImageOverlays";
import iphone13Background from "../preview/iphone13-bg.webp";
import iphone13BackgroundDark from "../preview/iphone13-bg-dark.webp";
import { ShrinkToFit } from "../preview/ShrinkToFit";
import { renderAppIcon } from "./app-icon-renderer";
import {
  commonAppIconBackgroundPropertyGroup,
  commonAppIconBadgeProperties,
  commonAppIconForegroundPropertyGroup,
  commonAppIconShapeProperty,
} from "./common-properties";
import { makeIco } from "./make-ico";
import { Artifact, GenerateContext, PropertyModel } from "../imagelib/types";

export const WebModule = new (class extends BaseModule {
  type = "web";
  label = "Web Icons";

  async generatePreview(
    context: GenerateContext
  ): Promise<{ [id: string]: string }> {
    const { bgShape } = context.values;
    let shape = bgShape;
    if (bgShape === "square") {
      shape = roundRectPath({ x: 0, y: 0, w: 1, h: 1 }, 4 / 16);
    }

    const [favicon16, favicon32, appleTouchIcon] = await Promise.all([
      renderAppIcon(context, {
        assetSize: { w: 16, h: 16 },
        shape: shape!,
      }),
      renderAppIcon(context, {
        assetSize: { w: 32, h: 32 },
        shape: shape!,
      }),
      renderAppIcon(context, {
        assetSize: { w: 180, h: 180 },
        shape: figmaSquirclePath({ w: 1, h: 1 }, IOS_RADIUS),
      }),
    ]);

    const preview = makeContext({
      w: 228,
      h: 180,
    });

    preview.drawImage(favicon16.canvas, 0, 0);
    preview.drawImage(favicon32.canvas, 0, 32);
    preview.drawImage(appleTouchIcon.canvas, 48, 0);
    // return preview.canvas.toDataURL();
    return {
      main: favicon16.canvas.toDataURL(),
      favicon16: favicon16.canvas.toDataURL(),
      favicon32: favicon32.canvas.toDataURL(),
      appleTouchIcon: appleTouchIcon.canvas.toDataURL(),
    };
  }

  renderPreview(
    {
      favicon16,
      appleTouchIcon,
    }: {
      favicon16: string;
      appleTouchIcon: string;
    },
    {
      darkTheme,
    }: {
      darkTheme: boolean;
    }
  ) {
    return (
      <ShrinkToFit>
        <ImageOverlays
          src={darkTheme ? chromeTabBackgroundDark : chromeTabBackground}
          width={620}
          height={620}
          overlays={[
            {
              src: favicon16,
              label: "16px Favicon Preview",
              x: 138,
              y: 65,
              width: 16,
              height: 16,
            },
          ]}
        />
        <ImageOverlays
          style={{
            position: "absolute",
            left: 170,
            top: 100,
          }}
          src={darkTheme ? iphone13BackgroundDark : iphone13Background}
          width={524}
          height={978}
          overlays={[
            {
              src: appleTouchIcon,
              label: "Apple Touch Icon Preview",
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
    const { bgShape } = context.values;
    let shape = bgShape;
    if (bgShape === "square") {
      shape = roundRectPath({ x: 0, y: 0, w: 1, h: 1 }, 4 / 16);
    }

    const [
      favicon16,
      favicon32,
      appleTouchIcon,
      icon192,
      icon512,
      maskable192,
      maskable512,
    ] = await Promise.all([
      // favicons
      renderAppIcon(context, {
        assetSize: { w: 16, h: 16 },
        shape: shape!,
      }),
      renderAppIcon(context, {
        assetSize: { w: 32, h: 32 },
        shape: shape!,
      }),
      // apple touch icon
      renderAppIcon(context, {
        assetSize: { w: 180, h: 180 },
        shape: "square-sharp",
      }),
      // web icons
      renderAppIcon(context, {
        assetSize: { w: 192, h: 192 },
        shape: shape!,
      }),
      renderAppIcon(context, {
        assetSize: { w: 512, h: 512 },
        shape: shape!,
      }),
      // maskable
      renderAppIcon(context, {
        assetSize: { w: 192, h: 192 },
        shape: "square-sharp",
      }),
      renderAppIcon(context, {
        assetSize: { w: 512, h: 512 },
        shape: "square-sharp",
      }),
    ]);

    const icoBlob = makeIco([favicon16.canvas, favicon32.canvas]);

    return [
      {
        filename: "favicon.ico",
        content: icoBlob,
      },
      {
        filename: "apple-touch-icon.png",
        content: ctxToBlob(appleTouchIcon),
      },
      {
        filename: "icon-192.png",
        content: ctxToBlob(icon192),
      },
      {
        filename: "icon-512.png",
        content: ctxToBlob(icon512),
      },
      {
        filename: "icon-192-maskable.png",
        content: ctxToBlob(maskable192),
      },
      {
        filename: "icon-512-maskable.png",
        content: ctxToBlob(maskable512),
      },
      {
        filename: "README.txt",
        content: makeReadme(),
      },
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
            ...commonAppIconShapeProperty,
            title: "Favicon",
          },
        ],
      },
    ],
  };
})();

function makeReadme() {
  return `Add this to your HTML <head>:

    <link rel="icon" href="/favicon.ico" sizes="any">
    <link rel="apple-touch-icon" href="/apple-touch-icon.png">

Add this to your app's manifest.json:

    ...
    {
      "icons": [
        { "src": "/favicon.ico", "type": "image/x-icon", "sizes": "16x16 32x32" },
        { "src": "/icon-192.png", "type": "image/png", "sizes": "192x192" },
        { "src": "/icon-512.png", "type": "image/png", "sizes": "512x512" },
        { "src": "/icon-192-maskable.png", "type": "image/png", "sizes": "192x192", "purpose": "maskable" },
        { "src": "/icon-512-maskable.png", "type": "image/png", "sizes": "512x512", "purpose": "maskable" }
      ]
    }
    ...
`;
}
