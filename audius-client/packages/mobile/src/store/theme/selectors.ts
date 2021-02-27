import { AppState } from 'src/store'

const getBaseState = (state: AppState) => state.theme

export const getTheme = (state: AppState) => getBaseState(state).theme
