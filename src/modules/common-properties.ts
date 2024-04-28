import { Property, PropertyGroup } from "../imagelib/types";

export const commonAppIconForegroundPropertyGroup: PropertyGroup = {
  title: "Foreground",
  noHeader: true,
  properties: [
    {
      id: "fgType",
      title: "Icon",
      default: "clipart",
      inline: true,
      type: "enum",
      options: [
        ["clipart", "Icon"],
        ["text", "Text"],
        ["image", "Image"],
      ],
    },
    // clipart options
    {
      id: "fgClipart",
      title: "Icon",
      labelHidden: true,
      default: { icon: "architecture" },
      type: "clipart",
      depends: (values) => "clipart" === values.fgType,
    },
    // text options
    {
      id: "fgText",
      title: "Text",
      default: "Fu",
      type: "text",
      depends: (values) => values.fgType === "text",
    },
    {
      id: "fgFont",
      title: "Font",
      default: {
        family: "Roboto",
        bold: true,
      },
      type: "font",
      depends: (values) => values.fgType === "text",
    },
    // image options
    {
      id: "fgImage",
      title: "Image",
      labelHidden: true,
      type: "image",
      previewFit: (values) =>
        values.fgScaling === "crop" ? "cover" : "contain",
      instructions: "Square images work best, or you can crop/center",
      depends: (values) => values.fgType === "image",
    },
    {
      id: "fgScaling",
      title: "Scaling",
      default: "center",
      inline: true,
      type: "enum",
      options: [
        ["center", "Center"],
        ["crop", "Crop"],
      ],
      depends: (values) => values.fgType === "image",
    },
    // {
    //   id: 'fgTrim',
    //   title: 'Trim',
    //   type: 'boolean',
    //   depends: values => values.fgType === 'image',
    // },
    {
      id: "fgMask",
      title: "Mask",
      type: "boolean",
      depends: (values) => values.fgType === "image",
    },
    // all/most types
    {
      id: "fgColor",
      title: "Color",
      default: "#3d73e8",
      type: "color",
      depends: (values) =>
        ["text", "clipart"].includes(values.fgType) || !!values.fgMask,
    },
    {
      id: "fgEffects",
      title: "Effect",
      type: "enum",
      options: [
        ["", "None"],
        ["elevate", "Drop shadow"],
        ["shadow", "Cast shadow"],
        ["score", "Score"],
      ],
    },
    {
      id: "fgPadding",
      title: "Padding",
      type: "padding",
      default: { top: 15, left: 15, right: 15, bottom: 15 },
    },
  ],
};

export const commonAppIconBackgroundPropertyGroup: PropertyGroup = {
  title: "Background",
  properties: [
    {
      id: "bgType",
      title: "Type",
      default: "color",
      inline: true,
      type: "enum",
      options: [
        ["color", "Color"],
        ["gradient", "Gradient"],
        ["image", "Image"],
      ],
    },
    {
      id: "bgColor",
      title: "Color",
      default: "#ffffff",
      type: "color",
      depends: (values) => values.bgType === "color",
    },
    {
      id: "bgGradient",
      title: "Gradient",
      default: { color1: "#ffffff", color2: "#868a92", angle: 45 },
      type: "gradient",
      depends: (values) => values.bgType === "gradient",
    },
    {
      id: "bgImage",
      title: "Image",
      labelHidden: true,
      type: "image",
      previewFit: () => "cover",
      instructions: "The middle 2/3 of the image will be visible",
      overlaySvg: `<svg width="100" height="100" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path fill-rule="evenodd" clip-rule="evenodd" d="M100 0H0V100H100V0ZM83 17H17V83H83V17Z" fill="#888888" fill-opacity="0.5"/>
      <rect opacity="0.4" x="17.5" y="17.5" width="65" height="65" stroke="black"/>
      <rect opacity="0.4" x="16.5" y="16.5" width="67" height="67" stroke="white"/>
      </svg>`,
      depends: (values) => values.bgType === "image",
    },
  ],
};

export const commonAppIconBadgeProperties: Property[] = [
  {
    id: "badge",
    title: "Badge",
    type: "text",
  },
  {
    id: "badgeColor",
    title: "Color",
    type: "color",
    default: "#3d73e8",
    depends: (values) => !!values.badge,
  },
];

export const commonAppIconShapeProperty: Property = {
  id: "bgShape",
  title: "Shape",
  default: "circle",
  inline: true,
  type: "enum",
  options: [
    ["square", "Square"],
    ["squircle", "Squircle"],
    ["circle", "Circle"],
  ],
};
