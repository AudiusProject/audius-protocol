const {
  identifier,
  jsxAttribute,
  jsxIdentifier,
  jsxExpressionContainer,
  isJSXElement
} = require('@babel/types')

const webImports = `
  import {css, cx} from '@emotion/css'
`

const nativeImports = `
  import {css} from '@emotion/native'
  import Animated from 'react-native-reanimated'
  import {Path as RNSVGPath} from 'react-native-svg'
  const AnimatedPath = Animated.createAnimatedComponent(RNSVGPath)
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

const updatePathElements = (element) => {
  if (element.openingElement && element.openingElement.name.name === 'path') {
    element.openingElement.attributes.push(
      jsxAttribute(
        jsxIdentifier('animatedProps'),
        jsxExpressionContainer(identifier('animatedProps'))
      )
    )
  }
  element.children = element.children.map((child) =>
    isJSXElement(child) ? updatePathElements(child) : child
  )
  return element
}

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
    animatedProps,
    ...other
  } = props

  const height = heightProp ?? theme.iconSizes?.[sizeH ?? size]
  if (height) {
    other.height = height 
  }

  const width = widthProp ?? theme.iconSizes?.[sizeW ?? size]

  if (width) {
    other.width = isNaN(width) ? "100%" : width
  }

  const fillColor = other.fill ?? theme.color?.icon[color] ?? 'red'

  ${native ? nativeStyles : webStyles}

  other.role = title ? 'img' : undefined
  other['aria-hidden'] = title ? undefined : true

  props = {...other, ref, fillColor}

  ${native ? `const Path = animatedProps ? AnimatedPath : RNSVGPath` : ''}

  return (${native ? updatePathElements(variables.jsx) : variables.jsx})
});

${variables.exports};
`
}

module.exports = template
