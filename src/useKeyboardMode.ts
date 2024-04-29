import { useState, useEffect } from "react";

export const TRIGGER_KEYS = new Set([
  "Tab",
  "ArrowUp",
  "ArrowDown",
  "ArrowLeft",
  "ArrowRight",
  "Enter",
]);

export function useKeyboardMode(el: HTMLElement, className: string) {
  const [keyboardMode, setKeyboardMode] = useState(false);

  useEffect(() => {
    const mouseListener_ = () => {
      setKeyboardMode(false);
    };

    const keyListener_ = (ev: KeyboardEvent) => {
      if (TRIGGER_KEYS.has(ev.key)) {
        setKeyboardMode(true);
      }
    };

    window.addEventListener("mousedown", mouseListener_, true);
    window.addEventListener("keydown", keyListener_, true);

    return () => {
      window.removeEventListener("mousedown", mouseListener_, true);
      window.removeEventListener("keydown", keyListener_, true);
    };
  }, []);

  useEffect(() => {
    if (!el) {
      return;
    }

    el.classList.toggle(className, keyboardMode);
    return () => el.classList.remove(className);
  }, [keyboardMode, el, className]);

  return keyboardMode;
}
