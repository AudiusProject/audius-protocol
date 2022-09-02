import type { AppState } from 'app/store'

const getBaseState = (state: AppState) => state.lifecycle

export const getLocation = (state: AppState) => getBaseState(state).location

export const getIsSignedIn = (state: AppState) => getBaseState(state).signedIn

export const getAccount = (state: AppState) => getBaseState(state).account

export const getOnSignUp = (state: AppState) => getBaseState(state).onSignUp
