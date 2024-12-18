module.exports = {
  ...require('prettier-config-standard'),
  bracketSameLine: false,
  jsxSingleQuote: true,
  overrides: [{ files: '*.mdx', options: { parser: 'mdx' } }]
}
