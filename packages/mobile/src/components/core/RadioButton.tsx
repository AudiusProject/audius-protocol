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
  inner: {},
  innerInactive: {
    backgroundColor: palette.neutralLight6,
    borderRadius: spacing(5.5),
    height: spacing(5.5),
    width: spacing(5.5),
    position: 'absolute',
    right: 0,
    bottom: 0,
    shadowColor: palette.neutralLight6,
    shadowOpacity: 0.9,
    shadowRadius: 2,
    shadowOffset: { height: -2, width: -2 }
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
      <View
        style={[
          styles.inner,
          checked ? styles.innerActive : styles.innerInactive
        ]}
      />
    </View>
  )
}
