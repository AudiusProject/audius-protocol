import { initialCacheState } from 'store/cache/reducer'

import { Collection, ID } from '../../../models'
import { AddSuccededAction, ADD_SUCCEEDED } from '../actions'

import { SET_PERMALINK, setPermalink } from './actions'
import { CollectionsCacheState } from './types'

const initialState = {
  ...initialCacheState,
  permalinks: {}
}

const actionsMap = {
  [ADD_SUCCEEDED](
    state: CollectionsCacheState,
    action: AddSuccededAction<Collection>
  ) {
    const { entries } = action

    const newPermalinks: Record<string, ID> = {}

    for (const entry of entries) {
      const { playlist_id, permalink } = entry.metadata

      if (permalink) {
        newPermalinks[permalink.toLowerCase()] = playlist_id
      }
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
    state: CollectionsCacheState,
    action: ReturnType<typeof setPermalink>
  ): CollectionsCacheState {
    const { permalink, collectionId } = action

    if (!permalink) return state
    return {
      ...state,
      permalinks: {
        ...state.permalinks,
        [permalink.toLowerCase()]: collectionId
      }
    }
  }
}

const reducer = (state = initialState, action: any) => {
  const matchingReduceFunction = actionsMap[action.type]
  if (!matchingReduceFunction) return state
  return matchingReduceFunction(state, action)
}
export default reducer
