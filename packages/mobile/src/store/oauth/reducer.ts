import { OAuthActions, OPEN_POPUP, CLOSE_POPUP } from './actions'

export type OAuthState = {
  isOpen: boolean
  // Incoming message id to reply back to with OAuth results
  messageId: string | null
  url: string | null
  provider: Provider | null
}

export enum Provider {
  TWITTER = 'TWITTER',
  INSTAGRAM = 'INSTAGRAM'
}

const initialState: OAuthState = {
  isOpen: false,
  messageId: null,
  url: null,
  provider: null
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
        url: action.message.authURL,
        provider: action.provider
      }
    case CLOSE_POPUP:
      return {
        ...state,
        isOpen: false,
        messageId: null,
        url: null,
        provider: null
      }
    default:
      return state
  }
}

export default reducer
