import { Status } from '@audius/common/models'
import {} from '@audius/common'

import { ActionsMap } from 'utils/reducer'

import {
  CHANGE_PASSWORD,
  CHANGE_PASSWORD_SUCCEEDED,
  CHANGE_PASSWORD_FAILED,
  ChangePasswordActions
} from './actions'
import { PasswordResetState } from './types'

const initialState = {
  status: Status.LOADING
}

const actionsMap: ActionsMap<PasswordResetState> = {
  [CHANGE_PASSWORD](state, action) {
    return {
      ...state,
      status: Status.LOADING
    }
  },
  [CHANGE_PASSWORD_SUCCEEDED](state, action) {
    return {
      ...state,
      status: Status.SUCCESS
    }
  },
  [CHANGE_PASSWORD_FAILED](state, action) {
    return {
      ...state,
      status: Status.ERROR
    }
  }
}

const reducer = (
  state: PasswordResetState = initialState,
  action: ChangePasswordActions
) => {
  const matchingReduceFunction = actionsMap[action.type]
  if (!matchingReduceFunction) return state
  return matchingReduceFunction(state, action)
}

export default reducer
