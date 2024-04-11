import cn from "classnames";
import styles from "./BooleanField.module.scss";
import { FC } from "react";

interface BooleanFieldProps {
  fieldId: string;
  effectiveValue: boolean;
  onValue: (value: boolean) => void;
}

export const BooleanField: FC<BooleanFieldProps> = ({
  fieldId,
  effectiveValue,
  onValue,
}) => {
  return (
    <label
      className={cn(styles.field, { [styles.isChecked]: !!effectiveValue })}
    >
      <input
        id={fieldId}
        type="checkbox"
        onChange={(ev) => onValue(ev.currentTarget.checked)}
        checked={!!effectiveValue}
      />
    </label>
  );
};
