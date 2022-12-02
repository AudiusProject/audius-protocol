import { NavigationBar, StatusBar } from 'react-native-bars'

import { Theme, useThemeVariant } from 'app/utils/theme'

type ThemedStatusBarProps = {
  onSignUpScreen: boolean
}

export const ThemedStatusBar = ({ onSignUpScreen }: ThemedStatusBarProps) => {
  const theme = useThemeVariant()
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
