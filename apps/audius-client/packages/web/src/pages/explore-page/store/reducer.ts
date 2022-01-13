import Status from 'common/models/Status'
import { ActionsMap } from 'utils/reducer'

import {
  FETCH_EXPLORE,
  FETCH_EXPLORE_SUCCEEDED,
  FETCH_EXPLORE_FAILED,
  ExplorePageActions,
  SET_TAB
} from './actions'
import ExplorePageState, { Tabs } from './types'

const initialState: ExplorePageState = {
  playlists: [],
  profiles: [],
  status: Status.SUCCESS,
  tab: Tabs.FOR_YOU
}

const actionsMap: ActionsMap<ExplorePageState> = {
  [FETCH_EXPLORE](state, action) {
    return {
      ...state,
      status: Status.LOADING
    }
  },
  [FETCH_EXPLORE_SUCCEEDED](state, action) {
    const { featuredPlaylists, featuredProfiles } = action.exploreContent
    return {
      ...state,
      playlists: featuredPlaylists,
      profiles: featuredProfiles,
      status: Status.SUCCESS
    }
  },
  [FETCH_EXPLORE_FAILED](state, action) {
    return {
      ...initialState,
      status: Status.ERROR
    }
  },
  [SET_TAB](state, action) {
    return {
      ...state,
      tab: action.tab
    }
  }
}

const reducer = (
  state: ExplorePageState = initialState,
  action: ExplorePageActions
) => {
  const matchingReduceFunction = actionsMap[action.type]
  if (!matchingReduceFunction) return state
  return matchingReduceFunction(state, action)
}

export default reducer
