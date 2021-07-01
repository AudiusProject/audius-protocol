import { ThemeActions, SET_THEME } from 'store/application/ui/theme/actions'
import { makeReducer } from 'utils/reducer'

import { ThemeState } from './types'

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
