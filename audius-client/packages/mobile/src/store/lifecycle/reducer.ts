import {
  LifecycleActions,
  BACKEND_LOADED,
  BACKEND_TEAR_DOWN,
  ON_FIRST_PAGE,
  NOT_ON_FIRST_PAGE,
} from "./actions"

export type LifecycleState = {
  dappLoaded: boolean,
  onFirstPage: boolean
}

const initialState = {
  dappLoaded: false,
  onFirstPage: true
}

const reducer = (
  state: LifecycleState = initialState,
  action: LifecycleActions) => {
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
      default:
        return state
    }
}

export default reducer
