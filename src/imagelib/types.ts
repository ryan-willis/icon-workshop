import { Instance } from "tinycolor2";
/* eslint-disable  @typescript-eslint/no-explicit-any */
// TODO: ^ fix ^

export interface Size {
  w: number;
  h: number;
}

export interface Rect extends Size {
  x: number;
  y: number;
}

export interface GradientValue {
  color1: string;
  color2: string;
  angle: number;
}

export interface Artifact {
  filename: string;
  content: Promise<Blob> | string | Blob;
}

export interface PropertyModel {
  groups: PropertyGroup[];
}

export interface PropertyGroup {
  title: string;
  collapsible?: boolean;
  noHeader?: boolean;
  properties: Property[];
}

export interface Property {
  id: keyof GenerateContext["values"];
  title: string;
  type: string;
  default?: unknown;
  inline?: boolean;
  options?: [string, string][];
  depends?: (values: any) => boolean;
  labelHidden?: boolean;
  previewFit?: (values: any) => "contain" | "cover";
  instructions?: string;
  overlaySvg?: string;
}

export interface FontValue {
  family: string;
  bold: boolean;
  italic: boolean;
}

export interface RenderConfig {
  layer?: "all" | "foreground" | "background";
  assetSize: Size;
  contentSize?: Size;
  /** Must be in the unit rectangle `{x:0, y:0, w:1, h:1}` */
  shape: Path2D | "circle" | "squircle" | "square" | "square-sharp";
  finalEffects?: Effect[];
  badgeStyle?: "default" | "side";
  androidMonochrome?: boolean;
}

export interface GenerateContext {
  rawValues?: any;
  modules?: any;
  setModules?: any;
  previews?: any;
  set?: any;
  setAllValues?: any;
  values: {
    psLayout?: "h" | "v";
    psIcon?: boolean;
    psBg?: string;
    psFg?: string;
    psFont?: FontValue;
    psTagline?: string;
    psTitle?: string;
    badge?: string;
    badgeColor?: Instance;
    bgType?: string;
    bgShape?: RenderConfig["shape"];
    darkTheme?: boolean;
    filename?: string;
    themed?: boolean;
    bgGradient?: GradientValue;
    fgEffects?: string | null;
    fgPadding?: {
      top: number;
      left: number;
      right: number;
      bottom: number;
    };
    bgImage?: {
      url: string;
      svg: string;
    };
    fgClipart?: {
      icon: string;
      set: "default" | "outlined" | "round";
    };
    fgImage?: {
      url: string;
      svg?: string;
    };
    fgText?: string;
    fgFont?: FontValue;
    fgMask?: boolean;
    fgType?: string;
    fgScaling?: string;
    fgColor?: Instance;
    bgColor?: string;
  };
}

export interface PickerColor {
  hex: string;
  rgb: { r: number; g: number; b: number; a: number };
}

export interface Effect {
  effect: string;
  colors?: {
    offset: number;
    color: string;
  }[];
  [key: string]: any;
}

export interface Layer {
  mask?: boolean;
  opacity?: number;
  effects?: Effect[];
  draw?: (ctx: CanvasRenderingContext2D) => void;
}

export type LayerGroup = Layer & {
  children: (false | Layer | null | "" | undefined)[];
};
