import {
  OAuthActions,
  OPEN_POPUP,
  CLOSE_POPUP
} from './actions'

export type OAuthState = {
  isOpen: boolean
  // Incoming message id to reply back to with OAuth results
  messageId: string | null
  url: string | null
}

const initialState: OAuthState = {
  isOpen: false,
  messageId: null,
  url: null
}

const reducer = (
  state: OAuthState = initialState,
  action: OAuthActions
): OAuthState => {
  switch (action.type) {
    case OPEN_POPUP:
      return {
        ...state,
        isOpen: true,
        messageId: action.message.id,
        url: action.message.authURL
      }
    case CLOSE_POPUP:
      return {
        ...state,
        isOpen: false,
        messageId: null,
        url: null
      }
    default:
      return state
  }
}

export default reducer