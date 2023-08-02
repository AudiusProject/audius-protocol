const typescript = require("@rollup/plugin-typescript");
const pkg = require("./package.json");

module.exports = [
  {
    input: "src/index.ts",
    output: [
      { file: pkg.main, format: "cjs", exports: "auto", sourcemap: true },
    ],
    plugins: [typescript()],
    external: Object.keys(pkg.devDependencies),
  },
];
