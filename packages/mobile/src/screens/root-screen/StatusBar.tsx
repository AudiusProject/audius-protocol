import { useEffect } from 'react'

import { Status } from '@audius/common'
import { NavigationBar, StatusBar } from 'react-native-bars'
import * as BootSplash from 'react-native-bootsplash'

import { Theme, useThemeVariant } from 'app/utils/theme'

type ThemedStatusBarProps = {
  isAppLoaded: boolean
  accountStatus: Status
}

export const ThemedStatusBar = ({
  isAppLoaded,
  accountStatus
}: ThemedStatusBarProps) => {
  const theme = useThemeVariant()

  // Android does not use the SplashScreen component as different
  // devices will render different sizes of the BootSplash.
  // Instead of our custom SplashScreen, fade out the BootSplash screen.
  useEffect(() => {
    if (isAppLoaded) {
      BootSplash.hide({ fade: true })
    }
  }, [isAppLoaded])

  const onSignUpScreen = isAppLoaded && !(accountStatus === Status.SUCCESS)
  // Status & nav bar content (the buttons) should be light while in a dark theme or
  // the splash screen is still visible (it's purple and white-on-purple looks better)
  const statusBarStyle =
    theme === Theme.DARK || theme === Theme.MATRIX
      ? 'light-content'
      : 'dark-content'
  const navBarStyle =
    theme === Theme.DARK || theme === Theme.MATRIX || onSignUpScreen
      ? 'light-content'
      : 'dark-content'
  return (
    <>
      <StatusBar animated barStyle={statusBarStyle} />
      <NavigationBar barStyle={navBarStyle} />
    </>
  )
}
