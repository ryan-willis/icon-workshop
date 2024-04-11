import classnames from "classnames";
import { FC, useEffect, useRef, useState } from "react";
import styles from "./Splitter.module.scss";

const keyToLocalStorageKey = (storageKey: string) =>
  `Splitter_${storageKey}_value`;

interface SplitterProps {
  style?: any;
  className?: string;
  min?: number;
  max?: number;
  thickness?: number;
  storageKey?: string;
  children: any;
  onResize?: (value: number) => void;
}

export const Splitter: FC<SplitterProps> = ({
  style,
  className,
  min = 0,
  max = 100,
  thickness = 12,
  storageKey,
  children,
  onResize = (_: number) => {},
}) => {
  let splitterRef = useRef<HTMLDivElement | null>(null);
  let [dragging, setDragging] = useState(false);

  useEffect(() => {
    if (storageKey) {
      let storedValue = localStorage.getItem(keyToLocalStorageKey(storageKey))!;
      if (storedValue !== null) {
        onResize(constrain(min, max, parseFloat(storedValue)));
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [max, min, storageKey]);

  useEffect(() => {
    if (!dragging) {
      return;
    }

    let bounds = document.body.getBoundingClientRect();
    let splitterWidth = splitterRef.current!.offsetWidth;

    let move_ = (evt: PointerEvent) => {
      let value =
        (100 * (evt.clientX - splitterWidth / 2 - bounds.left)) / bounds.width;
      value = constrain(min, max, value);
      onResize(value);
      storageKey &&
        localStorage.setItem(
          keyToLocalStorageKey(storageKey),
          value.toFixed(2)
        );
    };

    let up_ = () => setDragging(false);

    window.addEventListener("pointermove", move_, false);
    window.addEventListener("pointerup", up_, false);

    return () => {
      window.removeEventListener("pointermove", move_, false);
      window.removeEventListener("pointerup", up_, false);
    };
  }, [dragging, max, min, onResize, storageKey]);

  return (
    <>
      {dragging && <div className={styles.scrim} />}
      <div
        ref={splitterRef}
        className={classnames(styles.splitter, className, {
          [styles.isDragging]: dragging,
        })}
        style={{
          ...(style || {}),
          "--splitter-thickness": `${thickness}px`,
        }}
        onPointerDown={() => setDragging(true)}
      >
        {children}
      </div>
    </>
  );
};

function constrain(min: number, max: number, value: number): number {
  return Math.max(min, Math.min(value, max));
}
