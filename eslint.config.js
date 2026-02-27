import js from "@eslint/js";
import tseslint from "typescript-eslint";
import reactHooks from "eslint-plugin-react-hooks";
import prettierConfig from "eslint-config-prettier";

export default tseslint.config(
  // Base JS rules
  js.configs.recommended,

  // TypeScript rules
  ...tseslint.configs.recommended,

  // React Hooks rules
  {
    plugins: { "react-hooks": reactHooks },
    rules: {
      ...reactHooks.configs.recommended.rules,
      // Downgrade immutability to warning (callback refs pattern is intentional)
      "react-hooks/immutability": "warn",
    },
  },

  // Prettier: disable formatting rules that conflict
  prettierConfig,

  // Project-specific overrides
  {
    rules: {
      // Allow explicit `any` in a few specific cases (e.g. AudioContext vendor prefix)
      "@typescript-eslint/no-explicit-any": "warn",
      // Allow unused vars prefixed with _ (conventional ignore pattern)
      "@typescript-eslint/no-unused-vars": ["error", { argsIgnorePattern: "^_" }],
    },
  },

  // Ignore generated / vendor files
  {
    ignores: ["dist/**", "node_modules/**", "vite.config.js.timestamp-*"],
  }
);
