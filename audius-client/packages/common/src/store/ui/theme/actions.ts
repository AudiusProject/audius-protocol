import { Theme } from '../../../models/Theme'

import { SET_THEME } from './actionTypes'
import { ThemeActions } from './types'
export { SET_THEME } from './actionTypes'

export const setTheme = (theme: Theme, isChange = false): ThemeActions => {
  return {
    type: SET_THEME,
    theme,
    isChange
  }
}
