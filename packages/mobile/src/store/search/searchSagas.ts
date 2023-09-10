import AsyncStorage from '@react-native-async-storage/async-storage'
import { uniq } from 'lodash'
import { call, put, select } from 'typed-redux-saga'

import { SEARCH_HISTORY_KEY } from 'app/constants/storage-keys'

import { setHistory } from './searchSlice'
import { getSearchHistory } from './selectors'

function* syncLegacySearchHistory() {
  const legacySearchHistoryJson = yield* call(
    [AsyncStorage, AsyncStorage.getItem],
    SEARCH_HISTORY_KEY
  )

  if (!legacySearchHistoryJson) {
    return
  }

  const legacySearchHistory: string[] = JSON.parse(legacySearchHistoryJson)

  if (!Array.isArray(legacySearchHistory)) {
    yield* call([AsyncStorage, AsyncStorage.removeItem], SEARCH_HISTORY_KEY)
    return
  }

  const persistedSearchHistory = yield* select(getSearchHistory)

  const mergedSearchHistory = uniq([
    ...persistedSearchHistory,
    ...legacySearchHistory
  ])

  yield* put(setHistory({ searchHistory: mergedSearchHistory }))
  yield* call([AsyncStorage, AsyncStorage.removeItem], SEARCH_HISTORY_KEY)
}

export function searchSagas() {
  return [syncLegacySearchHistory]
}
