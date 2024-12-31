module.exports = {
  template: require('../../svgr-template'),
  titleProp: true,
  descProp: true,
  replaceAttrValues: {
    red: '{props.fillcolor}',
    '#FF0000': '{props.fillcolor}'
  }
}
