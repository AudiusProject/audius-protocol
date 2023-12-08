module.exports = {
  template: require('../../svgr-template'),
  dimensions: false,
  replaceAttrValues: {
    red: '{props.fill}'
  }
}
