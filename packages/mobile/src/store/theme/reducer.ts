import { Theme } from '../../utils/theme'
import { ThemeActions, SET } from './actions'

export type ThemeState = {
  theme: Theme
}

const initialState = {
  theme: Theme.DEFAULT
}

const reducer = (state: ThemeState = initialState, action: ThemeActions) => {
  switch (action.type) {
    case SET:
      return {
        ...state,
        theme: action.theme
      }
    default:
      return state
  }
}

export default reducer
