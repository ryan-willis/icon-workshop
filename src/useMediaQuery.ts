import { useState, useLayoutEffect } from "react";

export function useMediaQuery(query: string) {
  const [isActive, setActive] = useState(false);

  useLayoutEffect(() => {
    const mql = window.matchMedia(query);
    const onChange = (e: MediaQueryListEvent) => setActive(!!e.matches);
    setActive(!!mql.matches);
    mql.addEventListener("change", onChange);
    return () => mql.removeEventListener("change", onChange);
  }, [query, setActive]);

  return isActive;
}
