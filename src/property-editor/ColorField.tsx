import { FC } from "react";
import { ColorWidget } from "./widgets/ColorWidget";

interface ColorFieldProps {
  effectiveValue: string;
  onValue: (value: string) => void;
}

export const ColorField: FC<ColorFieldProps> = ({
  effectiveValue,
  onValue,
}) => {
  return <ColorWidget value={effectiveValue} onChange={onValue} />;
};
