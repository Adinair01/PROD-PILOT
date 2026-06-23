const js = require("@eslint/js");
const globals = require("globals");
const prettier = require("eslint-config-prettier");

/**
 * Backend ESLint config (CommonJS / Node). The frontend has its own flat config
 * under frontend/. Only backend and tests are linted from the repo root.
 */
module.exports = [
  {
    ignores: ["frontend/**", "node_modules/**", "**/dist/**"],
  },
  js.configs.recommended,
  {
    files: ["backend/**/*.js", "tests/**/*.js", "*.config.js"],
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: "commonjs",
      globals: { ...globals.node },
    },
    rules: {
      "no-unused-vars": ["error", { argsIgnorePattern: "^_", caughtErrors: "none" }],
      "no-console": ["warn", { allow: ["error", "warn"] }],
    },
  },
  {
    // Test files use Vitest globals and ESM imports.
    files: ["tests/**/*.js", "vitest.config.js", "frontend/vite.config.js"],
    languageOptions: {
      sourceType: "module",
      globals: { ...globals.node },
    },
    rules: {
      "no-console": "off",
    },
  },
  prettier,
];
