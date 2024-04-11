import cn from "classnames";
import { FC, ReactEventHandler, useEffect, useRef, useState } from "react";
// @ts-ignore
import SketchPicker from "react-color/lib/Sketch";
import { createPortal } from "react-dom";
import tinycolor from "tinycolor2";
import { useModalRootNode } from "../../useModalRootNode";
import styles from "./ColorWidget.module.scss";

const PRESET_COLORS = [
  "#f44336",
  "#e91e63",
  "#9c27b0",
  "#673ab7",
  "#3f51b5",
  "#2196f3",
  "#03a9f4",
  "#00bcd4",
  "#009688",
  "#4caf50",
  "#8bc34a",
  "#cddc39",
  "#ffeb3b",
  "#ffc107",
  "#ff9800",
  "#ff5722",
  "#9e9e9e",
  "#607d8b",
  "#ffffff",
  "#000000",
];

interface CheckersProps {
  className?: string;
}

const Checkers: FC<CheckersProps> = (props) => (
  <svg
    width="40"
    height="24"
    viewBox="0 0 40 24"
    fill="var(--color-ink)"
    fillOpacity="0.1"
    xmlns="http://www.w3.org/2000/svg"
    {...props}
  >
    <path
      fillRule="evenodd"
      d="M8 0H0V8H8V16H0V24H8V16H16V24H24V16H32V24H40V16H32V8H40V0H32V8H24V0H16V8H8V0ZM16 8V16H24V8H16Z"
    />
  </svg>
);

interface ColorWidgetProps {
  value: string;
  onChange: (value: string) => void;
  allowAlpha?: boolean;
  className?: string;
}

interface OpenState {
  left: number;
  top: number;
}

export const ColorWidget: FC<ColorWidgetProps> = ({
  className,
  value,
  onChange,
  allowAlpha = false,
  ...props
}) => {
  let [openState, setOpenState] = useState<OpenState | boolean>(false);
  let [color, setColor] = useState(tinycolor(value).toRgbString());
  let modalRoot = useModalRootNode();
  let blurTimeout = useRef<NodeJS.Timeout>();

  useEffect(() => setColor(tinycolor(value).toRgbString()), [value, setColor]);

  const showPicker: ReactEventHandler<HTMLDivElement> = (ev) => {
    let minVisibleHeight = 320 + (allowAlpha ? 16 : 0);
    let minVisibleWidth = 240;
    let v = ev.currentTarget.getBoundingClientRect();
    setOpenState({
      left: Math.min(
        v.left,
        document.documentElement.clientWidth - minVisibleWidth
      ),
      top: Math.min(
        v.top,
        document.documentElement.clientHeight - minVisibleHeight
      ),
    });
  };

  return (
    <div
      {...props}
      className={cn(className, styles.widget)}
      tabIndex={0}
      role="button"
      onKeyDown={(ev) => ev.code === "Enter" && showPicker(ev)}
      onClick={(ev) => showPicker(ev)}
    >
      <Checkers className={styles.checkers} />
      <div className={styles.color} style={{ backgroundColor: color }} />
      {openState &&
        createPortal(
          <>
            <div
              className={styles.scrim}
              onClick={(ev) => {
                setOpenState(false);
                ev.stopPropagation();
              }}
            />
            <div
              className={styles.popover}
              style={
                openState instanceof Object
                  ? { left: openState.left, top: openState.top }
                  : {}
              }
              ref={(n) => n && !n.contains(document.activeElement) && n.focus()}
              onKeyDown={(ev) => ev.code === "Escape" && setOpenState(false)}
              onFocus={() =>
                blurTimeout.current && clearTimeout(blurTimeout.current)
              }
              onBlur={() => {
                blurTimeout.current && clearTimeout(blurTimeout.current);
                blurTimeout.current = setTimeout(() => setOpenState(false));
              }}
              tabIndex={0}
            >
              <SketchPicker
                className={styles.picker}
                color={color}
                presetColors={PRESET_COLORS}
                disableAlpha={!allowAlpha}
                onChange={(color: any) => setColor(pickerColorToValue(color))}
                onChangeComplete={(color: any) =>
                  onChange(pickerColorToValue(color))
                }
              />
            </div>
          </>,
          modalRoot
        )}
    </div>
  );
};

function pickerColorToValue({ hex, rgb: { r, g, b, a } }: any) {
  return a === 1 ? hex : `rgba(${r}, ${g}, ${b}, ${a})`;
}
