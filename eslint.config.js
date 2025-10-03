import js from "@eslint/js";
import nodePlugin from "eslint-plugin-n";
import promisePlugin from "eslint-plugin-promise";
import tseslint from "typescript-eslint";

export default [
  // Global ignores - must be first
  {
    ignores: [
      "**/dist/**",
      "**/node_modules/**",
      "**/build/**",
      "**/.next/**",
      "**/coverage/**",
    ],
  },

  // Base config for all JS/TS files
  js.configs.recommended,
  ...tseslint.configs.recommended,
  nodePlugin.configs["flat/recommended-script"],
  promisePlugin.configs["flat/recommended"],

  // Global settings
  {
    languageOptions: {
      ecmaVersion: "latest",
      sourceType: "module",
      globals: {
        // Node globals
        process: "readonly",
        __dirname: "readonly",
        __filename: "readonly",
        Buffer: "readonly",
        console: "readonly",
        // Browser globals (for web app)
        window: "readonly",
        document: "readonly",
        navigator: "readonly",
        localStorage: "readonly",
        sessionStorage: "readonly",
      },
    },
  },

  // TypeScript-specific config (with project)
  {
    files: ["apps/web/src/**/*.{ts,tsx}", "apps/api/src/**/*.ts"],
    languageOptions: {
      parser: tseslint.parser,
      parserOptions: {
        project: ["./apps/web/tsconfig.app.json", "./apps/api/tsconfig.json"],
      },
    },
    rules: {
      // Disable rules that conflict with TypeScript
      "n/no-missing-import": "off",
      "n/no-unsupported-features/es-syntax": "off",
    },
  },

  // TypeScript config files without project (vite.config.ts, etc.)
  {
    files: ["**/*.ts", "**/*.tsx"],
    ignores: ["apps/web/src/**/*", "apps/api/src/**/*"],
    languageOptions: {
      parser: tseslint.parser,
    },
    rules: {
      // Disable rules that conflict with TypeScript
      "n/no-missing-import": "off",
      "n/no-unsupported-features/es-syntax": "off",
    },
  },

  // React/Next.js specific (for apps/web)
  {
    files: ["apps/web/**/*.{ts,tsx,js,jsx}"],
    rules: {
      // Browser-specific, disable Node rules
      "n/no-unsupported-features/node-builtins": "off",
    },
  },

  // Node/API specific (for apps/api)
  {
    files: ["apps/api/**/*.{ts,js}"],
    rules: {
      // Node-specific rules
      "n/no-unpublished-import": "off",
    },
  },
];
