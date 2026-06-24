/* Configuración base de ESLint para el frontend (React 18 + TypeScript + Vite). */
module.exports = {
  root: true,
  env: { browser: true, es2021: true, node: true },
  parser: "@typescript-eslint/parser",
  parserOptions: {
    ecmaVersion: "latest",
    sourceType: "module",
    ecmaFeatures: { jsx: true },
  },
  plugins: ["@typescript-eslint"],
  extends: ["eslint:recommended", "plugin:@typescript-eslint/recommended"],
  ignorePatterns: ["dist", "node_modules", "*.config.ts", "*.cjs"],
  rules: {
    // El proyecto usa `any` puntualmente en respuestas de API; no bloquear el build.
    "@typescript-eslint/no-explicit-any": "off",
    // Variables/args sin usar: advertir, ignorando los prefijados con "_".
    "@typescript-eslint/no-unused-vars": [
      "warn",
      { argsIgnorePattern: "^_", varsIgnorePattern: "^_" },
    ],
    "no-unused-vars": "off",
  },
};
