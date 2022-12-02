import { useMemo } from 'react'

import type { TextProps as RNTextProps, TextStyle } from 'react-native'
import { Text as RNText } from 'react-native'
import type { SetRequired } from 'type-fest'

import type { FontSize, FontWeight, typography } from 'app/styles'
import { makeStyles } from 'app/styles'
import { spacing } from 'app/styles/spacing'

export type TextProps = RNTextProps & {
  variant?: keyof typeof typography
  noGutter?: boolean
  color?:
    | 'primary'
    | 'secondary'
    | 'neutral'
    | 'neutralLight4'
    | 'neutralLight2'
    | 'inherit'
    | 'error'
    | 'warning'
    | 'white'
  weight?: FontWeight
  fontSize?: FontSize | 'inherit'
  textTransform?: TextStyle['textTransform']
}

type StyleConfigKeys =
  | 'noGutter'
  | 'weight'
  | 'fontSize'
  | 'variant'
  | 'color'
  | 'textTransform'

type StyleConfig = Pick<
  SetRequired<TextProps, 'variant' | 'color'>,
  StyleConfigKeys
>

const useStyles = makeStyles<StyleConfig>(
  (
    { typography, palette },
    { variant, noGutter, color, weight, fontSize, textTransform }
  ) => ({
    root: {
      ...typography[variant],
      ...(color === 'inherit'
        ? null
        : {
            color:
              color === 'error'
                ? palette.accentRed
                : color === 'warning'
                ? palette.accentOrange
                : palette[color]
          }),
      ...(weight
        ? {
            fontFamily: typography.fontByWeight[weight],
            // Fix for demibold's weird positioning
            marginTop:
              weight === 'demiBold'
                ? spacing(
                    fontSize === 'large' ? 1 : fontSize === 'small' ? 0.5 : 0
                  )
                : undefined
          }
        : null),
      ...(fontSize && fontSize !== 'inherit'
        ? { fontSize: typography.fontSize[fontSize] }
        : null),
      ...(noGutter && { marginBottom: 0 }),
      textTransform
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
    textTransform,
    ...other
  } = props
  const variant = variantProp ?? 'body'
  const fontSize = !fontSizeProp && !variantProp ? 'medium' : fontSizeProp

  const styleOptions = useMemo(
    () => ({ variant, noGutter, color, weight, fontSize, textTransform }),
    [variant, noGutter, color, weight, fontSize, textTransform]
  )

  const styles = useStyles(styleOptions)

  return <RNText style={[styles.root, style]} {...other} />
}
