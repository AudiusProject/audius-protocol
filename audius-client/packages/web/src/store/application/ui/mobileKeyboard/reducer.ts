import { createReducer } from 'typesafe-actions'

import { MessageType } from 'services/native-mobile-interface/types'

import { MobileKeyboardState } from './types'

const initialState = {
  mobileKeyboardVisible: false
}

type MobileKeyboardActions =
  | {
      type: MessageType.KEYBOARD_VISIBLE
    }
  | {
      type: MessageType.KEYBOARD_HIDDEN
    }

const reducer = createReducer<MobileKeyboardState, MobileKeyboardActions>(
  initialState,
  {
    [MessageType.KEYBOARD_VISIBLE](state, action) {
      return {
        ...state,
        mobileKeyboardVisible: true
      }
    },
    [MessageType.KEYBOARD_HIDDEN](state, action) {
      return {
        ...state,
        mobileKeyboardVisible: false
      }
    }
  }
)

export default reducer
