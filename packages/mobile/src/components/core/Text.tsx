import { Text as RNText, TextProps as RNTextProps } from 'react-native'

import { makeStyles, typography } from 'app/styles'

type TextProps = RNTextProps & {
  variant: keyof typeof typography
  noGutter?: boolean
}

const useStyles = makeStyles(
  ({ typography, palette }, { variant, noGutter }) => ({
    root: {
      ...typography[variant],
      color: palette.neutral,
      ...(noGutter && { marginBottom: 0 })
    }
  })
)

export const Text = (props: TextProps) => {
  const { variant, noGutter, style, ...other } = props
  const styles = useStyles({ variant, noGutter })

  return <RNText style={[styles.root, style]} {...other} />
}
