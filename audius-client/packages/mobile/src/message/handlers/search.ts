import * as searchActions from '../../store/search/actions'

import { MessageType, MessageHandlers } from '../types'

export const messageHandlers: Partial<MessageHandlers> = {
  [MessageType.OPEN_SEARCH]: ({ message, dispatch }) => {
    dispatch(searchActions.open(message.reset))
  },
  [MessageType.FETCH_SEARCH_SUCCESS]: ({ message, dispatch }) => {
    dispatch(
      searchActions.setResults({
        query: message.query,
        results: message.results
      })
    )
  },
  [MessageType.FETCH_SEARCH_FAILURE]: ({ message, dispatch }) => {
    dispatch(searchActions.fetchSearchFailed({ query: message.query }))
  }
}
