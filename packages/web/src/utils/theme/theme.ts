import { SystemAppearance, Theme } from '@audius/common/models'

export const THEME_KEY = 'theme'
export const PREFERS_DARK_MEDIA_QUERY = '(prefers-color-scheme: dark)'

const doesPreferDarkMode = () => {
  return (
    typeof window !== 'undefined' &&
    window.matchMedia &&
    window.matchMedia(PREFERS_DARK_MEDIA_QUERY).matches
  )
}

export const shouldShowDark = (theme?: Theme | null) => {
  return (
    !!theme &&
    (theme === Theme.DARK || (theme === Theme.AUTO && doesPreferDarkMode()))
  )
}

export const getTheme = (): Theme | null => {
  const theme =
    typeof window !== 'undefined'
      ? window.localStorage.getItem(THEME_KEY) || Theme.DEFAULT
      : null
  if (theme && Object.values(Theme).includes(theme as Theme)) {
    return theme as Theme
  }
  return null
}

export const getSystemAppearance = () =>
  doesPreferDarkMode() ? SystemAppearance.DARK : SystemAppearance.LIGHT

export const isDarkMode = () => shouldShowDark(getTheme())
export const isMatrix = () => getTheme() === Theme.MATRIX

export const clearTheme = () => {
  window.localStorage.removeItem(THEME_KEY)
}
