import { CommonState } from 'common/store'

export const getTheme = (state: CommonState) => {
  return state.ui.theme.theme
}
