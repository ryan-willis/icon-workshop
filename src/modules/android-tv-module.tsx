import { BaseModule } from "../base-module";
import { ctxToBlob } from "../imagelib/imageutil";
import { Artifact, GenerateContext, PropertyModel } from "../imagelib/types";
import { renderAppIcon } from "./app-icon-renderer";
import {
  commonAppIconBackgroundPropertyGroup,
  commonAppIconBadgeProperties,
  commonAppIconForegroundPropertyGroup,
} from "./common-properties";

const WIDTH = 320;
const HEIGHT = 180;

export const AndroidTVModule = new (class extends BaseModule {
  type = "androidtv";
  label = "Android TV Banner";

  async generatePreview(
    context: GenerateContext
  ): Promise<{ [id: string]: string }> {
    return {
      main: (
        await renderAppIcon(context, {
          assetSize: { w: WIDTH * 2, h: HEIGHT * 2 },
          shape: "square-sharp",
          badgeStyle: "side",
        })
      ).canvas.toDataURL(),
    };
  }

  async generateArtifacts(context: GenerateContext): Promise<Artifact[]> {
    return [
      {
        filename: "res/drawable-xhdpi/tv_banner.png",
        content: renderAppIcon(context, {
          assetSize: { w: WIDTH, h: HEIGHT },
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
