import { createReducer, ActionType } from 'typesafe-actions'

import * as actions from './actions'
import { EmbedModalState } from './types'

type EmbedModalActions = ActionType<typeof actions>

const initialState = {
  id: null,
  kind: null,
  isOpen: false
}

const embedModalReducer = createReducer<EmbedModalState, EmbedModalActions>(
  initialState,
  {
    [actions.OPEN](state, action) {
      return {
        ...state,
        id: action.id,
        kind: action.kind,
        isOpen: true
      }
    },
    [actions.CLOSE](state) {
      return {
        ...state,
        id: null,
        kind: null,
        isOpen: false
      }
    }
  }
)

export default embedModalReducer
