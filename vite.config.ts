import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import { readFileSync } from "fs";
try {
  (readFileSync(".env.production")
    .toString()
    .match(/VITE_HEADER_TAGS/)
    ? () => void 0
    : () => {
        throw new Error("");
      })();
} catch (e) {
  process.env.VITE_HEADER_TAGS = "";
}
export default defineConfig({
  plugins: [react()],
});
