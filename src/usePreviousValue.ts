import { useRef, useEffect } from "react";

export function usePreviousValue<T>(val: T) {
  const ref = useRef<T>();
  useEffect(() => {
    ref.current = val;
  }, [val]);
  return ref.current;
}
