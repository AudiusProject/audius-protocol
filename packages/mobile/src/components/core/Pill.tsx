import type { ReactNode } from 'react'

import type { StyleProp, ViewStyle } from 'react-native'
import { View } from 'react-native'

import { makeStyles } from 'app/styles'

const useStyles = makeStyles(({ spacing, palette }) => ({
  optionPill: {
    paddingHorizontal: spacing(2),
    paddingVertical: spacing(1),
    backgroundColor: palette.neutralLight8,
    borderWidth: 1,
    borderColor: palette.neutralLight7,
    opacity: 0.8,
    borderRadius: 2,
    flexDirection: 'row',
    alignItems: 'center'
  }
}))

type PillProps = {
  children: ReactNode
  style?: StyleProp<ViewStyle>
}

export const Pill = (props: PillProps) => {
  const { children, style } = props
  const styles = useStyles()

  return <View style={[styles.optionPill, style]}>{children}</View>
}
