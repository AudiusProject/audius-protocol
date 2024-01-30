module.exports = {
  multipass: true,
  plugins: [
    {
      name: 'preset-default',
      params: {
        overrides: {
          // viewBox is required to resize SVGs with CSS.
          // @see https://github.com/svg/svgo/issues/1128
          removeViewBox: false,
          cleanupIds: {
            // cleanUpIds minification seems to sometimes generate duplicate IDs.
            // We disabled this so it now only uses the id that was in the SVG to begin with.
            minify: false
          }
        }
      }
    }
  ]
}
