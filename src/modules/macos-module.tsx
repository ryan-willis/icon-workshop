import { BaseModule } from "../base-module";
import { figmaSquirclePath, MACOS_RADIUS } from "../imagelib/imageutil";
import { ImageOverlays } from "../preview/ImageOverlays";
import macosDock from "../preview/macos-dock.webp";
import macosWallpaper from "../preview/macos-wallpaper.webp";
import macosWallpaperDark from "../preview/macos-wallpaper-dark.webp";
import { renderAppIcon } from "./app-icon-renderer";
import {
  commonAppIconBackgroundPropertyGroup,
  commonAppIconBadgeProperties,
  commonAppIconForegroundPropertyGroup,
} from "./common-properties";
import { makeIcns, OS_TYPES } from "./make-icns";
import {
  Artifact,
  Effect,
  GenerateContext,
  PropertyModel,
} from "../imagelib/types";

export const MacosModule = new (class extends BaseModule {
  type = "macos";
  label = "macOS Icon";

  async renderOne(
    context: GenerateContext,
    size: number,
    forceEffects = false
  ) {
    let scale = size / 1024;
    let assetSize = { w: 1024 * scale, h: 1024 * scale };
    let contentSize = assetSize;
    let finalEffects: Effect[] = [];

    if (size >= 128 || forceEffects) {
      contentSize = { w: 824 * scale, h: 824 * scale };
      finalEffects = [
        {
          effect: "inner-shadow",
          color: "rgba(255, 255, 255, 0.44)",
          translateY: 4 * scale,
          blur: 1 * scale,
        },
        {
          effect: "inner-shadow",
          color: "rgba(0, 0, 0, 0.25)",
          translateY: -3 * scale,
          blur: 2 * scale,
        },
        {
          effect: "outer-shadow",
          color: "rgba(0, 0, 0, .25)",
          translateY: 14 * scale,
          blur: 10 * scale,
        },
      ];
    }
    return renderAppIcon(context, {
      assetSize,
      contentSize,
      shape: figmaSquirclePath({ w: 1, h: 1 }, MACOS_RADIUS),
      finalEffects,
    });
  }

  async generatePreview(
    context: GenerateContext
  ): Promise<{ [id: string]: string }> {
    return {
      main: (await this.renderOne(context, 100, true)).canvas.toDataURL(),
    };
  }

  renderPreview(
    { main }: { main: string },
    { darkTheme }: { darkTheme: boolean }
  ) {
    return (
      <div
        style={{
          position: "absolute",
          left: 0,
          top: 0,
          width: "100%",
          height: "100%",
          backgroundImage: `url(${
            darkTheme ? macosWallpaperDark : macosWallpaper
          })`,
          backgroundSize: "cover",
          backgroundPosition: "50% 50%",
        }}
      >
        <ImageOverlays
          style={{
            position: "absolute",
            bottom: 5,
            left: "50%",
            transform: "translateX(-50%)",
          }}
          src={macosDock}
          width={236}
          height={65}
          overlays={[
            {
              src: main,
              x: 57,
              y: 5,
              width: 50,
              height: 50,
            },
          ]}
        />
      </div>
    );
  }

  async generateArtifacts(context: GenerateContext): Promise<Artifact[]> {
    let canvasPromises = Object.keys(OS_TYPES).map((s) => {
      let size = parseInt(s, 10);
      return this.renderOne(context, size).then((ctx) => ctx.canvas);
    });
    let canvases = await Promise.all(canvasPromises);
    return [
      {
        filename: "AppIcon.icns",
        content: makeIcns(canvases),
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
