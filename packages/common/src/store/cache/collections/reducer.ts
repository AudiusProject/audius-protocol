import snakecaseKeys from 'snakecase-keys'

import { makePlaylist } from '~/services/audius-api-client/ResponseAdapter'
import { initialCacheState } from '~/store/cache/reducer'
import { makeUid } from '~/utils'

import {
  Collection,
  ID,
  Kind,
  PlaylistTrackId,
  SsrPageProps
} from '../../../models'
import {
  AddEntriesAction,
  AddSuccededAction,
  ADD_ENTRIES,
  ADD_SUCCEEDED
} from '../actions'

import { SET_PERMALINK, setPermalink } from './actions'
import { CollectionsCacheState } from './types'

const initialState = {
  ...initialCacheState,
  permalinks: {}
}

const addEntries = (state: CollectionsCacheState, entries: any[]) => {
  const newPermalinks: Record<string, ID> = {}

  // Add uids to track info in playlist_contents
  // This allows collection tiles to be played when uid would not normally be present
  entries.forEach((entry) => {
    entry.metadata.playlist_contents.track_ids.forEach(
      (track: PlaylistTrackId) => {
        if (!track.uid) {
          track.uid = makeUid(
            Kind.TRACKS,
            track.track,
            `collection:${entry.metadata.playlist_id}`
          )
        }
      }
    )
  })

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
}

const actionsMap = {
  [ADD_SUCCEEDED](
    state: CollectionsCacheState,
    action: AddSuccededAction<Collection>
  ) {
    const { entries } = action
    return addEntries(state, entries)
  },
  [ADD_ENTRIES](
    state: CollectionsCacheState,
    action: AddEntriesAction<Collection>,
    kind: Kind
  ) {
    const { entriesByKind } = action
    const matchingEntries = entriesByKind[kind]

    if (!matchingEntries) return state
    return addEntries(state, matchingEntries)
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

const buildInitialState = (ssrPageProps?: SsrPageProps) => {
  // If we have preloaded data from the server, populate the initial
  // cache state with it
  if (ssrPageProps?.collection) {
    // @ts-ignore
    const collection = makePlaylist(snakecaseKeys(ssrPageProps.collection))
    if (!collection) return initialState

    const id = collection.playlist_id
    const uid = makeUid(Kind.COLLECTIONS, id)

    return {
      ...initialState,
      entries: {
        [id]: {
          metadata: collection,
          _timestamp: Date.now()
        }
      },
      uids: {
        [uid]: collection.playlist_id
      },
      statuses: {
        [id]: 'SUCCESS'
      }
    }
  }
  return initialState
}

const reducer =
  (ssrPageProps?: SsrPageProps) =>
  (state: CollectionsCacheState, action: any) => {
    if (!state) {
      // @ts-ignore
      state = buildInitialState(ssrPageProps)
    }

    const matchingReduceFunction = actionsMap[action.type]
    if (!matchingReduceFunction) return state
    return matchingReduceFunction(state, action)
  }

export default reducer
