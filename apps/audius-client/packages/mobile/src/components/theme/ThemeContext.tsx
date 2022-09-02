import type { ReactNode } from 'react'
import { createContext, useCallback } from 'react'

import { Name, themeActions, themeSelectors } from '@audius/common'
import AsyncStorage from '@react-native-async-storage/async-storage'
import { useDarkMode } from 'react-native-dark-mode'
import { useDispatch, useSelector } from 'react-redux'
import { useAsync } from 'react-use'

import { make, track } from 'app/services/analytics'
import { Theme } from 'app/utils/theme'
const { setTheme } = themeActions
const { getTheme } = themeSelectors

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
  const dispatch = useDispatch()
  const theme = useSelector(getTheme) ?? Theme.DEFAULT
  const isSystemDarkMode = useDarkMode()

  useAsync(async () => {
    const savedTheme = await AsyncStorage.getItem('theme')
    if (!savedTheme) {
      await AsyncStorage.setItem('theme', Theme.DEFAULT)
      dispatch(setTheme(Theme.DEFAULT))
    } else {
      dispatch(setTheme(savedTheme as Theme))
    }
  }, [])

  const handleSetTheme = useCallback(
    (theme: Theme, isChange?: boolean) => {
      dispatch(setTheme(theme, isChange))

      const recordedTheme =
        theme === Theme.DEFAULT ? 'light' : theme.toLocaleLowerCase()

      const trackEvent = make({
        eventName: Name.SETTINGS_CHANGE_THEME,
        mode: recordedTheme as 'dark' | 'light' | 'matrix' | 'auto'
      })

      track(trackEvent)
    },
    [dispatch]
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
