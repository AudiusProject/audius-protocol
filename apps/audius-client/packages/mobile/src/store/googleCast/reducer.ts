import { CastStatus, UPDATE_STATUS, SET_PLAY_POSITION } from './actions'

export type GoogleCastState = {
  status: CastStatus
  startPosition: number
}

const initialState: GoogleCastState = {
  status: CastStatus.NotConnected,
  startPosition: 0
}

const reducer = (
  state: GoogleCastState = initialState,
  action: any
): GoogleCastState => {
  switch (action.type) {
    case UPDATE_STATUS: {
      return {
        ...state,
        status: action.castStatus
      }
    }
    case SET_PLAY_POSITION: {
      return {
        ...state,
        startPosition: action.position
      }
    }
    default:
      return state
  }
}

export default reducer
