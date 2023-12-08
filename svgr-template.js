const template = (variables, { tpl }) => {
  return tpl`
${variables.imports};
import {useTheme} from '@emotion/react'

${variables.interfaces};

const ${variables.componentName} = (${variables.props}) => {
  const theme = useTheme()
  let {
    color,
    size,
    sizeH,
    sizeW,
    height: heightProp,
    width: widthProp,
    ...other
  } = props

  const height = heightProp ?? theme.iconSizes[sizeH ?? size]
  if (height) {
    other.height = height 
  }

  const width = widthProp ?? theme.iconSizes[sizeW ?? size]
  if (width) {
    other.width = width
  }

  const fillColor = other.fill ?? theme.color.icon[color] ?? 'red'

  props = {...other, fillColor}

  return (${variables.jsx})
};

${variables.exports};
`
}

module.exports = template
