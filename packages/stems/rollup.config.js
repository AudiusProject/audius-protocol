import svgr from '@svgr/rollup'
import postcssCustomProperties from 'postcss-custom-properties'
import commonjs from 'rollup-plugin-commonjs'
import copy from 'rollup-plugin-copy'
import resolve from 'rollup-plugin-node-resolve'
import external from 'rollup-plugin-peer-deps-external'
import postcss from 'rollup-plugin-postcss'
import rollupTypescript from 'rollup-plugin-typescript2'
import url from 'rollup-plugin-url'
import typescript from 'typescript'

import pkg from './package.json'

export default {
  input: 'src/index.ts',
  output: [
    {
      file: pkg.main,
      format: 'cjs',
      exports: 'named',
      sourcemap: true
    },
    {
      file: pkg.module,
      format: 'es',
      exports: 'named',
      sourcemap: true
    }
  ],
  plugins: [
    external(),
    postcss({
      plugins: [
        postcssCustomProperties({
          // Preserve var names so they can be overridden
          preserve: true,
          importFrom: ['src/assets/styles/colors.css']
        })
      ],
      minimize: true,
      extract: 'dist/stems.css',
      modules: true
    }),
    url(),
    svgr(),
    resolve(),
    rollupTypescript({
      rollupCommonJSResolveHack: true,
      clean: true,
      typescript
    }),
    commonjs({
      namedExports: {
        'node_modules/lodash/lodash.js': ['size', 'throttle']
      }
    }),
    copy({
      targets: [{ src: 'src/assets/fonts/avenir.css', dest: 'dist' }]
    })
  ]
}
