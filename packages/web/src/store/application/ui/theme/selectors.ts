import { AppState } from 'store/types'

export const getTheme = (state: AppState) => {
  return state.application.ui.theme.theme
}
