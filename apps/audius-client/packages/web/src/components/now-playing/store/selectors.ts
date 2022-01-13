import { AppState } from 'store/types'

const getBaseState = (state: AppState) => state.application.pages.nowPlaying

export const getIsCasting = (state: AppState) => getBaseState(state).isCasting
