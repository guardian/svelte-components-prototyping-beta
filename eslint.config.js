import js from "@eslint/js"
import globals from "globals"
import prettierConfig from "eslint-config-prettier"
import react from "eslint-plugin-react"
import hooks from "eslint-plugin-react-hooks"
import svelte from "eslint-plugin-svelte"

export default [
  {
    ignores: ["build/**/*"],
  },
  {
    ...js.configs.recommended,
    rules: {
      "prefer-rest-params": "error",
      "no-unused-vars": "error",
    },
  },
  ...svelte.configs["flat/recommended"],
  ...svelte.configs["flat/prettier"],
  {
    ...react.configs.flat.recommended,
    ...react.configs.flat["jsx-runtime"],
    files: ["**/*.{js,jsx,ts,tsx}"],
    languageOptions: {
      ecmaVersion: "latest",
      sourceType: "module",
      globals: { ...globals.browser, ...globals.node },
      parserOptions: {
        ecmaFeatures: {
          modules: true,
          impliedStrict: true,
          jsx: true,
        },
      },
    },
    settings: {
      react: {
        pragma: "h",
        version: "16.0",
      },
    },
    plugins: { "react-hooks": hooks },
    rules: {
      ...hooks.configs.recommended.rules,
      "react/prop-types": "off",
      "react-hooks/exhaustive-deps": "error",
    },
  },
  prettierConfig,
]
