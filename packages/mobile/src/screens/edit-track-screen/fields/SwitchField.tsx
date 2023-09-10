import { useField } from 'formik'
import type { ViewStyle } from 'react-native'
import { View } from 'react-native'

import { Switch, Text } from 'app/components/core'
import { makeStyles } from 'app/styles'

const useStyles = makeStyles(({ spacing }) => ({
  root: {
    marginTop: spacing(6),
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center'
  },
  label: {
    marginTop: spacing(1)
  }
}))

type SwitchFieldProps = {
  name: string
  label: string
  style?: ViewStyle
}

export const SwitchField = (props: SwitchFieldProps) => {
  const { name, label, style } = props
  const styles = useStyles()
  const [{ value }, , { setValue }] = useField(name)

  return (
    <View style={[styles.root, style]}>
      <Text fontSize='large' weight='demiBold' style={styles.label}>
        {label}
      </Text>
      <Switch value={value} onValueChange={setValue} />
    </View>
  )
}
