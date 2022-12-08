import { useMemo } from 'react'

import type { ViewProps } from 'react-native'
import { View } from 'react-native'

import { makeStyles } from 'app/styles'
import type { ThemeColors } from 'app/utils/theme'

type DividerProps = ViewProps & {
  orientation?: 'horizontal' | 'vertical'
  color?: keyof ThemeColors
  width?: number
}

const useStyles = makeStyles<{ color: string; width: number }>(
  ({ palette }, { color, width }) => ({
    root: {
      borderBottomColor: palette[color],
      borderBottomWidth: width
    },
    vertical: {
      borderRightColor: palette[color],
      borderRightWidth: width
    }
  })
)

export const Divider = (props: DividerProps) => {
  const {
    style,
    orientation = 'horizontal',
    width = 1,
    color = 'neutralLight8',
    ...other
  } = props
  const styleOptions = useMemo(() => ({ width, color }), [width, color])
  const styles = useStyles(styleOptions)
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
