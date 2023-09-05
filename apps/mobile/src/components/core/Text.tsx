import { useMemo } from 'react'

import type { TextProps as RNTextProps } from 'react-native'
import { Text as RNText } from 'react-native'

import type { FontSize, FontWeight, typography } from 'app/styles'
import { makeStyles } from 'app/styles'

export type TextProps = RNTextProps & {
  variant?: keyof typeof typography
  noGutter?: boolean
  color?:
    | 'primary'
    | 'secondary'
    | 'neutral'
    | 'neutralLight4'
    | 'inherit'
    | 'error'
    | 'white'
  weight?: FontWeight
  fontSize?: FontSize | 'inherit'
}

const useStyles = makeStyles(
  (
    { typography, palette },
    { variant, noGutter, color, weight, fontSize }
  ) => ({
    root: {
      ...typography[variant],
      ...(color === 'inherit'
        ? null
        : color === 'error'
        ? { color: palette.accentRed }
        : { color: palette[color] }),
      ...(weight ? { fontFamily: typography.fontByWeight[weight] } : null),
      ...(fontSize && fontSize !== 'inherit'
        ? { fontSize: typography.fontSize[fontSize] }
        : null),
      ...(noGutter && { marginBottom: 0 })
    }
  })
)

export const Text = (props: TextProps) => {
  const {
    variant: variantProp,
    noGutter,
    style,
    color = 'neutral',
    weight,
    fontSize: fontSizeProp,
    ...other
  } = props
  const variant = variantProp ?? 'body'
  const fontSize = !fontSizeProp && !variantProp ? 'medium' : fontSizeProp

  const styleOptions = useMemo(
    () => ({ variant, noGutter, color, weight, fontSize }),
    [variant, noGutter, color, weight, fontSize]
  )

  const styles = useStyles(styleOptions)

  return <RNText style={[styles.root, style]} {...other} />
}
