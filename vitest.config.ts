import { defineConfig } from "vitest/config";
import { resolve } from "path";

export default defineConfig({
  test: {
    environment: "node",
    include: ["tests/**/*.test.ts"],
  },
  resolve: {
    // Stejný alias jako v tsconfig: @/* → kořen projektu
    alias: { "@": resolve(__dirname, ".") },
  },
});
