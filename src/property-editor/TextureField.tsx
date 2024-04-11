import cn from "classnames";
import { Tooltip } from "../components/tooltip/Tooltip";
import peStyles from "./PropertyEditor.module.scss";
import styles from "./TextureField.module.scss";
import { ColorWidget } from "./widgets/ColorWidget";
import { SelectWidget } from "./widgets/SelectWidget";
import { FC } from "react";

const TEXTURES: [string, string][] = [
  ["", "None"],
  ["waves", "Waves"],
  ["polka", "Polka"],
  ["mosaic", "Mosaic"],
  ["stipple", "Stipple"],
  ["argyle", "Argyle"],
];

interface TextureFieldProps {
  fieldId: string;
  property: any;
  value: any;
  effectiveValue: any;
  onValue: (value: any) => void;
}

export const TextureField: FC<TextureFieldProps> = ({
  fieldId,
  effectiveValue,
  onValue,
}) => {
  effectiveValue = effectiveValue || {};
  return (
    <div className={cn(styles.field)}>
      <SelectWidget
        style={{ flex: 1 }}
        id={fieldId}
        onChange={(texture) =>
          onValue(texture ? { ...effectiveValue, texture } : null)
        }
        value={effectiveValue?.texture || ""}
        options={TEXTURES}
      />
      {effectiveValue?.texture && (
        <>
          <ColorWidget
            value={effectiveValue?.color || "#222"}
            allowAlpha={true}
            onChange={(color) => onValue({ ...effectiveValue, color })}
          />
          <Tooltip tooltip="Randomize">
            <button
              className={cn(peStyles.button, peStyles.iconButton)}
              onClick={(ev) => {
                let ic = ev.currentTarget.querySelector(".material-icons")!;
                ic.animate(
                  [
                    {
                      transform: `rotate(${
                        (Math.random() < 0.5 ? -1 : 1) * 180
                      }deg)`,
                    },
                  ],
                  {
                    duration: 800,
                    easing: "cubic-bezier(.4,1.5,.75,.9)",
                  }
                );
                onValue({ ...effectiveValue, seed: Math.random() });
              }}
              aria-label="Randomize"
            >
              <i className="material-icons">casino</i>
            </button>
          </Tooltip>
        </>
      )}
    </div>
  );
};
