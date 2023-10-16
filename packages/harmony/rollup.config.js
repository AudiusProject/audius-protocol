import svgr from '@svgr/rollup'
import postcssCustomProperties from 'postcss-custom-properties'
import copy from 'rollup-plugin-copy'
import json from 'rollup-plugin-json'
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
      sourcemap: true,
      preserveModules: true
    }
  ],
  plugins: [
    external(),
    json(),
    postcss({
      plugins: [
        postcssCustomProperties({
          // Preserve var names so they can be overridden
          preserve: true,
          importFrom: [
            'src/assets/styles/reset.css',
            'src/assets/fonts/avenir.css',
            'src/assets/styles/fonts.css',
            'src/assets/styles/spacing.css',
            'src/assets/styles/colors.css',
            'src/assets/styles/tokens.css',
            'src/assets/styles/animations.css',
            'src/assets/styles/border-radius.css',
            'src/assets/styles/shadows.css'
          ]
        })
      ],
      minimize: true,
      extract: 'dist/harmony.css',
      modules: true
    }),
    url(),
    svgr(),
    rollupTypescript({
      clean: true,
      typescript
    }),
    copy({
      targets: [{ src: 'src/assets/fonts/avenir.css', dest: 'dist' }]
    })
  ]
}
