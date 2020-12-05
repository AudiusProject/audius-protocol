import { AppState } from 'src/store'

const getBaseState = (state: AppState) => state.lifecycle

export const getIsOnFirstPage = (state: AppState) => getBaseState(state).onFirstPage

export const getIsSignedIn = (state: AppState) => getBaseState(state).signedIn
