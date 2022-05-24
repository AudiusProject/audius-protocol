import { View, ViewProps } from 'react-native'

import { makeStyles } from 'app/styles'

const useStyles = makeStyles(({ palette }) => ({
  root: {
    borderBottomColor: palette.neutralLight8,
    borderBottomWidth: 1
  }
}))

type DividerProps = ViewProps

export const Divider = (props: DividerProps) => {
  const { style, ...other } = props
  const styles = useStyles()
  return <View style={[styles.root, style]} {...other} />
}
