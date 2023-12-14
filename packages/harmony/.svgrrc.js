module.exports = {
  template: require('../../svgr-template'),
  replaceAttrValues: {
    red: '{props.fillColor}',
    '#FF0000': '{props.fillColor}'
  }
}
