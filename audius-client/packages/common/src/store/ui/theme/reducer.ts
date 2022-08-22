import { makeReducer } from 'utils/reducer'

import { SET_THEME } from './actionTypes'
import { ThemeActions, ThemeState } from './types'

const initialState: ThemeState = {
  theme: null
}

const actionMap = {
  [SET_THEME](state: ThemeState, action: ThemeActions): ThemeState {
    return {
      ...state,
      theme: action.theme
    }
  }
}

export default makeReducer(actionMap, initialState)
