import svgr from '@svgr/rollup'
import postcssCustomProperties from 'postcss-custom-properties'
// import copy from 'rollup-plugin-copy'
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
          // TODO: KJ - Update these later
          importFrom: [
            // 'src/assets/styles/colors.css',
            // 'src/assets/styles/tokens.css',
            // 'src/assets/styles/spacing.css',
          ]
        })
      ],
      minimize: true,
      extract: 'dist/harmony.css',
      modules: true
    }),
    url(),
    svgr(),
    resolve(),
    rollupTypescript({
      clean: true,
      typescript
    }),
    // copy({
    //   targets: [{ src: 'src/assets/fonts/avenir.css', dest: 'dist' }]
    // })
  ]
}
