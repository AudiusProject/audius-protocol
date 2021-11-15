import FeedFilter from 'common/models/FeedFilter'
import {
  SET_SUGGESTED_FOLLOWS,
  SET_FEED_FILTER
} from 'containers/feed-page/store/actions'
import { PREFIX as FeedPrefix } from 'containers/feed-page/store/lineups/feed/actions'
import feedReducer from 'containers/feed-page/store/lineups/feed/reducer'
import { asLineup } from 'store/lineup/reducer'

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
