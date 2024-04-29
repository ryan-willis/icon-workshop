import { FC } from "react";
import { TextWidget } from "./widgets/TextWidget";
import { Property } from "../imagelib/types";

interface TextFieldProps {
  fieldId: string;
  property: Property;
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
      placeholder={property.default as string}
    />
  );
};
