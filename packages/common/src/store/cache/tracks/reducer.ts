import snakecaseKeys from 'snakecase-keys'

import { Cache } from '~/models/Cache'
import { ID } from '~/models/Identifiers'
import { Kind } from '~/models/Kind'
import { SsrPageProps } from '~/models/SsrPageProps'
import { Track } from '~/models/Track'
import { makeTrack } from '~/services/audius-api-client/ResponseAdapter'
import { initialCacheState } from '~/store/cache/reducer'
import { makeUid } from '~/utils/uid'

import {
  AddEntriesAction,
  AddSuccededAction,
  ADD_ENTRIES,
  ADD_SUCCEEDED
} from '../actions'

import { SET_PERMALINK, setPermalink } from './actions'
import { TracksCacheState } from './types'

const initialState: TracksCacheState = {
  ...(initialCacheState as unknown as Cache<Track>),
  permalinks: {}
}

const addEntries = (state: TracksCacheState, entries: any[]) => {
  const newPermalinks: Record<string, ID> = {}

  for (const entry of entries) {
    const { track_id, permalink } = entry.metadata

    if (permalink) {
      newPermalinks[permalink.toLowerCase()] = track_id
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
    state: TracksCacheState,
    action: AddSuccededAction<Track>
  ): TracksCacheState {
    const { entries } = action
    return addEntries(state, entries)
  },
  [ADD_ENTRIES](
    state: TracksCacheState,
    action: AddEntriesAction<Track>,
    kind: Kind
  ): TracksCacheState {
    const { entriesByKind } = action
    const matchingEntries = entriesByKind[kind]

    if (!matchingEntries) return state
    return addEntries(state, matchingEntries)
  },
  [SET_PERMALINK](
    state: TracksCacheState,
    action: ReturnType<typeof setPermalink>
  ): TracksCacheState {
    const { permalink, trackId } = action

    if (!permalink) return state
    return {
      ...state,
      permalinks: { ...state.permalinks, [permalink.toLowerCase()]: trackId }
    }
  }
}

const buildInitialState = (ssrPageProps?: SsrPageProps) => {
  // If we have preloaded data from the server, populate the initial
  // cache state with it
  if (ssrPageProps?.track) {
    // @ts-ignore
    const track = makeTrack(snakecaseKeys(ssrPageProps.track))
    if (!track) return initialState

    const id = track.track_id
    const uid = makeUid(Kind.TRACKS, id)

    return {
      ...initialState,
      entries: {
        [id]: {
          metadata: track,
          _timestamp: Date.now()
        }
      },
      uids: {
        [uid]: track.track_id
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
  (state: TracksCacheState, action: AddSuccededAction<Track>) => {
    if (!state) {
      // @ts-ignore
      state = buildInitialState(ssrPageProps)
    }

    const matchingReduceFunction = actionsMap[action.type]
    if (!matchingReduceFunction) return state
    return matchingReduceFunction(state, action)
  }

export default reducer
