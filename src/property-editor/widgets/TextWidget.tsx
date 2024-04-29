import { FC, forwardRef, useEffect, useState } from "react";
import styles from "./TextWidget.module.scss";

interface NumberValidatorParams {
  min?: number;
  max?: number;
}

interface Validator {
  isValid: (s: string) => boolean;
  forceValid: (s: string) => number;
}

export function numberValidator({
  min,
  max,
}: NumberValidatorParams = {}): Validator {
  return {
    isValid: (s) => !isNaN(parseInt(s, 10)),
    forceValid: (s) => {
      let v = parseInt(s, 10) || 0;
      if (max !== undefined) {
        v = Math.min(max, v);
      }
      if (min !== undefined) {
        v = Math.max(min, v);
      }
      return v;
    },
  };
}

interface TextWidgetProps {
  title?: string;
  value: string;
  suffix?: string;
  onChange: (value: string) => void;
  onFocus?: (ev: React.FocusEvent<HTMLInputElement>) => void;
  onBlur?: (ev: React.FocusEvent<HTMLInputElement>) => void;
  validator?: Validator;
  id?: string;
  type?: string;
  placeholder?: string;
  className?: string;
  list?: string;
  autoComplete?: string;
  onKeyDown?: (ev: React.KeyboardEvent<HTMLInputElement>) => void;
}

export const TextWidget: FC<TextWidgetProps> = forwardRef(
  (
    { value, suffix, onChange, validator, ...props },
    ref: React.Ref<HTMLInputElement>
  ) => {
    const [enteredText, setEnteredText] = useState("");
    const [isFocused, setFocused] = useState(false);

    useEffect(() => {
      !isFocused && setEnteredText(value === null ? "" : value);
    }, [isFocused, value]);

    return (
      <div className={styles.widget}>
        <input
          ref={ref}
          {...props}
          value={isFocused ? enteredText : value}
          onFocus={(ev) => {
            props.onFocus && props.onFocus(ev);
            setFocused(true);
          }}
          onBlur={(ev) => {
            props.onBlur && props.onBlur(ev);
            setFocused(false);
            if (validator) {
              ev.currentTarget.value = String(
                validator.forceValid(ev.currentTarget.value)
              );
            }
          }}
          onChange={(ev) => {
            const v = ev.currentTarget.value;
            setEnteredText(v);
            onChange(String(validator ? validator.forceValid(v) : v));
          }}
        />
        {suffix && (
          <span className={styles.suffix}>
            <span className={styles.hidden}>
              {isFocused ? enteredText : value}
            </span>
            {suffix}
          </span>
        )}
      </div>
    );
  }
);
TextWidget.displayName = "TextWidget";
