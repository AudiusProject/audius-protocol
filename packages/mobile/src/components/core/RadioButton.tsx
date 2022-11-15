import { View } from 'react-native'
import type { ViewStyle } from 'react-native'

import type { StylesProps } from 'app/styles'
import { makeStyles } from 'app/styles'
import { spacing } from 'app/styles/spacing'

const useStyles = makeStyles(({ palette }) => ({
  outer: {
    borderRadius: 20,
    height: spacing(6),
    width: spacing(6),
    alignItems: 'center',
    justifyContent: 'center'
  },
  outerInactive: { backgroundColor: palette.neutralLight1 },
  outerActive: {
    backgroundColor: palette.secondary
  },
  innerInactive: {
    backgroundColor: palette.neutralLight6,
    borderRadius: spacing(5.6),
    height: 22.5,
    width: 22.5,
    position: 'absolute',
    right: 0.15,
    bottom: 0.15,
    shadowColor: palette.neutralLight6,
    shadowOpacity: 0.75,
    shadowRadius: 1,
    shadowOffset: { height: -1, width: -1 }
  },
  innerActive: {
    height: spacing(3.5),
    width: spacing(3.5),
    borderRadius: spacing(3.5),
    backgroundColor: palette.white
  }
}))

export type RadioButtonProps = {
  checked: boolean
} & StylesProps<{ root: ViewStyle }>

export const RadioButton = (props: RadioButtonProps) => {
  const { checked, style } = props
  const styles = useStyles()

  return (
    <View
      style={[
        styles.outer,
        checked ? styles.outerActive : styles.outerInactive,
        style
      ]}
    >
      <View style={checked ? styles.innerActive : styles.innerInactive} />
    </View>
  )
}
