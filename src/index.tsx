import { createRoot } from "react-dom/client";
import "./index.scss";
import App from "./App";

// do this at the root to avoid flash of un-layout'd content
(() => {
  let update = () =>
    document.documentElement.style.setProperty(
      "--vh",
      `${window.innerHeight / 100}px`
    );
  update();
  window.addEventListener("resize", update, false);
})();

createRoot(document.getElementById("root")!).render(<App />);
