import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";

const eslintConfig = defineConfig([
  ...nextVitals,
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
  ]),
  // Disable overly strict React Hooks rules for valid patterns
  {
    rules: {
      // Allow ref access in render for valid patterns (e.g., prevMediaRef)
      "react-hooks/refs": "off",
      // Allow setState in effects for hydration patterns
      "react-hooks/set-state-in-effect": "off",
      // Allow conditional hooks after early returns for hydration
      "react-hooks/rules-of-hooks": "warn",
      // Allow immutability violations for ref patterns
      "react-hooks/immutability": "off",
    },
  },
]);

export default eslintConfig;
