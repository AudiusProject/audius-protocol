import AsyncStorage from '@react-native-community/async-storage'
import { useCallback, useEffect, useState } from 'react'
import { useSelector, useDispatch } from 'react-redux'
import * as searchActions from './actions'
import { getSearchHistory } from './selectors'

const SEARCH_HISTORY_KEY = '@search-history'

const fetchSearchHistory = async () => {
  try {
    const searchHistory = await AsyncStorage.getItem(SEARCH_HISTORY_KEY)
    const parsedSearchHistory = searchHistory ? JSON.parse(searchHistory) : []
    if (Array.isArray(parsedSearchHistory)) return parsedSearchHistory
    await clearSearchHistory()
    return []
  } catch (error) {
    await clearSearchHistory()
    return []
  }
}

export const clearSearchHistory = async () => {
  await AsyncStorage.setItem(SEARCH_HISTORY_KEY, JSON.stringify([]))
}

export const setSearchHistory = async (history: string[]) => {
  await AsyncStorage.setItem(SEARCH_HISTORY_KEY, JSON.stringify(history))
}

/**
 * Invokes `callback` every `frequency` sessions
 * @param callback
 * @param frequency
 * @param startAt which session to start at
 */
const useSearchHistory = () => {
  // Memoize each time the callback is invoked to guard against callback
  // being redefined each rernder and over triggering
  const searchHistory = useSelector(getSearchHistory)
  const dispatch = useDispatch()

  useEffect(() => {
    const work = async () => {
      const history = await fetchSearchHistory()
      dispatch(searchActions.setSearchHistory(history))
    }
    work()
  }, [dispatch])

  const clearHistory = useCallback(async () => {
    dispatch(searchActions.setSearchHistory([]))
    await clearSearchHistory()
  }, [dispatch])  

  const appendSearchItem = useCallback(async (query: string) => {
    const updatedHistory = [query, ...searchHistory]
    dispatch(searchActions.setSearchHistory(updatedHistory))
    await setSearchHistory(updatedHistory)
  }, [searchHistory, dispatch])  

  return {
    searchHistory,
    clearHistory,
    appendSearchItem
  }
}

export default useSearchHistory
