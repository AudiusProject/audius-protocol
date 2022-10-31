import type { ViewStyle } from 'react-native'
import { View } from 'react-native'

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
  outerInactive: { backgroundColor: palette.neutralLight4 },
  outerActive: {
    backgroundColor: palette.secondary
  },
  inner: {},
  innerInactive: {},
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
