import { SETUP, SETUP_BACKEND_SUCCEEDED, SETUP_BACKEND_FAILED } from './actions'

type BackendState = {
  isSettingUp: boolean
  isSetup: boolean
  web3Error: boolean
}

const initialState: BackendState = {
  isSettingUp: false,
  isSetup: false,
  web3Error: false
}

const actionsMap = {
  [SETUP](state: BackendState) {
    return {
      ...state,
      isSettingUp: true,
      isSetup: false
    }
  },
  [SETUP_BACKEND_SUCCEEDED](
    state: BackendState,
    action: { web3Error: boolean }
  ) {
    return {
      ...state,
      isSettingUp: false,
      isSetup: true,
      web3Error: action.web3Error
    }
  },
  [SETUP_BACKEND_FAILED](state: BackendState) {
    return {
      ...state,
      isSettingUp: false,
      isSetup: false,
      web3Error: false
    }
  }
}

export default function backend(
  state = initialState,
  action: {
    type: typeof SETUP_BACKEND_SUCCEEDED | typeof SETUP_BACKEND_FAILED
    isSetup?: boolean
    web3Error: boolean
  }
) {
  const matchingReduceFunction = actionsMap[action.type]
  if (!matchingReduceFunction) return state
  return matchingReduceFunction(state, action)
}
