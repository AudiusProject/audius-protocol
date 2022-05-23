import { useMemo } from 'react'

import { Text as RNText, TextProps as RNTextProps } from 'react-native'

import { FontWeight, makeStyles, typography } from 'app/styles'

export type TextProps = RNTextProps & {
  variant?: keyof typeof typography
  noGutter?: boolean
  color?: 'primary' | 'secondary' | 'neutral' | 'neutralLight4' | 'inherit'
  weight?: FontWeight
}

const useStyles = makeStyles(
  ({ typography, palette }, { variant, noGutter, color, weight }) => ({
    root: {
      ...typography[variant],
      ...(color === 'inherit' ? null : { color: palette[color] }),
      ...(weight ? { fontFamily: typography.fontByWeight[weight] } : null),
      ...(noGutter && { marginBottom: 0 })
    }
  })
)

export const Text = (props: TextProps) => {
  const {
    variant = 'body',
    noGutter,
    style,
    color = 'neutral',
    weight,
    ...other
  } = props

  const styleOptions = useMemo(() => ({ variant, noGutter, color, weight }), [
    variant,
    noGutter,
    color,
    weight
  ])

  const styles = useStyles(styleOptions)

  return <RNText style={[styles.root, style]} {...other} />
}
