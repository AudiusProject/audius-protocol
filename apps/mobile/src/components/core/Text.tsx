import { useMemo } from 'react'

import type {
  ColorValue,
  TextProps as RNTextProps,
  TextStyle
} from 'react-native'
import { Platform, Text as RNText } from 'react-native'

import type { FontSize, FontWeight, TextVariant } from 'app/styles'
import { makeStyles, typography } from 'app/styles'
import { spacing } from 'app/styles/spacing'
import type { ThemeColors } from 'app/utils/theme'
import { useThemePalette } from 'app/utils/theme'

export type TextProps = RNTextProps & {
  variant?: TextVariant
  noGutter?: boolean
  color?: 'inherit' | 'error' | 'warning' | keyof ThemeColors
  colorValue?: ColorValue
  weight?: FontWeight
  fontSize?: FontSize | 'inherit'
  textTransform?: TextStyle['textTransform']
}

const useStyles = makeStyles(({ typography, palette }) => ({
  root: {
    color: palette.neutral,
    fontSize: typography.fontSize.medium,
    fontFamily: typography.fontByWeight.medium
  }
}))

export const Text = (props: TextProps) => {
  const {
    variant: variantProp,
    noGutter,
    style,
    color = 'neutral',
    colorValue,
    weight,
    fontSize: fontSizeProp,
    textTransform,
    ...other
  } = props
  const variant = variantProp ?? 'body'
  const fontSize = !fontSizeProp && !variantProp ? 'medium' : fontSizeProp

  const styles = useStyles()
  const palette = useThemePalette()

  const customStyles = useMemo(
    () => [
      typography[variant],
      color !== 'inherit' && {
        color:
          color === 'error'
            ? palette.accentRed
            : color === 'warning'
            ? palette.accentOrange
            : colorValue ?? palette[color]
      },
      weight && {
        fontFamily: typography.fontByWeight[weight],
        // Fix for demibold's weird positioning
        marginTop:
          weight === 'demiBold' && Platform.OS === 'ios'
            ? spacing(fontSize === 'large' ? 1 : fontSize === 'small' ? 0.5 : 0)
            : undefined
      },
      fontSize &&
        fontSize !== 'inherit' && { fontSize: typography.fontSize[fontSize] },
      noGutter && { marginBottom: 0 },
      { textTransform }
    ],
    [
      variant,
      color,
      palette,
      colorValue,
      weight,
      fontSize,
      noGutter,
      textTransform
    ]
  )

  return <RNText style={[styles.root, customStyles, style]} {...other} />
}
