import type { StyleProp, ViewStyle } from 'react-native'
import { View } from 'react-native'

import { makeStyles } from 'app/styles'

import { ErrorText } from './ErrorText'

const useStyles = makeStyles(({ spacing }) => ({
  root: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 2
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

  return (
    <View style={[styles.root, style]}>
      <ErrorText size='s'>{message}</ErrorText>
    </View>
  )
}
