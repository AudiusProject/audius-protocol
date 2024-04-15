module.exports = {
  template: require('../../svgr-template'),
  titleProp: true,
  descProp: true,
  replaceAttrValues: {
    '#FF0000': '{props.fillColor}',
    '#000': '{props.fill}',
    '#f00': '{props.fillSecondary}'
  }
}
