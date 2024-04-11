import { FC } from "react";
import { TextWidget } from "./widgets/TextWidget";

interface TextFieldProps {
  fieldId: string;
  property: any;
  value: string;
  onValue: (value: string) => void;
}

export const TextField: FC<TextFieldProps> = ({
  fieldId,
  property,
  value,
  onValue,
}) => {
  return (
    <TextWidget
      id={fieldId}
      type="text"
      onChange={(value) => onValue(value)}
      value={value || ""}
      placeholder={property.default}
    />
  );
};
