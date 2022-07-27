import { Theme } from '@audius/common'

export const SET_THEME = 'CLIENT/SET_THEME'

type SetThemeAction = {
  type: typeof SET_THEME
  theme: Theme
  isChange?: boolean
}

export type ThemeActions = SetThemeAction

export const setTheme = (theme: Theme, isChange = false): ThemeActions => {
  return {
    type: SET_THEME,
    theme,
    isChange
  }
}
