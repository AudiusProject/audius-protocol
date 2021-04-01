import {
  WebActions,
  ENABLE_PULL_TO_REFRESH,
  DISABLE_PULL_TO_REFRESH
} from './actions'

export type WebState = {
  isEnabled: boolean
  messageId: string | null
}

const initialState: WebState = {
  isEnabled: false,
  messageId: null
}

const reducer = (
  state: WebState = initialState,
  action: WebActions
): WebState => {
  switch (action.type) {
    case ENABLE_PULL_TO_REFRESH: {
      const newState = {
        ...state,
        isEnabled: true
      }
      if (!action.message.reuseMessageId) {
        newState.messageId = action.message.id
      }
      return newState
    }
    case DISABLE_PULL_TO_REFRESH:
      // If the disabled pull to refresh is not the currently enabled one,
      // do nothing.
      if (
        action.message.enablingMessageId &&
        state.messageId !== action.message.enablingMessageId
      ) {
        return { ...state }
      }

      return {
        ...state,
        isEnabled: false
      }
    default:
      return state
  }
}

export default reducer
