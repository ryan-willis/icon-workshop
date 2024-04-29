import { useEffect, useRef } from "react";

interface Signal {
  cancel: boolean;
}

interface AsyncDebouncedEffectOptions {
  delay: number;
  leadingEdge?: boolean;
  immediate?: boolean | (() => boolean);
}

export function useAsyncDebouncedEffect<T>(
  fn: (s: Signal) => Promise<void>,
  { delay, immediate, leadingEdge }: AsyncDebouncedEffectOptions,
  deps: T[] = []
) {
  const lastCompleteRef = useRef(0);

  useEffect(() => {
    const signal: Signal = { cancel: false };
    let imm = leadingEdge
      ? Number(new Date()) - lastCompleteRef.current > delay
      : false;
    if (immediate !== undefined) {
      imm =
        imm || (typeof immediate === "function" ? immediate() : !!immediate);
    }
    const timeout = setTimeout(
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
  }, deps);
}
