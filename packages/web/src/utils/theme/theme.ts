import { Theme } from '@audius/common'

import DarkTheme from './dark'
import DefaultTheme from './default'
import MatrixTheme from './matrix'

const THEME_KEY = 'theme'
export const PREFERS_DARK_MEDIA_QUERY = '(prefers-color-scheme: dark)'

export type ThemeColor = keyof typeof DefaultTheme &
  keyof typeof DarkTheme &
  keyof typeof MatrixTheme

const getThemeNameKey = (theme: Theme) => {
  switch (theme) {
    case Theme.AUTO:
      if (doesPreferDarkMode()) {
        return Theme.DARK
      }
      return Theme.DEFAULT
    case Theme.DEFAULT:
    case Theme.DARK:
    case Theme.MATRIX:
    default:
      return theme
  }
}

const applyTheme = (theme: Theme) => {
  const themeObject: { [key: string]: string } = getThemeColors(theme)
  Object.keys(themeObject).forEach((key) => {
    document.documentElement.style.setProperty(key, themeObject[key])
  })
  // Set data-theme to enable theme scoped css rules
  document.documentElement.setAttribute('data-theme', getThemeNameKey(theme))
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
  applyTheme(theme)
  if (typeof window !== 'undefined') {
    window.localStorage.setItem(THEME_KEY, theme)
  }
}

export const getTheme = (): Theme | null => {
  const theme =
    typeof window !== 'undefined'
      ? window.localStorage.getItem(THEME_KEY)
      : null
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
