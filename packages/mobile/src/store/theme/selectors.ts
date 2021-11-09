import { AppState } from 'app/store'

const getBaseState = (state: AppState) => state.theme

export const getTheme = (state: AppState) => getBaseState(state).theme
