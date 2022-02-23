import { View } from 'react-native'

import { makeStyles } from 'app/styles'

const useStyles = makeStyles(({ palette, spacing }) => ({
  root: {
    height: spacing(6),
    borderBottomColor: palette.neutralLight8,
    borderBottomWidth: 1
  }
}))

export const Divider = () => {
  const styles = useStyles()
  return <View style={styles.root} />
}
