import type { StyleProp, ViewStyle } from 'react-native'
import { View } from 'react-native'

import IconInfo from 'app/assets/images/iconInfo.svg'
import { makeStyles } from 'app/styles'
import { useThemeColors } from 'app/utils/theme'

import { ErrorText } from './ErrorText'

const useStyles = makeStyles(({ spacing }) => ({
  root: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: spacing(4)
  },
  icon: {
    marginRight: spacing(2)
  }
}))

type InputErrorMessageProps = {
  message: string
  style?: StyleProp<ViewStyle>
}

export const InputErrorMessage = (props: InputErrorMessageProps) => {
  const { message, style } = props
  const styles = useStyles()
  const { accentRed } = useThemeColors()

  return (
    <View style={[styles.root, style]}>
      <IconInfo fill={accentRed} style={styles.icon} height={14} width={14} />
      <ErrorText fontSize='small'>{message}</ErrorText>
    </View>
  )
}
