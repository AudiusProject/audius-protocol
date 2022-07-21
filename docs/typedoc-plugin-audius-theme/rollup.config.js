import typescript from "@rollup/plugin-typescript";
import pkg from "./package.json";

export default [
  {
    input: "src/index.ts",
    output: [
      { file: pkg.main, format: "cjs", exports: "auto", sourcemap: true },
    ],
    plugins: [typescript()],
    external: Object.keys(pkg.devDependencies),
  },
];
