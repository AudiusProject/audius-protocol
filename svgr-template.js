const template = (variables, { tpl }) => {
  return tpl`
${variables.imports};
import {useTheme} from '@emotion/react'

${variables.interfaces};

const ${variables.componentName} = (${variables.props}) => {
  const theme = useTheme()
  const {
    color,
    size,
    sizeH,
    sizeW,
    height: heightProp,
    width: widthProp,
    fill: fillProp,
    ...other
  } = props

  const height = heightProp ?? theme.iconSizes[sizeH ?? size ?? 'l']
  const width = widthProp ?? theme.iconSizes[sizeW ?? size ?? 'l']
  const fill = fillProp ?? theme.color.icon[color] ?? 'red'

  props = {...other, height, width, fill}

  return (${variables.jsx})
};

${variables.exports};
`
}

module.exports = template
