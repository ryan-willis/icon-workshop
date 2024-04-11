import { BaseModule } from "../base-module";
import { ctxToBlob } from "../imagelib/imageutil";
import { Artifact, GenerateContext, PropertyModel } from "../imagelib/types";
import { renderAppIcon } from "./app-icon-renderer";
import {
  commonAppIconBackgroundPropertyGroup,
  commonAppIconBadgeProperties,
  commonAppIconForegroundPropertyGroup,
} from "./common-properties";
import { TvOSParallaxPreview } from "./TvOSParallaxPreview";

const WIDTH = 400;
const HEIGHT = 240;

// Original ThreeJS version: https://jsfiddle.net/romannurik/njL5usoy/138/

export const TvOSModule = new (class extends BaseModule {
  type = "tvos";
  label = "tvOS App Icon";

  async generatePreview(
    context: GenerateContext
  ): Promise<{ [id: string]: string }> {
    let scale = 2;
    let assetSize = { w: WIDTH * scale, h: HEIGHT * scale };

    return {
      main: (
        await renderAppIcon(context, {
          assetSize,
          shape: "square-sharp",
          badgeStyle: "side",
        })
      ).canvas.toDataURL(),
      foreground: (
        await renderAppIcon(context, {
          assetSize,
          layer: "foreground",
          shape: "square-sharp",
          badgeStyle: "side",
        })
      ).canvas.toDataURL(),
      background: (
        await renderAppIcon(context, {
          assetSize,
          layer: "background",
          shape: "square-sharp",
          badgeStyle: "side",
        })
      ).canvas.toDataURL(),
    };
  }

  renderPreview({ foreground, background }: any, _: any) {
    return (
      <TvOSParallaxPreview
        width={400}
        height={240}
        layers={[background, foreground]}
      />
    );
  }

  async generateArtifacts(context: GenerateContext): Promise<Artifact[]> {
    return [
      // 1x
      {
        filename: "1x/foreground.png",
        content: renderAppIcon(context, {
          assetSize: { w: WIDTH, h: HEIGHT },
          layer: "foreground",
          shape: "square-sharp",
          badgeStyle: "side",
        }).then((c) => ctxToBlob(c)),
      },
      {
        filename: "1x/background.png",
        content: renderAppIcon(context, {
          assetSize: { w: WIDTH, h: HEIGHT },
          layer: "background",
          shape: "square-sharp",
          badgeStyle: "side",
        }).then((c) => ctxToBlob(c)),
      },
      // 2x
      {
        filename: "2x/foreground.png",
        content: renderAppIcon(context, {
          assetSize: { w: WIDTH * 2, h: HEIGHT * 2 },
          layer: "foreground",
          shape: "square-sharp",
          badgeStyle: "side",
        }).then((c) => ctxToBlob(c)),
      },
      {
        filename: "2x/background.png",
        content: renderAppIcon(context, {
          assetSize: { w: WIDTH * 2, h: HEIGHT * 2 },
          layer: "background",
          shape: "square-sharp",
          badgeStyle: "side",
        }).then((c) => ctxToBlob(c)),
      },
      // marketing
      {
        filename: "app_store_icon.png",
        content: renderAppIcon(context, {
          assetSize: { w: 1280, h: 768 },
          shape: "square-sharp",
          badgeStyle: "side",
        }).then((c) => ctxToBlob(c)),
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
        properties: [...commonAppIconBadgeProperties],
      },
    ],
  };
})();
