import type { ViewProps } from 'react-native'
import { View } from 'react-native'

import { makeStyles } from 'app/styles'

type DividerProps = ViewProps & {
  orientation?: 'horizontal' | 'vertical'
  color?: string
  width?: number
}

const useStyles = makeStyles(({ palette }) => ({
  horizontal: {
    borderBottomColor: palette.neutralLight8,
    borderBottomWidth: 1
  },
  vertical: {
    borderRightColor: palette.neutralLight8,
    borderRightWidth: 1
  }
}))

export const Divider = (props: DividerProps) => {
  const { style, orientation = 'horizontal', width, color, ...other } = props
  const styles = useStyles()
  const positionStyle =
    orientation === 'horizontal' ? 'borderBottom' : 'borderRight'

  return (
    <View
      style={[
        orientation === 'horizontal' ? styles.horizontal : styles.vertical,
        style,
        width ? { [`${positionStyle}Width`]: width } : null,
        color ? { [`${positionStyle}Color`]: color } : null
      ]}
      {...other}
    />
  )
}
