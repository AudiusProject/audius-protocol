// @ts-nocheck
// TODO(nkang) - convert to TS
import { asLineup } from '~/store/lineup/reducer'
import {
  SET_SUGGESTED_FOLLOWS,
  SET_FEED_FILTER
} from '~/store/pages/feed/actions'
import { PREFIX as FeedPrefix } from '~/store/pages/feed/lineup/actions'
import feedReducer, {
  initialState as feedLinupInitialState
} from '~/store/pages/feed/lineup/reducer'

import { FeedFilter } from '../../../models'

const initialState = {
  suggestedFollows: [],
  feedFilter: FeedFilter.ALL,
  feed: feedLinupInitialState
}

const actionsMap = {
  [SET_SUGGESTED_FOLLOWS](state, action) {
    return {
      ...state,
      suggestedFollows: action.userIds
    }
  },
  [SET_FEED_FILTER](state, action) {
    return {
      ...state,
      feedFilter: action.filter
    }
  }
}

const feedLineupReducer = asLineup(FeedPrefix, feedReducer)

const reducer = (state = initialState, action) => {
  const feed = feedLineupReducer(state.feed, action)
  if (feed !== state.feed) return { ...state, feed }

  const matchingReduceFunction = actionsMap[action.type]
  if (!matchingReduceFunction) return state
  return matchingReduceFunction(state, action)
}

export default reducer
