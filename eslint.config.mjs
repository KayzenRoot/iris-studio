import js from "@eslint/js";
import nextPlugin from "@next/eslint-plugin-next";
import { defineConfig, globalIgnores } from "eslint/config";
import globals from "globals";
import reactHooks from "eslint-plugin-react-hooks";
import tseslint from "typescript-eslint";

export default defineConfig([
  js.configs.recommended,
  ...tseslint.configs.recommended,
  reactHooks.configs.flat.recommended,
  {
    files: ["**/*.{js,mjs,ts,tsx}"],
    plugins: { "@next/next": nextPlugin },
    rules: {
      ...nextPlugin.configs.recommended.rules,
      ...nextPlugin.configs["core-web-vitals"].rules,
    },
  },
  {
    files: ["src/app/**/*.{ts,tsx}"],
    languageOptions: { globals: globals.browser },
  },
  {
    files: [
      "src/server/**/*.ts",
      "src/app/api/**/*.ts",
      "tests/**/*.ts",
      "scripts/**/*.mjs",
      "*.config.{mjs,mts,ts}",
    ],
    languageOptions: { globals: globals.node },
  },
  globalIgnores([
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
    "playwright-report/**",
    "test-results/**",
  ]),
]);
