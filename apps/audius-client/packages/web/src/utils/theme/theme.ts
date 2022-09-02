import { Theme } from '@audius/common'

import DarkTheme from './dark'
import DefaultTheme from './default'
import MatrixTheme from './matrix'

const THEME_KEY = 'theme'
export const PREFERS_DARK_MEDIA_QUERY = '(prefers-color-scheme: dark)'

export type ThemeColor = keyof typeof DefaultTheme &
  keyof typeof DarkTheme &
  keyof typeof MatrixTheme

const applyTheme = (themeObject: { [key: string]: string }) => {
  Object.keys(themeObject).forEach((key) => {
    document.documentElement.style.setProperty(key, themeObject[key])
  })
}

const doesPreferDarkMode = () => {
  return (
    window.matchMedia && window.matchMedia(PREFERS_DARK_MEDIA_QUERY).matches
  )
}

export const shouldShowDark = (theme?: Theme | null) => {
  return (
    !!theme &&
    (theme === Theme.DARK || (theme === Theme.AUTO && doesPreferDarkMode()))
  )
}

const getThemeColors = (theme: Theme | null) => {
  switch (theme) {
    case Theme.DARK:
      return DarkTheme
    case Theme.MATRIX:
      return MatrixTheme
    case Theme.AUTO:
      if (doesPreferDarkMode()) {
        return DarkTheme
      }
      return DefaultTheme
    default:
      return DefaultTheme
  }
}

export const setTheme = (theme: Theme) => {
  const themeFile = getThemeColors(theme)
  applyTheme(themeFile)
  window.localStorage.setItem(THEME_KEY, theme)
}

export const getTheme = (): Theme | null => {
  const theme = window.localStorage.getItem(THEME_KEY)
  if (theme && Object.values(Theme).includes(theme as Theme)) {
    return theme as Theme
  }
  return null
}

export const getCurrentThemeColors = () => {
  const theme = getTheme()
  return getThemeColors(theme)
}

export const isDarkMode = () => shouldShowDark(getTheme())
export const isMatrix = () => getTheme() === Theme.MATRIX

export const clearTheme = () => {
  window.localStorage.removeItem(THEME_KEY)
}
