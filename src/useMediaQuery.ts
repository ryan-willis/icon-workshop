import { useState, useLayoutEffect } from "react";

export function useMediaQuery(query: string) {
  let [isActive, setActive] = useState(false);

  useLayoutEffect(() => {
    var mql = window.matchMedia(query);
    let onChange = (e: MediaQueryListEvent) => setActive(!!e.matches);
    setActive(!!mql.matches);
    mql.addEventListener("change", onChange);
    return () => mql.removeEventListener("change", onChange);
  }, [query, setActive]);

  return isActive;
}
