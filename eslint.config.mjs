// ESLint configuration for Next.js 16, React 19, TypeScript, and shadcn/ui
// Enforces best practices, code quality, and project conventions
// See: https://nextjs.org/docs/pages/building-your-application/configuring/eslint
import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals"; // Next.js recommended rules for web vitals
import nextTs from "eslint-config-next/typescript"; // Next.js TypeScript rules
import unusedImports from "eslint-plugin-unused-imports"; // Plugin to catch unused imports/vars
import tseslint from "@typescript-eslint/eslint-plugin"; // TypeScript-specific linting rules
import tsParser from "@typescript-eslint/parser"; // TypeScript parser for ESLint

// Compose ESLint config using Next.js presets and custom rules
const eslintConfig = defineConfig([
  ...nextVitals, // Core web vitals rules
  ...nextTs, // TypeScript rules
  // Ignore build output and env files from linting
  globalIgnores([
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
    "database.types.ts",
    "public/**",
    "node_modules/",
    "public/",
    ".vscode/",
    ".env*",
    "tsconfig.tsbuildinfo",
    "database.types.ts",
    "coverage/",
    "*.log",
  ]),

  {
    // Apply these rules to all TypeScript files
    files: ["**/*.{ts,tsx}"],
    plugins: {
      "unused-imports": unusedImports,
      "@typescript-eslint": tseslint,
    },
    languageOptions: {
      parser: tsParser,
      parserOptions: {
        project: true, // Use project tsconfig for type-aware linting
      },
    },
    rules: {
      // --- Unused code ---
      "no-unused-vars": "off", // Disable base rule in favor of TS/unused-imports
      "@typescript-eslint/no-unused-vars": "off", // Prefer unused-imports plugin
      "unused-imports/no-unused-imports": "error", // Error on unused imports
      "unused-imports/no-unused-vars": [
        "warn",
        {
          vars: "all", // Warn for all unused variables
          varsIgnorePattern: "^_", // Allow variables prefixed with _
          args: "after-used", // Warn for unused args after used ones
          argsIgnorePattern: "^_", // Allow args prefixed with _
        },
      ],

      // --- TypeScript strictness ---
      "@typescript-eslint/no-explicit-any": "warn", // Discourage use of 'any' type
      "@typescript-eslint/consistent-type-imports": [
        "warn",
        { prefer: "type-imports", fixStyle: "inline-type-imports" }, // Enforce consistent type-only imports
      ],
      "@typescript-eslint/no-import-type-side-effects": "error", // Prevent import type side effects
      "@typescript-eslint/no-non-null-assertion": "warn", // Discourage non-null assertions (!)
      "@typescript-eslint/no-unnecessary-condition": "warn", // Warn on unnecessary conditions
      "@typescript-eslint/no-floating-promises": "warn", // Warn if promises are not handled
      "@typescript-eslint/await-thenable": "error", // Error if await used on non-thenable
      "@typescript-eslint/no-misused-promises": "warn", // Warn on misused promise patterns
      "@typescript-eslint/consistent-type-assertions": [
        "warn",
        {
          assertionStyle: "as", // Prefer 'as' assertions
          objectLiteralTypeAssertions: "allow-as-parameter", // Allow 'as' in function params
        },
      ],

      // --- React best practices ---
      "react/self-closing-comp": "warn", // Warn if React components can be self-closed
      "react/jsx-no-useless-fragment": "warn", // Warn on unnecessary React fragments
      "react/jsx-curly-brace-presence": [
        "warn",
        { props: "never", children: "never" }, // Prefer no curly braces for props/children
      ],
      "react-hooks/rules-of-hooks": "error", // Enforce React hook rules
      "react-hooks/exhaustive-deps": "warn", // Warn if hook dependencies are incomplete

      // --- General code quality ---
      "no-console": ["warn", { allow: ["warn", "error"] }], // Warn on console.log, allow warn/error
      "prefer-const": "error", // Enforce const for variables that are never reassigned
      eqeqeq: ["error", "always", { null: "ignore" }], // Require === except for null comparisons
    },
  },
]);

// Export the composed ESLint config
export default eslintConfig;
