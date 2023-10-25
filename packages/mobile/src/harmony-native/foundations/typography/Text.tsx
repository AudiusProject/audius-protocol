import type { TextProps as TextPropsBase, TextStyle } from 'react-native'
import { Text as TextBase } from 'react-native'

import { makeStyles, useTheme } from '../theme'
import type { HarmonyTheme } from '../theme/theme'

export type TextProps = TextPropsBase & {
  variant?: TextVariant
  size?: TextSize
  strength?: TextStrength
  color?: TextColor
}

export type TextStrength = 'weak' | 'default' | 'strong'

export type TextColor =
  | 'heading'
  | 'default'
  | 'subdued'
  | 'disabled'
  | 'danger'
  | 'warning'

export type TextSize = 'xl' | 'l' | 'm' | 's' | 'xs'

export type TextVariant = 'display' | 'heading' | 'title' | 'label' | 'body'

type VariantConfig = {
  variant: TextVariant
  fontSize: Record<string, string>
  lineHeight: Record<string, string>
  fontWeight: Record<string, string>
  style?: TextStyle
}

const generateVariantStyles = (config: VariantConfig, theme: HarmonyTheme) => {
  const { variant, fontSize, lineHeight, fontWeight, style } = config
  const { typography } = theme
  const fontSizeKeys = Object.keys(fontSize)
  const fontWeightKeys = Object.keys(fontWeight)

  const variants: Record<string, TextStyle> = {}
  for (const fontSizeKey of fontSizeKeys) {
    for (const fontWeightKey of fontWeightKeys) {
      const variantKey = `${variant}-${fontSizeKey}-${fontWeightKey}`
      variants[variantKey] = {
        fontSize: typography.size[fontSize[fontSizeKey]],
        lineHeight: typography.lineHeight[lineHeight[fontSizeKey]],
        fontWeight: typography.weight[fontWeight[fontWeightKey]],
        ...style
      }
    }
  }
  return variants
}

const useStyles = makeStyles((theme) => {
  const displayConfig = {
    variant: 'display' as const,
    fontSize: { s: '6xl', m: '7xl', l: '8xl', xl: '9xl' },
    lineHeight: { s: '3xl', m: '4xl', l: '5xl', xl: '6xl' },
    fontWeight: { default: 'bold', strong: 'heavy' }
  }

  const headingConfig = {
    variant: 'heading' as const,
    fontSize: { s: 'xl', m: '2xl', l: '3xl', xl: '3xl' },
    lineHeight: { s: 'l', m: 'xl', l: 'xl', xl: 'xl' },
    fontWeight: { default: 'bold', strong: 'heavy' }
  }

  const titleConfig = {
    variant: 'title' as const,
    fontSize: { xs: 'xs', s: 's', m: 'm', l: 'l' },
    lineHeight: { xs: 's', s: 's', m: 'm', l: 'l' },
    fontWeight: { weak: 'demiBold', default: 'bold', strong: 'heavy' }
  }

  const labelConfig = {
    variant: 'label' as const,
    fontSize: { xs: '2xs', s: 'xs', m: 's', l: 'm' },
    lineHeight: { xs: 's', s: 's', m: 'm', l: 'm' },
    fontWeight: { default: 'bold', strong: 'heavy' },
    style: { textTransform: 'uppercase' as const }
  }

  const bodyConfig = {
    variant: 'body' as const,
    fontSize: { xs: 'xs', s: 's', m: 'm', l: 'l' },
    lineHeight: { xs: 's', s: 'm', m: 'm', l: 'l' },
    fontWeight: { default: 'medium', strong: 'demiBold' }
  }

  return [
    displayConfig,
    headingConfig,
    titleConfig,
    labelConfig,
    bodyConfig
  ].reduce(
    (styles, config) => ({
      ...styles,
      ...generateVariantStyles(config, theme)
    }),
    {}
  )
})

export const Text = (props: TextProps) => {
  const {
    variant = 'body',
    size = 'm',
    strength = 'default',
    style: styleProp,
    color: colorProp = 'default',
    ...other
  } = props
  const styles = useStyles()
  const theme = useTheme()
  // TODO: make heading a proper gradient
  const color =
    colorProp === 'heading'
      ? theme.color.secondary.secondary
      : theme.color.textIcon[colorProp]

  const styleKey = `${variant}-${size}-${strength}`

  const isHeading = variant === 'display' || variant === 'heading'

  return (
    <TextBase
      style={[styleProp, styles[styleKey], color && { color }]}
      role={isHeading ? 'heading' : undefined}
      {...other}
    />
  )
}
