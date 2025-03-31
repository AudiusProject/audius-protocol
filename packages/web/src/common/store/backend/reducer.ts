import { SETUP, SETUP_BACKEND_SUCCEEDED, SETUP_BACKEND_FAILED } from './actions'

type BackendState = {
  isSettingUp: boolean
  isSetup: boolean
}

const initialState: BackendState = {
  isSettingUp: false,
  isSetup: false
}

const actionsMap = {
  [SETUP](state: BackendState) {
    return {
      ...state,
      isSettingUp: true,
      isSetup: false
    }
  },
  [SETUP_BACKEND_SUCCEEDED](state: BackendState) {
    return {
      ...state,
      isSettingUp: false,
      isSetup: true
    }
  },
  [SETUP_BACKEND_FAILED](state: BackendState) {
    return {
      ...state,
      isSettingUp: false,
      isSetup: false
    }
  }
}

export default function backend(
  state = initialState,
  action: {
    type: typeof SETUP_BACKEND_SUCCEEDED | typeof SETUP_BACKEND_FAILED
    isSetup?: boolean
  }
) {
  const matchingReduceFunction = actionsMap[action.type]
  if (!matchingReduceFunction) return state
  return matchingReduceFunction(state)
}
