import { FC } from "react";
import { SelectWidget } from "./widgets/SelectWidget";
import { ToggleButton } from "./widgets/ToggleButton";

interface EnumFieldProps {
  fieldId: string;
  property: any;
  effectiveValue: any;
  onValue: (value: any) => void;
}

export const EnumField: FC<EnumFieldProps> = ({
  fieldId,
  property,
  effectiveValue,
  onValue,
}) => {
  let { options, inline } = property;

  return (
    <div style={{ flex: 1 }}>
      {inline && (
        <ToggleButton
          id={fieldId}
          options={options}
          value={effectiveValue}
          onChange={(value) => onValue(value)}
        />
      )}
      {!inline && (
        <SelectWidget
          style={{ width: "100%" }}
          id={fieldId}
          options={options}
          value={effectiveValue || ""}
          onChange={(value) => onValue(value)}
        />
      )}
    </div>
  );
};
