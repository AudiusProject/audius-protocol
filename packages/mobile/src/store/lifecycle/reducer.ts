import User from 'models/User'
import {
  LifecycleActions,
  BACKEND_LOADED,
  BACKEND_TEAR_DOWN,
  ON_FIRST_PAGE,
  NOT_ON_FIRST_PAGE,
  SIGNED_IN,
  CHANGED_PAGE
} from './actions'

export type LifecycleState = {
  dappLoaded: boolean
  onFirstPage: boolean
  signedIn: boolean
  account: User | null
  location: any
}

const initialState = {
  dappLoaded: false,
  onFirstPage: true,
  signedIn: false,
  account: null,
  location: null
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
    default:
      return state
  }
}

export default reducer
