const webImports = `
  import {css, cx} from '@emotion/css'
`

const nativeImports = `
  import {css} from '@emotion/native'
`

const webStyles = `
  const {className: classNameProp} = other
  const className = css({
     filter: shadow ? theme.shadows.drop : undefined,
     minHeight: height,
     minWidth: width
  })
  other.className = cx(className, classNameProp)
`

const nativeStyles = `
  const {style: styleProp} = other
  const style = shadow ? css(theme.shadows[shadow]) : undefined
  other.style = style ? [style, styleProp] : styleProp
`

const template = (variables, { tpl, options }) => {
  const { native } = options
  return tpl`
${variables.imports};
import {useTheme} from '@emotion/react'
import {forwardRef} from 'react'
${native ? nativeImports : webImports}

${variables.interfaces};

const ${variables.componentName} = forwardRef((${variables.props}, ref) => {
  const theme = useTheme()
  let {
    color,
    size,
    sizeH,
    sizeW,
    height: heightProp,
    width: widthProp,
    shadow,
    ...other
  } = props

  const height = heightProp ?? theme.iconSizes?.[sizeH ?? size]
  if (height) {
    other.height = height 
  }

  const width = widthProp ?? theme.iconSizes?.[sizeW ?? size]
  if (width) {
    other.width = width
  }

  const fillColor = other.fill ?? theme.color?.icon[color] ?? 'red'

  ${native ? nativeStyles : webStyles}

  props = {...other, ref, fillColor}

  return (${variables.jsx})
});

${variables.exports};
`
}

module.exports = template
