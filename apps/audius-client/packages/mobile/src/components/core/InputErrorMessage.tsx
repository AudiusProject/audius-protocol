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
  },
  text: { lineHeight: 14, marginTop: 2 }
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
      <IconInfo fill={accentRed} style={styles.icon} height={14} width={14} />
      <ErrorText fontSize='small' style={styles.text}>
        {message}
      </ErrorText>
    </View>
  )
}
