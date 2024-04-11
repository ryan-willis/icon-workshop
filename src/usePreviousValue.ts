import { useRef, useEffect } from "react";

export function usePreviousValue(val: any) {
  let ref = useRef();
  useEffect(() => {
    ref.current = val;
  }, [val]);
  return ref.current;
}
