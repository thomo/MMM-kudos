import { defineConfig } from "eslint/config";
import globals from "globals";
import js from "@eslint/js";
import stylistic from "@stylistic/eslint-plugin";

export default defineConfig([
  {
    files: ["**/*.js", "**/*.mjs"],
    languageOptions: {
      ecmaVersion: "latest",
      globals: {
        ...globals.browser,
        ...globals.node,
        Log: "readonly",
        Module: "readonly",
        moment: "readonly",
      },
    },
    plugins: { js, stylistic },
    extends: ["js/recommended", "stylistic/recommended"],
    rules: {
      "@stylistic/brace-style": ["error", "1tbs", { allowSingleLine: true }],
      "@stylistic/comma-dangle": ["error", "only-multiline"],
      "@stylistic/max-statements-per-line": ["error", { max: 1 }],
      "@stylistic/quotes": ["error", "double"],
      "@stylistic/quote-props": ["error", "consistent-as-needed"],
      "@stylistic/semi": ["error", "always"],
      "@stylistic/semi-style": ["error", "last"],
    },
  },
]);
