import { Theme } from '@audius/common/models'

const THEME_KEY = 'theme'
export const PREFERS_DARK_MEDIA_QUERY = '(prefers-color-scheme: dark)'

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
  // Set data-theme to enable theme scoped css rules
  document.documentElement.setAttribute('data-theme', getThemeNameKey(theme))
}

export const doesPreferDarkMode = () => {
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

export const isDarkMode = () => shouldShowDark(getTheme())
export const isMatrix = () => getTheme() === Theme.MATRIX

export const clearTheme = () => {
  window.localStorage.removeItem(THEME_KEY)
}
