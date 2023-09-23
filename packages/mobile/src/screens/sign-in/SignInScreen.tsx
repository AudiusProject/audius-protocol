import { Text } from 'react-native'
import * as BootSplash from 'react-native-bootsplash'
import { useEffectOnce } from 'react-use'

export const SignInScreen = () => {
  useEffectOnce(() => {
    BootSplash.hide()
  })

  return <Text>sign into audius</Text>
}
