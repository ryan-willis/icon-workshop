import cn from "classnames";
import { FC, KeyboardEventHandler, useEffect, useMemo, useState } from "react";
import { SelectWidget } from "../widgets/SelectWidget";
import styles from "./ClipartField.module.scss";
import { ICON_SETS } from "./iconsets";

interface ClipartFieldProps {
  fieldId: string;
  effectiveValue: { set: string; icon: string };
  onValue: (value: { set: string; icon: string }) => void;
}

export const ClipartField: FC<ClipartFieldProps> = ({
  fieldId,
  effectiveValue,
  onValue,
}) => {
  const [filter, setFilter] = useState("");
  const [focusedItem, setFocusedItem] = useState<string | null>(
    ICON_SETS.default.inventory[0]
  );

  let { set: effectiveSet } = effectiveValue || {};
  const { icon: effectiveIcon } = effectiveValue || {};
  effectiveSet = effectiveSet || "default";
  const iconSetInfo = ICON_SETS[effectiveSet as keyof typeof ICON_SETS];
  const filteredClipartNames = useMemo(
    () =>
      iconSetInfo.inventory.filter(
        (name) =>
          !filter || name.toLowerCase().indexOf(filter.toLowerCase()) >= 0
      ),
    [filter, iconSetInfo.inventory]
  );

  useEffect(() => {
    if (filteredClipartNames.indexOf(effectiveIcon) >= 0) {
      setFocusedItem(effectiveIcon);
    } else if (filteredClipartNames.length) {
      setFocusedItem(filteredClipartNames[0]);
    } else {
      setFocusedItem(null);
    }
  }, [filteredClipartNames, effectiveIcon]);

  const handleIconKeyDown: KeyboardEventHandler<HTMLButtonElement> = (ev) => {
    switch (ev.key) {
      case "ArrowLeft":
      case "ArrowRight": {
        const sibling =
          ev.key === "ArrowLeft"
            ? ev.currentTarget.previousSibling
            : ev.currentTarget.nextSibling;
        if (sibling && sibling instanceof HTMLElement) sibling.focus();
        ev.preventDefault();
        break;
      }
      case "ArrowUp":
      case "ArrowDown": {
        const nr = ev.currentTarget.getBoundingClientRect();
        const centerX = (nr.left + nr.right) / 2;
        let sibling = ev.currentTarget;
        for (;;) {
          const nextSibling =
            ev.key === "ArrowUp"
              ? sibling.previousSibling
              : sibling.nextSibling;
          if (!nextSibling) {
            sibling.focus();
            break;
          }
          sibling = nextSibling as HTMLButtonElement;
          const sr = sibling.getBoundingClientRect();
          if (sr.left <= centerX && centerX <= sr.right) {
            sibling.focus();
            break;
          }
        }
        ev.preventDefault();
        break;
      }
      default:
        break;
    }
  };
  // TODO: keyboard navigation
  return (
    <div className={styles.field}>
      <div className={styles.toolbar}>
        <input
          id={fieldId}
          type="search"
          value={filter}
          onInput={(ev) => setFilter(ev.currentTarget.value)}
          className={styles.search}
          placeholder="Search"
        />
        <SelectWidget
          borderless
          className={styles.setSelector}
          onChange={(set) => onValue({ set, icon: effectiveIcon })}
          value={effectiveSet}
          options={[
            ["default", "Filled"],
            ["outlined", "Outline"],
            ["round", "Round"],
          ]}
        />
      </div>
      <div className={styles.grid}>
        {filteredClipartNames.map((name) => (
          <button
            key={name}
            tabIndex={focusedItem === name ? 0 : -1}
            title={name}
            onKeyDown={handleIconKeyDown}
            onFocus={() => setFocusedItem(name)}
            className={cn(styles.item, {
              [styles.isSelected]: effectiveIcon === name,
            })}
            onClick={() => onValue({ set: effectiveSet, icon: name })}
          >
            <i
              className={iconSetInfo.className}
              style={{
                fontFamily: `"${iconSetInfo.family}", "Material Icons"`,
              }}
            >
              {name}
            </i>
          </button>
        ))}
        {!filteredClipartNames.length && (
          <div className={styles.noResults}>
            No results for <b>{filter}</b>
          </div>
        )}
      </div>
    </div>
  );
};
