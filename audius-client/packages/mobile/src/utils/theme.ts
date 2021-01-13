import { StatusBar } from "react-native"

enum Theme {
  DEFAULT = 'default',
  DARK = 'dark',
  AUTO = 'auto'
}


export const handleThemeChange = (theme: Theme) => {
  switch (theme) {
    case Theme.DEFAULT: {
      StatusBar.setBarStyle('dark-content')
      break
    }
    case Theme.DARK: {
      StatusBar.setBarStyle('light-content')
      break
    }
    case Theme.AUTO: {
      StatusBar.setBarStyle('default')
      break
    }
  }

  // Fade in status bar after we
  // get our first update, after a
  // slight delay to allow Splash Screen
  // to animate out.
  setTimeout(() => {
    StatusBar.setHidden(false, "fade")
  }, 500)
}