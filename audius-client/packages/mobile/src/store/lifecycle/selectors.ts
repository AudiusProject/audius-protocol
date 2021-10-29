import { AppState } from '../../store'

const getBaseState = (state: AppState) => state.lifecycle

export const getIsOnFirstPage = (state: AppState) =>
  getBaseState(state).onFirstPage
export const getLocation = (state: AppState) => getBaseState(state).location

export const getIsSignedIn = (state: AppState) => getBaseState(state).signedIn

export const getAccount = (state: AppState) => getBaseState(state).account

export const getDappLoaded = (state: AppState) => getBaseState(state).dappLoaded

export const getOnSignUp = (state: AppState) => getBaseState(state).onSignUp
