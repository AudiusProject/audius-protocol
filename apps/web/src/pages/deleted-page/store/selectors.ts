import { AppState } from 'store/types'

export const getBaseState = (state: AppState) => state.application.pages.deleted

export const getLineup = (state: AppState) => getBaseState(state).moreBy
