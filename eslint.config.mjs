import nextCoreWebVitals from "eslint-config-next/core-web-vitals";
import nextTypeScript from "eslint-config-next/typescript";

const eslintConfig = [
  ...nextCoreWebVitals,
  ...nextTypeScript,
  {
    ignores: [
      ".next/**",
      "build/**",
      "coverage/**",
      "next-env.d.ts",
      "out/**",
      "playwright-report/**",
      "test-results/**",
    ],
    rules: {
      "react-hooks/set-state-in-effect": "warn",
    },
  },
];

export default eslintConfig;
