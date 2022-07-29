import type { ReactNode } from 'react'
import { createContext, useCallback } from 'react'

import { Name } from '@audius/common'
import { setTheme } from 'audius-client/src/common/store/ui/theme/actions'
import { getTheme } from 'audius-client/src/common/store/ui/theme/selectors'
import { useDarkMode } from 'react-native-dark-mode'

import { useDispatchWeb } from 'app/hooks/useDispatchWeb'
import { useSelectorWeb } from 'app/hooks/useSelectorWeb'
import { make, track } from 'app/utils/analytics'
import { Theme } from 'app/utils/theme'

type ThemeContextProps = {
  theme: Theme
  setTheme: (theme: Theme) => void
  isSystemDarkMode: boolean
}

export const ThemeContext = createContext<ThemeContextProps>({
  theme: Theme.DEFAULT,
  setTheme: () => {},
  isSystemDarkMode: false
})

type ThemeProviderProps = {
  children: ReactNode
}

export const ThemeProvider = (props: ThemeProviderProps) => {
  const { children } = props
  const dispatchWeb = useDispatchWeb()
  const theme = useSelectorWeb(getTheme) ?? Theme.DEFAULT
  const isSystemDarkMode = useDarkMode()

  const handleSetTheme = useCallback(
    (theme: Theme, isChange?: boolean) => {
      dispatchWeb(setTheme(theme, isChange))

      const recordedTheme =
        theme === Theme.DEFAULT ? 'light' : theme.toLocaleLowerCase()

      const trackEvent = make({
        eventName: Name.SETTINGS_CHANGE_THEME,
        mode: recordedTheme as 'dark' | 'light' | 'matrix' | 'auto'
      })

      track(trackEvent)
    },
    [dispatchWeb]
  )

  return (
    <ThemeContext.Provider
      value={{
        theme,
        setTheme: handleSetTheme,
        isSystemDarkMode
      }}
    >
      {children}
    </ThemeContext.Provider>
  )
}
