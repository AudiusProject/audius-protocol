import { ImageSourcePropType, Text, View, Image } from 'react-native'

import { makeStyles } from 'app/styles'

const useStyles = makeStyles(({ typography, palette, spacing }) => ({
  root: { flexDirection: 'row' },
  label: { ...typography.body, color: palette.neutral },
  icon: { height: spacing(4), width: spacing(4), marginRight: spacing(1) }
}))

type SettingsRowLabelProps = {
  label: string
  iconSource: ImageSourcePropType
}

export const SettingsRowLabel = (props: SettingsRowLabelProps) => {
  const { label, iconSource } = props
  const styles = useStyles()
  return (
    <View style={styles.root}>
      <Image style={styles.icon} source={iconSource} />
      <Text style={styles.label}>{label}</Text>
    </View>
  )
}
