import { CommonState } from 'store/commonStore'

export const getTheme = (state: CommonState) => {
  return state.ui.theme.theme
}
