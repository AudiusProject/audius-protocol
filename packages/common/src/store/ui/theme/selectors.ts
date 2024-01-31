import { CommonState } from '~/store/commonStore'

const getBaseState = (state: CommonState) => state.ui.theme

export const getTheme = (state: CommonState) => {
  return getBaseState(state).theme
}

export const getSystemAppearance = (state: CommonState) => {
  return getBaseState(state).systemAppearance
}
