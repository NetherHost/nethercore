import globals from "globals";
import pluginJs from "@eslint/js";
import pluginPrettier from "eslint-plugin-prettier";

/** @type {import('eslint').Linter.Config[]} */
export default [
  // Base configuration for all JavaScript files
  {
    files: ["**/*.js"],
    languageOptions: {
      sourceType: "module", // Use ES Modules as default (better for modern JavaScript)
      ecmaVersion: 2022, // Use ES2022 features, including class fields, top-level await, etc.
      globals: {
        ...globals.node,
        ...globals.commonjs,
        ...globals.es2021, // This includes ES2021 features but will now support ES2022 as well.
      },
    },
  },

  // Base ESLint rules (from @eslint/js plugin)
  pluginJs.configs.recommended,

  // Prettier recommended configuration
  {
    plugins: {
      prettier: pluginPrettier,
    },
    rules: {
      "prettier/prettier": "error", // This will enable Prettier rules, ensuring consistent formatting
    },
  },

  // Custom rules
  {
    rules: {
      "no-console": ["warn", { allow: ["warn", "error"] }],
      "no-debugger": "warn",
      "no-duplicate-imports": "error",
      "no-unused-vars": [
        "warn",
        {
          argsIgnorePattern: "^_", // Ignore arguments starting with "_"
          varsIgnorePattern: "^_", // Ignore variables starting with "_"
          caughtErrorsIgnorePattern: "^_", // Ignore caught errors starting with "_"
        },
      ],
      eqeqeq: ["error", "always"], // Always use strict equality (===)
      "no-var": "error", // Enforce `let` and `const` over `var`
      "prefer-const": "warn", // Encourage `const` where possible
      "no-throw-literal": "error", // Avoid throwing literals as exceptions
      semi: ["error", "always"], // Require semicolons at the end of statements
      quotes: ["error", "double"], // Use double quotes for strings
      indent: ["error", 2], // Enforce 2-space indentation
      "comma-dangle": ["error", "always-multiline"], // Ensure trailing commas in multiline lists
      "arrow-body-style": ["warn", "as-needed"], // Only use braces for arrow functions when necessary
      "object-shorthand": "warn", // Encourage shorthand object notation
      "prefer-template": "warn", // Prefer template literals over string concatenation
      "prefer-destructuring": [
        "warn",
        {
          array: false, // Don't force array destructuring
          object: true, // Prefer object destructuring
        },
      ],
      "require-await": "warn", // Warn on functions that are marked async but don't use await
      "no-return-await": "warn", // Avoid unnecessary `return await`
      "no-try-catch-finally": "off", // Allow try/catch/finally (turn it off if you want flexibility here)
      "no-unused-expressions": [
        "error",
        {
          allowShortCircuit: true, // Allow short-circuit expressions
          allowTernary: true, // Allow ternary expressions
        },
      ],
    },
  },
];
