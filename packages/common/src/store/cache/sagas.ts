import { call, select, takeEvery, all } from 'typed-redux-saga'

import { FeatureFlags } from '~/services/remote-config/feature-flags'

import { getContext } from '../effects'

import { INCREMENT, increment } from './actions'
import { getEntry } from './selectors'
import { syncWithReactQuery } from './syncWithReactQuery'

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
  return [watchIncrement]
}

export default sagas
