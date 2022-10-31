import { View } from 'react-native'

import IconInfo from 'app/assets/images/iconInfo.svg'
import { makeStyles } from 'app/styles'
import { useThemeColors } from 'app/utils/theme'

import { Text } from './Text'

const useStyles = makeStyles(({ spacing }) => ({
  root: {
    flexDirection: 'row',
    alignItems: 'center'
  },
  icon: {
    marginRight: spacing(2)
  }
}))

type InputErrorMessageProps = {
  message: string
}

export const InputErrorMessage = (props: InputErrorMessageProps) => {
  const { message } = props
  const styles = useStyles()
  const { accentRed } = useThemeColors()

  return (
    <View style={styles.root}>
      <IconInfo fill={accentRed} style={styles.icon} />
      <Text color='error'>{message}</Text>
    </View>
  )
}
