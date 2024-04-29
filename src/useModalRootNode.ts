import { useState, useEffect } from "react";

export function useModalRootNode(container = document.body) {
  const [modalRoot] = useState(() => document.createElement("div"));

  useEffect(() => {
    container.appendChild(modalRoot);
    return () => {
      container.removeChild(modalRoot);
    };
  }, []);

  return modalRoot;
}
