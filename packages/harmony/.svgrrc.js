module.exports = {
  template: require('../../svgr-template'),
  titleProp: true,
  descProp: true,
  replaceAttrValues: {
    red: '{props.fillColor}',
    '#FF0000': '{props.fillColor}'
  }
}
