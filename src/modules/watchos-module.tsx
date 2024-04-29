import { BaseModule } from "../base-module";
import { ctxToBlob } from "../imagelib/imageutil";
import { Artifact, GenerateContext, PropertyModel } from "../imagelib/types";
import applewatch6BackgroundDark from "../preview/applewatch6-bg-dark.webp";
import applewatch6Background from "../preview/applewatch6-bg.webp";
import { ImageOverlays } from "../preview/ImageOverlays";
import { ShrinkToFit } from "../preview/ShrinkToFit";
import { renderAppIcon } from "./app-icon-renderer";
import {
  commonAppIconBackgroundPropertyGroup,
  commonAppIconBadgeProperties,
  commonAppIconForegroundPropertyGroup,
} from "./common-properties";

const ARTIFACT_SPECS = {
  // https://developer.apple.com/design/human-interface-guidelines/watchos/visual/app-icon/
  // home screee icons
  "-40@2x~watch": 80, // 38mm/42mm
  "-44@2x~watch": 88, // 40mm
  "-50@2x~watch": 100, // 44mm
  // notification center
  "-24@2x~watch": 48, // 38mm
  "-27.5@2x~watch": 55, // 40mm/42mm
  "-29@2x~watch": 58, // 44mm
  "-29@3x~watch": 87,
  // short look
  "-86@2x~watch": 172, // 38mm
  "-98@2x~watch": 196, // 40mm/42mm
  "-108@2x~watch": 216, // 44mm
  // store
  "~watch-marketing": 1024,
};

export const WatchOSModule = new (class extends BaseModule {
  type = "watchos";
  label = "watchOS Icon";

  async generatePreview(
    context: GenerateContext
  ): Promise<{ [id: string]: string }> {
    return {
      main: (
        await renderAppIcon(context, {
          assetSize: { w: 88, h: 88 },
          shape: "circle",
        })
      ).canvas.toDataURL(),
    };
  }

  renderPreview(
    { main }: Record<string, string>,
    {
      darkTheme,
    }: {
      darkTheme: boolean;
    }
  ) {
    return (
      <ShrinkToFit>
        <ImageOverlays
          src={darkTheme ? applewatch6BackgroundDark : applewatch6Background}
          width={290}
          height={462}
          overlays={[
            {
              src: main,
              x: 118,
              y: 208,
              width: 44,
              height: 44,
            },
          ]}
        />
      </ShrinkToFit>
    );
  }

  async generateArtifacts(context: GenerateContext): Promise<Artifact[]> {
    const blobPromises: Record<number, Promise<Blob>> = {};
    for (const size of Array.from(new Set(Object.values(ARTIFACT_SPECS)))) {
      blobPromises[size] = renderAppIcon(context, {
        assetSize: { w: size, h: size },
        shape: "square-sharp",
      }).then((ctx) => ctxToBlob(ctx));
    }
    return Object.entries(ARTIFACT_SPECS).map(([modifier, size]) => ({
      filename: `AppIcon${modifier}.png`,
      content: blobPromises[size],
    }));
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
