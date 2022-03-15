import pkg from './package.json'
import commonjs from '@rollup/plugin-commonjs'
import json from '@rollup/plugin-json'

export default {
  input: 'src/index.js',
  output: [{ file: pkg.main, format: 'cjs' }],
  plugins: [
    json(),
    commonjs({
      dynamicRequireTargets: [
        'data-contracts/ABIs/*.json',
        'eth-contracts/ABIs/*.json'
      ]
    })
  ],
  external: [
    '@audius/hedgehog',
    '@certusone/wormhole-sdk',
    '@ethersproject/solidity',
    '@solana/spl-token',
    '@solana/web3.js',
    'ajv',
    'async-retry',
    'axios',
    'borsh',
    'bs58',
    'elliptic',
    'esm',
    'eth-sig-util',
    'ethereumjs-tx',
    'ethereumjs-util',
    'ethereumjs-wallet',
    'ethers',
    'ethers/lib/utils',
    'ethers/lib/index',
    'form-data',
    'hashids',
    'jsonschema',
    'lodash',
    'node-localstorage',
    'proper-url-join',
    'semver',
    'web3',
    'xmlhttprequest',
    'abi-decoder',
    'bn.js',
    'keccak256',
    'secp256k1',
    'assert',
    'util',
    'hashids/cjs',
    'safe-buffer'
  ]
}
