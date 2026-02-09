import tseslint from "typescript-eslint";
import eslintConfigPrettier from "eslint-config-prettier";

/** @type {import("eslint").Linter.Config[]} */
export default [
  ...tseslint.configs.recommended,
  eslintConfigPrettier,
  {
    rules: {
      // Enforce explicit return types on exported functions for API contracts
      "@typescript-eslint/explicit-function-return-type": [
        "warn",
        { allowExpressions: true },
      ],
      // Disallow `any` — we want strong typing throughout
      "@typescript-eslint/no-explicit-any": "error",
      // Unused vars are errors, but allow underscore-prefixed (intentional ignores)
      "@typescript-eslint/no-unused-vars": [
        "error",
        { argsIgnorePattern: "^_", varsIgnorePattern: "^_" },
      ],
      // Prefer const declarations
      "prefer-const": "error",
      // No console in production code (use a logger)
      "no-console": "warn",
    },
  },
  {
    ignores: ["dist/", "node_modules/", "coverage/", "*.js", "*.mjs"],
  },
];
