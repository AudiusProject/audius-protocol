// @ts-nocheck
// TODO(nkang) - convert to TS
import { asLineup } from 'store/lineup/reducer'
import {
  SET_SUGGESTED_FOLLOWS,
  SET_FEED_FILTER
} from 'store/pages/feed/actions'
import { PREFIX as FeedPrefix } from 'store/pages/feed/lineup/actions'
import feedReducer from 'store/pages/feed/lineup/reducer'

import { FeedFilter } from '../../../models/index'

const initialState = {
  suggestedFollows: [],
  feedFilter: FeedFilter.ALL
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

const reducer = (state, action) => {
  // On first run, create our initial state
  if (!state) {
    return {
      ...initialState,
      feed: feedLineupReducer(state, action)
    }
  }

  const feed = feedLineupReducer(state.feed, action)
  if (feed !== state.feed) return { ...state, feed }

  const matchingReduceFunction = actionsMap[action.type]
  if (!matchingReduceFunction) return state
  return matchingReduceFunction(state, action)
}

export default reducer
