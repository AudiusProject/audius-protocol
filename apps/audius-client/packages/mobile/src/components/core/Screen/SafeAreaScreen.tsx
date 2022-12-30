import { SafeAreaView } from 'react-native'

import type { ScreenProps } from './Screen'
import { Screen } from './Screen'

type SafeAreaScreenProps = ScreenProps

export const SafeAreaScreen = (props: SafeAreaScreenProps) => {
  return <Screen as={SafeAreaView} {...props} />
}
