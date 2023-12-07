module.exports = {
  template: require('./svgr-template'),
  dimensions: false,
  replaceAttrValues: {
    '#FF0000': '{props.fill}',
    '#ff0000': '{props.fill}',
    red: '{props.fill}',
    '#000': '{props.fill}',
    '#f00': '{props.fillSecondary}'
  }
}
