import { Cache } from 'models/Cache'
import { ID } from 'models/Identifiers'
import { Track } from 'models/Track'
import { initialCacheState } from 'store/cache/reducer'

import { AddSuccededAction, ADD_SUCCEEDED } from '../actions'

import { SET_PERMALINK, setPermalink } from './actions'
import { TracksCacheState } from './types'

const initialState: TracksCacheState = {
  ...(initialCacheState as unknown as Cache<Track>),
  permalinks: {}
}
const actionsMap = {
  [ADD_SUCCEEDED](
    state: TracksCacheState,
    action: AddSuccededAction<Track>
  ): TracksCacheState {
    const { entries } = action

    const newPermalinks: Record<string, ID> = {}

    for (const entry of entries) {
      const { track_id, permalink } = entry.metadata

      newPermalinks[permalink.toLowerCase()] = track_id
    }

    return {
      ...state,
      permalinks: {
        ...state.permalinks,
        ...newPermalinks
      }
    }
  },
  [SET_PERMALINK](
    state: TracksCacheState,
    action: ReturnType<typeof setPermalink>
  ): TracksCacheState {
    const { permalink, trackId } = action

    return {
      ...state,
      permalinks: { ...state.permalinks, [permalink.toLowerCase()]: trackId }
    }
  }
}

const reducer = (state = initialState, action: AddSuccededAction<Track>) => {
  const matchingReduceFunction = actionsMap[action.type]
  if (!matchingReduceFunction) return state
  return matchingReduceFunction(state, action)
}

export default reducer
