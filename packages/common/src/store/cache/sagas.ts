import { call, takeEvery } from 'typed-redux-saga'

import { FeatureFlags } from '~/services/remote-config/feature-flags'

import { getContext } from '../effects'

import { ADD_ENTRIES, ADD_SUCCEEDED, addEntries, addSucceeded } from './actions'
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
            acc[entry.id] = entry
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

const sagas = () => {
  return [watchAddSucceeded, watchAddEntries]
}

export default sagas
