import { useState, useEffect } from "react";

export function useModalRootNode(container = document.body) {
  let [modalRoot] = useState(() => document.createElement("div"));

  useEffect(() => {
    container.appendChild(modalRoot);
    return () => {
      container.removeChild(modalRoot);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return modalRoot;
}
