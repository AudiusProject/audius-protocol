import type { TextProps } from 'react-native'
import { Text } from 'react-native'

import { makeStyles } from 'app/styles'

const useStyles = makeStyles(({ typography, palette, spacing }) => ({
  root: {
    ...typography.body2,
    color: palette.neutralLight2,
    marginVertical: spacing(2)
  }
}))

type SettingsRowDescriptionProps = TextProps

export const SettingsRowDescription = (props: SettingsRowDescriptionProps) => {
  const styles = useStyles()
  const { children } = props

  return <Text style={styles.root}>{children}</Text>
}
