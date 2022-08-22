import { Theme } from '../../../models/Theme'

import { SET_THEME } from './actionTypes'

type SetThemeAction = {
  type: typeof SET_THEME
  theme: Theme
  isChange?: boolean
}

export type ThemeActions = SetThemeAction
export interface ThemeState {
  theme: Theme | null
}
