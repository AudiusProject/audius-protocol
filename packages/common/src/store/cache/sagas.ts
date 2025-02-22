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
      // Get the latest state from Redux after the update
      const latestEntry = yield* select(getEntry, {
        kind,
        id: entry.id
      })
      if (latestEntry) {
        entriesMap[entry.id] = latestEntry
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
