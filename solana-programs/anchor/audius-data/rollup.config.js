import commonjs from '@rollup/plugin-commonjs'
import json from '@rollup/plugin-json'
import resolve from '@rollup/plugin-node-resolve'
import typescript from '@rollup/plugin-typescript'

import pkg from './package.json'

const dependencies = Object.keys(pkg.dependencies)
const devDependencies = Object.keys(pkg.devDependencies)

const extensions = ['.js', '.ts']

export default {
  input: 'lib/lib.ts',
  output: [{ file: pkg.main, format: 'cjs', exports: 'auto' }],
  plugins: [
    commonjs({ extensions }),
    json(),
    resolve({ extensions, preferBuiltins: true }),
    typescript({include: ["./lib/lib.ts", "./lib/utils.ts"]})
  ],
  external: [ ...dependencies, ...devDependencies ] 
}
