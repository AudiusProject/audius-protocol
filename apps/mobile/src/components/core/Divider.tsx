import type { ViewProps } from 'react-native'
import { View } from 'react-native'

import { makeStyles } from 'app/styles'

const useStyles = makeStyles(({ palette }) => ({
  root: {
    borderBottomColor: palette.neutralLight8,
    borderBottomWidth: 1
  },
  vertical: {
    borderRightColor: palette.neutralLight8,
    borderRightWidth: 1
  }
}))

type DividerProps = ViewProps & {
  orientation?: 'horizontal' | 'vertical'
}

export const Divider = (props: DividerProps) => {
  const { style, orientation = 'horizontal', ...other } = props
  const styles = useStyles()
  return (
    <View
      style={[
        styles.root,
        orientation === 'vertical' && styles.vertical,
        style
      ]}
      {...other}
    />
  )
}
