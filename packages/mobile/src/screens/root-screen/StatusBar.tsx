import { Status } from '@audius/common/models'
import { accountSelectors } from '@audius/common/store'
import { NavigationBar, StatusBar as RNStatusBar } from 'react-native-bars'
import { useSelector } from 'react-redux'

import { Theme, useThemeVariant } from 'app/utils/theme'

const { getAccountStatus } = accountSelectors

type ThemedStatusBarProps = {
  isAppLoaded: boolean
  isSplashScreenDismissed: boolean
}

export const StatusBar = (props: ThemedStatusBarProps) => {
  const { isAppLoaded, isSplashScreenDismissed } = props
  const theme = useThemeVariant()
  const accountStatus = useSelector(getAccountStatus)

  // Status & nav bar content (the android software buttons) should be light
  // while in a dark theme or the splash screen is still visible
  // (it's purple and white-on-purple looks better)
  const shouldRenderLightContent =
    theme === Theme.DARK || theme === Theme.MATRIX || !isSplashScreenDismissed

  const statusBarStyle = shouldRenderLightContent
    ? 'light-content'
    : 'dark-content'

  const onSignUpScreen = isAppLoaded && !(accountStatus === Status.SUCCESS)

  const navBarStyle =
    shouldRenderLightContent || onSignUpScreen
      ? 'light-content'
      : 'dark-content'

  // Wait until splash screen in dismissed before rendering statusbar
  // if (!isSplashScreenDismissed) return null

  return (
    <>
      <RNStatusBar barStyle={statusBarStyle} />
      <NavigationBar barStyle={navBarStyle} />
    </>
  )
}
