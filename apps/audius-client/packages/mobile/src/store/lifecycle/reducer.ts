import type { User } from '@audius/common'

import type { LifecycleActions } from './actions'
import {
  SIGNED_IN,
  SIGNED_OUT,
  ON_SIGN_UP,
  FETCH_ACCOUNT_FAILED
} from './actions'

export type LifecycleState = {
  signedIn: boolean | null
  account: User | null
  location: any
  onSignUp: boolean
}

const initialState = {
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
