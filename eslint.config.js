const tsParser = require("@typescript-eslint/parser");
const tsPlugin = require("@typescript-eslint/eslint-plugin");
const prettierConfig = require("eslint-config-prettier");

module.exports = [
  prettierConfig,
  {
    files: ["src/**/*.ts"],
    languageOptions: {
      parser: tsParser,
      parserOptions: {
        project: "./tsconfig.json",
      },
    },
    plugins: {
      "@typescript-eslint": tsPlugin,
    },
    rules: {
      ...tsPlugin.configs.recommended.rules,
      "@typescript-eslint/no-explicit-any": "error", // Enforce user preference to avoid any types
      "@typescript-eslint/no-unused-vars": ["error", { "argsIgnorePattern": "^_" }], // Allow unused parameters starting with underscore
    },
  },
  {
    ignores: [
      "**/dist/**",
      "**/node_modules/**",
      "**/.yarn/**",
      "**/.pnp.*",
      "**/prisma/generated/**",
    ],
  },
];
