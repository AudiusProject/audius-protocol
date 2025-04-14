import { mergeWith } from 'lodash'
import { call, select, takeEvery, all } from 'typed-redux-saga'

import { FeatureFlags } from '~/services/remote-config/feature-flags'

import { getContext } from '../effects'

import {
  ADD_ENTRIES,
  ADD_SUCCEEDED,
  UPDATE,
  INCREMENT,
  addEntries,
  addSucceeded,
  update,
  increment
} from './actions'
import { getEntry } from './selectors'
import { syncWithReactQuery } from './syncWithReactQuery'
import { EntryMap } from './types'

// These are fields we never want to merge -
// we should always prefer the latest update from
// backend.
const forceUpdateKeys = new Set([
  'field_visibility',
  'followee_reposts',
  'followee_saves',
  'stream_conditions',
  'download_conditions'
])

// Customize lodash recursive merge to never merge
// the forceUpdateKeys, and special-case
// playlist_contents
export const mergeCustomizer = (objValue: any, srcValue: any, key: string) => {
  if (forceUpdateKeys.has(key)) {
    return srcValue
  }

  if (key === 'is_verified') {
    return srcValue || objValue
  }

  // Delete is unidirectional (after marked deleted, future updates are not reflected)
  if (key === 'is_delete' && objValue === true && srcValue === false) {
    return objValue
  }

  // Not every user request provides collectible lists,
  // so always prefer it's existence, starting with latest
  if (key === 'collectibleList' || key === 'solanaCollectibleList') {
    return srcValue || objValue
  }

  if (key === 'stream_conditions' || key === 'download_conditions') {
    return srcValue || objValue
  }

  // For playlist_contents, this is trickier.
  // We want to never merge because playlists can have
  // tracks be deleted since last time, but
  // new fetches won't have UIDs, so we need to preserve those.
  if (objValue && key === 'playlist_contents') {
    // Map out tracks keyed by id, but store as an array-value
    // because a playlist can contain multiple of the same track id
    const trackMap = {}
    objValue.track_ids.forEach((t: { track: any }) => {
      const id = t.track
      if (id in trackMap) {
        trackMap[id].push(t)
      } else {
        trackMap[id] = [t]
      }
    })

    const trackIds = srcValue.track_ids.map((t: { track: string | number }) => {
      const mappedList = trackMap[t.track]
      if (!mappedList) return t

      const mappedTrack = mappedList.shift()
      if (!mappedTrack?.uid) return t

      return {
        ...t,
        uid: mappedTrack.uid
      }
    })

    return { ...srcValue, track_ids: trackIds }
  }
}

function* watchAddSucceeded() {
  const queryClient = yield* getContext('queryClient')
  yield* takeEvery(
    ADD_SUCCEEDED,
    function* (action: ReturnType<typeof addSucceeded>) {
      const getFeatureEnabled = yield* getContext('getFeatureEnabled')

      const isReactQuerySyncEnabled = yield* call(
        getFeatureEnabled,
        FeatureFlags.REACT_QUERY_SYNC
      )

      if (!isReactQuerySyncEnabled) return
      // For any entity type, sync to React Query
      syncWithReactQuery(queryClient, {
        [action.kind]: {
          ...action.entries.reduce((acc, entry) => {
            acc[entry.id] = entry.metadata
            return acc
          }, {} as EntryMap)
        }
      })
    }
  )
}

function* watchAddEntries() {
  const queryClient = yield* getContext('queryClient')
  yield* takeEvery(
    ADD_ENTRIES,
    function* (action: ReturnType<typeof addEntries>) {
      const { entriesByKind, source } = action

      const getFeatureEnabled = yield* getContext('getFeatureEnabled')
      const isReactQuerySyncEnabled = yield* call(
        getFeatureEnabled,
        FeatureFlags.REACT_QUERY_SYNC
      )

      if (!isReactQuerySyncEnabled) return

      // Skip if the source is react-query to avoid infinite loops
      if (source === 'react-query') return

      // Sync all entries to React Query
      syncWithReactQuery(queryClient, entriesByKind)
    }
  )
}

function* watchUpdate() {
  const queryClient = yield* getContext('queryClient')
  yield* takeEvery(UPDATE, function* (action: ReturnType<typeof update>) {
    const { entries, kind } = action
    const getFeatureEnabled = yield* getContext('getFeatureEnabled')
    const isReactQuerySyncEnabled = yield* call(
      getFeatureEnabled,
      FeatureFlags.REACT_QUERY_SYNC
    )

    if (!isReactQuerySyncEnabled) return

    // For any entity type, sync to React Query using the latest state from Redux
    const entriesMap = {} as EntryMap
    for (const entry of entries) {
      // Update requests will typically only have the updated metadata fields
      // but syncWithReactQuery expects the full entry - so we merge them here
      const fullEntry = yield* select(getEntry, {
        kind,
        id: entry.id
      })
      if (fullEntry) {
        // note: we use a special merge function avoiding certain fields - see above
        entriesMap[entry.id] = mergeWith(
          {},
          fullEntry,
          entry.metadata,
          mergeCustomizer
        )
      }
    }
    syncWithReactQuery(queryClient, {
      [kind]: entriesMap
    })
  })
}

function* watchIncrement() {
  const queryClient = yield* getContext('queryClient')
  yield* takeEvery(INCREMENT, function* (action: ReturnType<typeof increment>) {
    const getFeatureEnabled = yield* getContext('getFeatureEnabled')
    const isReactQuerySyncEnabled = yield* call(
      getFeatureEnabled,
      FeatureFlags.REACT_QUERY_SYNC
    )

    if (!isReactQuerySyncEnabled) return

    // For increment actions, we need to merge the delta with existing data
    // First get all existing entries from Redux
    const existingEntries = yield* all(
      action.entries.map((entry) =>
        select(getEntry, {
          kind: action.kind,
          id: entry.id
        })
      )
    )
    const existingEntriesMap = action.entries.reduce(
      (acc, entry, index) => {
        const existingEntry = existingEntries[index]
        acc[entry.id] = existingEntry ?? undefined
        return acc
      },
      {} as Record<string, any>
    )

    // Transform entries into the format expected by syncWithReactQuery
    syncWithReactQuery(queryClient, {
      [action.kind]: existingEntriesMap
    })
  })
}

const sagas = () => {
  return [watchAddSucceeded, watchAddEntries, watchUpdate, watchIncrement]
}

export default sagas
