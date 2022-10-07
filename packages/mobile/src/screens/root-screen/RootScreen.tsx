import { useCallback, useEffect, useState } from 'react'

import { accountSelectors, Status } from '@audius/common'
import type { NavigatorScreenParams } from '@react-navigation/native'
import { createNativeStackNavigator } from '@react-navigation/native-stack'
import { setupBackend } from 'audius-client/src/common/store/backend/actions'
import { getIsSetup } from 'audius-client/src/common/store/backend/selectors'
import { useDispatch, useSelector } from 'react-redux'

import useAppState from 'app/hooks/useAppState'
import { useBecomeReachable } from 'app/hooks/useReachability'
import { useUpdateRequired } from 'app/hooks/useUpdateRequired'
import type { AppScreenParamList } from 'app/screens/app-screen'
import { SignOnScreen } from 'app/screens/signon'
import { UpdateRequiredScreen } from 'app/screens/update-required-screen/UpdateRequiredScreen'
import { enterBackground, enterForeground } from 'app/store/lifecycle/actions'

import { SplashScreen } from '../splash-screen'

import { HomeScreen } from './HomeScreen'

const { getHasAccount, getAccountStatus } = accountSelectors

export type RootScreenParamList = {
  HomeStack: NavigatorScreenParams<{
    App: NavigatorScreenParams<AppScreenParamList>
  }>
}

const Stack = createNativeStackNavigator()

type RootScreenProps = {
  isReadyToSetupBackend: boolean
}

/**
 * The top level navigator. Switches between sign on screens and main tab navigator
 * based on if the user is authed
 */
export const RootScreen = ({ isReadyToSetupBackend }: RootScreenProps) => {
  const dispatch = useDispatch()
  const hasAccount = useSelector(getHasAccount)
  const accountStatus = useSelector(getAccountStatus)
  const [isInitting, setIsInittng] = useState(true)
  const { updateRequired } = useUpdateRequired()
  const isBackendSetup = useSelector(getIsSetup)

  const handleSetupBackend = useCallback(() => {
    if (isReadyToSetupBackend && !isBackendSetup) dispatch(setupBackend())
  }, [dispatch, isBackendSetup, isReadyToSetupBackend])

  useEffect(() => {
    handleSetupBackend()
  }, [dispatch, handleSetupBackend, isBackendSetup, isReadyToSetupBackend])

  useAppState(
    () => dispatch(enterForeground()),
    () => dispatch(enterBackground())
  )

  useEffect(() => {
    if (accountStatus === Status.SUCCESS || accountStatus === Status.ERROR) {
      setIsInittng(false)
    }
  }, [accountStatus])

  useBecomeReachable(() => {
    handleSetupBackend()
  })

  return (
    <>
      <SplashScreen />
      {isInitting && !hasAccount ? null : (
        <Stack.Navigator
          screenOptions={{ gestureEnabled: false, headerShown: false }}
        >
          {updateRequired ? (
            <Stack.Screen name='UpdateStack' component={UpdateRequiredScreen} />
          ) : !hasAccount ? (
            <Stack.Screen name='SignOnStack' component={SignOnScreen} />
          ) : (
            <Stack.Screen name='HomeStack' component={HomeScreen} />
          )}
        </Stack.Navigator>
      )}
    </>
  )
}
