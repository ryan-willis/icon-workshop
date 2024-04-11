import { FC } from "react";
import cn from "classnames";
import styles from "./SelectWidget.module.scss";

interface SelectWidgetProps {
  className?: string;
  style?: React.CSSProperties;
  borderless?: boolean;
  value: string;
  onChange: (value: string) => void;
  options: [string, string][];
  id?: string;
}

export const SelectWidget: FC<SelectWidgetProps> = ({
  className,
  style,
  borderless,
  value,
  onChange,
  options,
  ...props
}) => {
  return (
    <div
      style={style}
      className={cn(className, styles.widget, {
        [styles.borderless]: !!borderless,
      })}
    >
      <select
        {...props}
        onChange={(ev) => onChange(ev.currentTarget.value)}
        value={value}
      >
        {options.map(([id, label]) => (
          <option key={id} value={id}>
            {label}
          </option>
        ))}
      </select>
    </div>
  );
};
