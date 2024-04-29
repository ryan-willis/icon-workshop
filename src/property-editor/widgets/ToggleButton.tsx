import cn from "classnames";
import { FC, useState } from "react";
import styles from "./ToggleButton.module.scss";

interface ToggleButtonProps {
  id?: string;
  name?: string;
  className?: string;
  value: string;
  onChange: (value: string) => void;
  options: [string, string][];
}

export const ToggleButton: FC<ToggleButtonProps> = ({
  name,
  className,
  value,
  onChange,
  options,
  ...props
}) => {
  const [randomName] = useState(`toggle-${Math.floor(Math.random() * 9999)}`);
  name = name || randomName;

  return (
    <div {...props} className={cn(className, styles.widget)}>
      {options.map(([id, label]) => {
        const selected = id === value;
        return (
          <label key={id} className={cn({ [styles.isSelected]: selected })}>
            <input
              type="radio"
              name={name}
              value={id}
              onChange={() => onChange(id)}
              checked={selected}
            />
            {label}
          </label>
        );
      })}
    </div>
  );
};
