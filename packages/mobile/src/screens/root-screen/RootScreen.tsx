import { useCallback, useEffect, useState } from 'react'

import { accountSelectors, chatActions, playerActions } from '@audius/common'
import { Status } from '@audius/common/models'
import { FeatureFlags } from '@audius/common/services'
import { createNativeStackNavigator } from '@react-navigation/native-stack'
import {
  getHasCompletedAccount,
  getStartedSignUpProcess
} from 'common/store/pages/signon/selectors'
import { useDispatch, useSelector } from 'react-redux'

import useAppState from 'app/hooks/useAppState'
import { useDrawer } from 'app/hooks/useDrawer'
import { useFeatureFlag } from 'app/hooks/useRemoteConfig'
import { useUpdateRequired } from 'app/hooks/useUpdateRequired'
import { useSyncCodePush } from 'app/screens/root-screen/useSyncCodePush'
import { SignOnScreen } from 'app/screens/signon'
import { SplashScreen } from 'app/screens/splash-screen'
import {
  UpdateRequiredScreen,
  RestartRequiredScreen
} from 'app/screens/update-required-screen'
import { enterBackground, enterForeground } from 'app/store/lifecycle/actions'

import { AppDrawerScreen } from '../app-drawer-screen'
import { ResetPasswordModalScreen } from '../reset-password-screen'
import { SignOnStack } from '../sign-on-screen'

import { StatusBar } from './StatusBar'

const { getAccountStatus } = accountSelectors
const { fetchMoreChats, fetchUnreadMessagesCount, connect, disconnect } =
  chatActions
const { reset } = playerActions

const Stack = createNativeStackNavigator()

export type RootScreenParamList = {
  UpdateStack: undefined
  HomeStack: undefined
  SignUp: undefined
  SignIn: undefined
  SignOnStack: undefined
  ResetPassword: { login: string; email: string }
}

/**
 * The top level navigator. Switches between sign on screens and main tab navigator
 * based on if the user is authed
 */
export const RootScreen = () => {
  const { isPendingMandatoryCodePushUpdate } = useSyncCodePush()
  const { updateRequired } = useUpdateRequired()
  const dispatch = useDispatch()
  const accountStatus = useSelector(getAccountStatus)
  const showHomeStack = useSelector(getHasCompletedAccount)
  const startedSignUp = useSelector(getStartedSignUpProcess)
  const [welcomeModalShown, setWelcomeModalShown] = useState(false)
  const [isLoaded, setIsLoaded] = useState(false)
  const [isSplashScreenDismissed, setIsSplashScreenDismissed] = useState(false)
  const { isEnabled: isSignUpRedesignEnabled } = useFeatureFlag(
    FeatureFlags.SIGN_UP_REDESIGN
  )

  const { onOpen: openWelcomeDrawer } = useDrawer('Welcome')

  useAppState(
    () => dispatch(enterForeground()),
    () => dispatch(enterBackground())
  )

  useEffect(() => {
    if (
      !isLoaded &&
      (accountStatus === Status.SUCCESS || accountStatus === Status.ERROR)
    ) {
      // Reset the player when the app is loaded for the first time. Fixes an issue
      // where after a crash, the player would persist the previous state. PAY-1412.
      dispatch(reset({ shouldAutoplay: false }))
      setIsLoaded(true)
    }
  }, [accountStatus, setIsLoaded, isLoaded, dispatch])

  // Connect to chats websockets and prefetch chats
  useEffect(() => {
    if (isLoaded && accountStatus === Status.SUCCESS) {
      dispatch(connect())
      dispatch(fetchMoreChats())
      dispatch(fetchUnreadMessagesCount())
    }
    return () => {
      dispatch(disconnect())
    }
  }, [dispatch, isLoaded, accountStatus])

  const handleSplashScreenDismissed = useCallback(() => {
    setIsSplashScreenDismissed(true)
  }, [])

  useEffect(() => {
    if (isSignUpRedesignEnabled) {
      if (showHomeStack && startedSignUp && !welcomeModalShown) {
        openWelcomeDrawer()
        setWelcomeModalShown(true)
      }
    }
  }, [
    isSignUpRedesignEnabled,
    openWelcomeDrawer,
    showHomeStack,
    startedSignUp,
    welcomeModalShown
  ])

  return (
    <>
      <SplashScreen
        canDismiss={isLoaded}
        onDismiss={handleSplashScreenDismissed}
      />
      <StatusBar
        isAppLoaded={isLoaded}
        isSplashScreenDismissed={isSplashScreenDismissed}
      />
      {isLoaded ? (
        <Stack.Navigator
          screenOptions={{ gestureEnabled: false, headerShown: false }}
        >
          {isPendingMandatoryCodePushUpdate || updateRequired ? (
            <Stack.Screen
              name='UpdateStack'
              component={
                isPendingMandatoryCodePushUpdate
                  ? RestartRequiredScreen
                  : UpdateRequiredScreen
              }
            />
          ) : null}

          {showHomeStack ? (
            <Stack.Screen name='HomeStack' component={AppDrawerScreen} />
          ) : isSignUpRedesignEnabled ? (
            <Stack.Screen name='SignOnStackNew'>
              {() => (
                <SignOnStack
                  isSplashScreenDismissed={isSplashScreenDismissed}
                />
              )}
            </Stack.Screen>
          ) : (
            <Stack.Screen name='SignOnStack' component={SignOnScreen} />
          )}
          <Stack.Screen
            name='ResetPassword'
            component={ResetPasswordModalScreen}
            options={{ presentation: 'modal' }}
          />
        </Stack.Navigator>
      ) : null}
    </>
  )
}
