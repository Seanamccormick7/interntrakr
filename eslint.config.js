import js from "@eslint/js";
import nodePlugin from "eslint-plugin-n";
import promisePlugin from "eslint-plugin-promise";

export default [
  js.configs.recommended,
  nodePlugin.configs["flat/recommended"],
  promisePlugin.configs["flat/recommended"],
  {
    languageOptions: {
      ecmaVersion: "latest",
      sourceType: "module",
      globals: {
        // Node globals
        process: "readonly",
        __dirname: "readonly",
        __filename: "readonly",
        // Browser globals
        window: "readonly",
        document: "readonly",
      },
    },
    ignores: ["dist/**", "node_modules/**"],
  },
];
