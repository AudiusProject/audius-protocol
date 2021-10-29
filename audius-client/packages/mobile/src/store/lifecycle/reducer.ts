import User from 'models/User'

import {
  LifecycleActions,
  BACKEND_LOADED,
  BACKEND_TEAR_DOWN,
  ON_FIRST_PAGE,
  NOT_ON_FIRST_PAGE,
  SIGNED_IN,
  SIGNED_OUT,
  CHANGED_PAGE,
  ON_SIGN_UP,
  FETCH_ACCOUNT_FAILED
} from './actions'

export type LifecycleState = {
  dappLoaded: boolean
  onFirstPage: boolean
  signedIn: boolean | null
  account: User | null
  location: any
  onSignUp: boolean
}

const initialState = {
  dappLoaded: false,
  onFirstPage: true,
  signedIn: null,
  account: null,
  location: null,
  onSignUp: false
}

const reducer = (
  state: LifecycleState = initialState,
  action: LifecycleActions
) => {
  switch (action.type) {
    case BACKEND_LOADED:
      return {
        ...state,
        dappLoaded: true
      }
    case BACKEND_TEAR_DOWN:
      return {
        ...state,
        dappLoaded: false
      }
    case ON_FIRST_PAGE:
      return {
        ...state,
        onFirstPage: true
      }
    case NOT_ON_FIRST_PAGE:
      return {
        ...state,
        onFirstPage: false
      }
    case CHANGED_PAGE:
      return {
        ...state,
        location: action.location
      }
    case SIGNED_IN:
      return {
        ...state,
        signedIn: true,
        account: action.account
      }
    case SIGNED_OUT:
      return {
        ...state,
        signedIn: false,
        onSignUp: false,
        account: action.account
      }
    case ON_SIGN_UP:
      return {
        ...state,
        onSignUp: action.onSignUp
      }
    case FETCH_ACCOUNT_FAILED:
      return {
        ...state,
        signedIn: false
      }
    default:
      return state
  }
}

export default reducer
