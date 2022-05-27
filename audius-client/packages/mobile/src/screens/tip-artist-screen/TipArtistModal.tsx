import { createNativeStackNavigator } from '@react-navigation/native-stack'

import { useAppScreenOptions } from '../app-screen/useAppScreenOptions'

import { ConfirmSendTipScreen } from './ConfirmSendTipScreen'
import { SendTipScreen } from './SendTipScreen'
import { TipSentScreen } from './TipSentScreen'

const Stack = createNativeStackNavigator()

const screenOptionOverrides = { headerRight: () => null }

export const TipArtistModal = () => {
  const screenOptions = useAppScreenOptions(screenOptionOverrides)
  return (
    <Stack.Navigator screenOptions={screenOptions}>
      <Stack.Screen name='SendTip' component={SendTipScreen} />
      <Stack.Screen name='ConfirmTip' component={ConfirmSendTipScreen} />
      <Stack.Screen name='TipSent' component={TipSentScreen} />
    </Stack.Navigator>
  )
}
