import { FC } from "react";
import styles from "./GradientField.module.scss";
import { ColorWidget } from "./widgets/ColorWidget";
import { numberValidator, TextWidget } from "./widgets/TextWidget";

interface GradientFieldProps {
  effectiveValue: { color1: string; color2: string; angle: number };
  onValue: (value: { color1: string; color2: string; angle: string }) => void;
}

export const GradientField: FC<GradientFieldProps> = ({
  effectiveValue,
  onValue,
}) => {
  const { color1, color2, angle: angleNum } = effectiveValue || {};

  const angle = `${angleNum || 0}`;

  return (
    <div className={styles.field}>
      <ColorWidget
        value={color1}
        onChange={(color1) => onValue({ color1, color2, angle })}
      />
      <ColorWidget
        value={color2}
        onChange={(color2) => onValue({ color1, color2, angle })}
      />
      <TextWidget
        className={styles.angle}
        validator={numberValidator()}
        type="number"
        value={`${angle}`}
        suffix="°"
        title="Angle"
        onChange={(angle) => onValue({ color1, color2, angle })}
      />
    </div>
  );
};
