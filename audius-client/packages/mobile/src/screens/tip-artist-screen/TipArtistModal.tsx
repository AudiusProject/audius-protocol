import { useEffect } from 'react'

import { tippingActions } from '@audius/common'
import { createNativeStackNavigator } from '@react-navigation/native-stack'
import { useDispatch } from 'react-redux'

import { useAppScreenOptions } from '../app-screen/useAppScreenOptions'

import { ConfirmSendTipScreen } from './ConfirmSendTipScreen'
import { SendTipScreen } from './SendTipScreen'
import { TipSentScreen } from './TipSentScreen'
const { resetSend } = tippingActions

const Stack = createNativeStackNavigator()

const screenOptionOverrides = { headerRight: () => null }

export const TipArtistModal = () => {
  const screenOptions = useAppScreenOptions(screenOptionOverrides)
  const dispatch = useDispatch()

  useEffect(() => {
    return () => {
      dispatch(resetSend())
    }
  }, [dispatch])

  return (
    <Stack.Navigator screenOptions={screenOptions}>
      <Stack.Screen name='SendTip' component={SendTipScreen} />
      <Stack.Screen name='ConfirmTip' component={ConfirmSendTipScreen} />
      <Stack.Screen name='TipSent' component={TipSentScreen} />
    </Stack.Navigator>
  )
}
