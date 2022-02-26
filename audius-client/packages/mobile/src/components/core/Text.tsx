import { Text as RNText, TextProps as RNTextProps } from 'react-native'

import { makeStyles, typography } from 'app/styles'

type TextProps = RNTextProps & {
  variant?: keyof typeof typography
  noGutter?: boolean
  color?: 'primary' | 'secondary' | 'neutral'
}

const useStyles = makeStyles(
  ({ typography, palette }, { variant, noGutter, color }) => ({
    root: {
      ...typography[variant],
      color: palette[color],
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
    ...other
  } = props

  const styles = useStyles({ variant, noGutter, color })

  return <RNText style={[styles.root, style]} {...other} />
}
