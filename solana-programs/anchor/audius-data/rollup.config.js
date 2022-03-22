import commonjs from '@rollup/plugin-commonjs'
import json from '@rollup/plugin-json'
import resolve from '@rollup/plugin-node-resolve'
import typescript from '@rollup/plugin-typescript'

import pkg from './package.json'

const extensions = ['.js', '.ts']

export default {
  input: 'lib/lib.ts',
  output: [{ file: pkg.main, format: 'cjs' }],
  plugins: [
    commonjs({ extensions }),
    json(),
    resolve({ extensions, preferBuiltins: true }),
    typescript({include: ["./lib/lib.ts", "./lib/utils.ts"]})
  ],
  external: [
    "@project-serum/anchor",
    "@solana/web3.js",
    "web3-core",
    "secp256k1", 
    "bn.js",
    "crypto", 
    "keccak256",
    "readable-stream"
  ] 
}
