import cn from "classnames";
import { FC, useEffect, useState } from "react";
import { Tooltip } from "../components/tooltip/Tooltip";
import styles from "./PaddingField.module.scss";
import peStyles from "./PropertyEditor.module.scss";
import { numberValidator, TextWidget } from "./widgets/TextWidget";

interface PaddingFieldProps {
  fieldId: string;
  effectiveValue: { top: number; right: number; bottom: number; left: number };
  onValue: (value: {
    top: number;
    right: number;
    bottom: number;
    left: number;
  }) => void;
}

export const PaddingField: FC<PaddingFieldProps> = ({
  fieldId,
  effectiveValue,
  onValue,
}) => {
  let [expanded, setExpanded] = useState(false);

  useEffect(() => {
    if (
      effectiveValue.top !== effectiveValue.right ||
      effectiveValue.top !== effectiveValue.left ||
      effectiveValue.top !== effectiveValue.bottom
    ) {
      setExpanded(true);
    }
  }, [effectiveValue]);
  effectiveValue = effectiveValue || { top: 0, right: 0, bottom: 0, left: 0 };

  let setAll = (v: number) => onValue({ top: v, right: v, bottom: v, left: v });

  return (
    <div className={styles.field}>
      {!expanded && (
        <TextWidget
          id={fieldId}
          type="number"
          validator={numberValidator({ min: -45, max: 45 })}
          suffix="%"
          onChange={(value) => setAll(Number(value))}
          value={`${effectiveValue.top}`}
        />
      )}
      {expanded && (
        <>
          {["top", "right", "bottom", "left"].map((side) => (
            <Tooltip
              key={side}
              tooltip={side.charAt(0).toUpperCase() + side.substring(1)}
            >
              <TextWidget
                id={side === "top" ? fieldId : undefined}
                type="number"
                validator={numberValidator({ min: -45, max: 45 })}
                suffix="%"
                title={side.charAt(0).toUpperCase() + side.substring(1)}
                onChange={(value) =>
                  onValue({ ...effectiveValue, [side]: value })
                }
                value={`${
                  effectiveValue[
                    side as keyof PaddingFieldProps["effectiveValue"]
                  ]
                }`}
              />
            </Tooltip>
          ))}
        </>
      )}
      <Tooltip tooltip={expanded ? "Unify padding" : "Customize padding"}>
        <button
          className={cn(peStyles.button, peStyles.iconButton, {
            [peStyles.isChecked]: expanded,
          })}
          aria-label={expanded ? "Unify padding" : "Customize padding"}
          onClick={() => {
            setAll(effectiveValue.top);
            setExpanded(!expanded);
          }}
        >
          <i className="material-icons">more_horiz</i>
        </button>
      </Tooltip>
    </div>
  );
};
