module.exports = {
  env: {
    browser: true,
    es6: true
  },
  extends: ['audius'],
  // settings: {
  //   'import/resolver': {
  //     // NOTE: sk - These aliases are required for the import/order rule.
  //     // We are using the typescript baseUrl to do absolute import paths
  //     // relative to /src, which eslint can't tell apart from 3rd party deps
  //     alias: {
  //       map: [
  //         ['components', './src/components'],
  //       ],
  //       extensions: ['.ts', '.tsx', '.js', '.jsx', '.json']
  //     }
  //   }
  // },
}
