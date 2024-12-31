module.exports = {
  template: require('../../svgr-template'),
  titleProp: true,
  descProp: true,
  replaceAttrValues: {
    '#FF0000': '{props.fillcolor}',
    '#000': '{props.fill}',
    '#f00': '{props.fillSecondary}'
  }
}
