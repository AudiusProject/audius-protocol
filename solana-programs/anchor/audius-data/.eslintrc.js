module.exports = {
  root: true,
  parser: "@typescript-eslint/parser",
  parserOptions: {
    project: ["./tsconfig.json"],
  },
  plugins: ["@typescript-eslint", "mocha"],
  extends: [
    "standard",
    "eslint:recommended",
    "plugin:@typescript-eslint/recommended",
    "prettier",
    "prettier-standard/prettier-file",
    "plugin:mocha/recommended",
  ],
  env: {
    node: true,
  },
  rules: {
    "mocha/no-setup-in-describe": "off",
  },
};
