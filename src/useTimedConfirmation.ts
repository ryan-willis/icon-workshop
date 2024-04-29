import { useEffect, useState } from "react";

export const useTimedConfirmation = (
  delayMs = 3000
): [boolean, () => void, () => void] => {
  const [on, setOn] = useState(false);

  useEffect(() => {
    if (!on) {
      return;
    }

    const timeout = window.setTimeout(() => setOn(false), delayMs);
    return () => window.clearTimeout(timeout);
  }, [on, delayMs]);

  return [on, () => setOn(true), () => setOn(false)];
};
