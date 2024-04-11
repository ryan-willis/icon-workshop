import { useEffect, useState } from "react";

export const useTimedConfirmation = (
  delayMs = 3000
): [boolean, () => void, () => void] => {
  let [on, setOn] = useState(false);

  useEffect(() => {
    if (!on) {
      return;
    }

    let timeout = window.setTimeout(() => setOn(false), delayMs);
    return () => window.clearTimeout(timeout);
  }, [on, delayMs]);

  return [on, () => setOn(true), () => setOn(false)];
};
