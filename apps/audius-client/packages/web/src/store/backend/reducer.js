import {
  SETUP_BACKEND_SUCCEEDED,
  SETUP_BACKEND_FAILED
} from 'store/backend/actions'

const initialState = {
  isSetup: false,
  web3Error: false
}

const actionsMap = {
  [SETUP_BACKEND_SUCCEEDED](state, action) {
    return {
      ...state,
      isSetup: true,
      web3Error: action.web3Error
    }
  },
  [SETUP_BACKEND_FAILED](state, action) {
    return {
      ...state,
      isSetup: true,
      web3Error: false
    }
  }
}

export default function backend(state = initialState, action) {
  const matchingReduceFunction = actionsMap[action.type]
  if (!matchingReduceFunction) return state
  return matchingReduceFunction(state, action)
}
