import { useEffect, useRef } from "react";

interface Signal {
  cancel: boolean;
}

interface AsyncDebouncedEffectOptions {
  delay: number;
  leadingEdge?: boolean;
  immediate?: boolean | (() => boolean);
}

// debounces on leading edge
export function useAsyncDebouncedEffect(
  fn: (s: Signal) => Promise<any>,
  { delay, immediate, leadingEdge }: AsyncDebouncedEffectOptions,
  deps: any[] = []
) {
  let lastCompleteRef = useRef(0);

  useEffect(() => {
    let signal: Signal = { cancel: false };
    let imm = leadingEdge
      ? Number(new Date()) - lastCompleteRef.current > delay
      : false;
    if (immediate !== undefined) {
      imm =
        imm || (typeof immediate === "function" ? immediate() : !!immediate);
    }
    let timeout = setTimeout(
      () => {
        fn(signal);
        lastCompleteRef.current = Number(new Date());
      },
      imm ? 0 : delay
    );
    return () => {
      clearTimeout(timeout);
      signal.cancel = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);
}
