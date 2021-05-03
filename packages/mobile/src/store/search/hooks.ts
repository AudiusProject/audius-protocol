import AsyncStorage from '@react-native-community/async-storage'
import { useCallback, useEffect, useRef, useState } from 'react'
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

const useSearchHistory = () => {
  const searchHistory = useSelector(getSearchHistory)
  const dispatch = useDispatch()
  const [hasFetched, setHasFetched] = useState(false)

  const searchHistoryInstance = useRef(searchHistory)
  useEffect(() => {
    searchHistoryInstance.current = searchHistory
  }, [searchHistory])

  useEffect(() => {
    const work = async () => {
      const history = await fetchSearchHistory()
      dispatch(searchActions.setSearchHistory(history))
      setHasFetched(true)
    }
    work()
  }, [dispatch, setHasFetched])

  const clearHistory = useCallback(async () => {
    dispatch(searchActions.setSearchHistory([]))
    await clearSearchHistory()
  }, [dispatch])

  const appendSearchItem = useCallback(
    async (query: string) => {
      const trimmedQuery = query.trim()
      if (trimmedQuery === '') return
      const filteredSearch = searchHistory.filter(term => term !== trimmedQuery)
      const updatedHistory = [trimmedQuery, ...filteredSearch]
      dispatch(searchActions.setSearchHistory(updatedHistory))
      await setSearchHistory(updatedHistory)
    },
    [searchHistory, dispatch]
  )

  return {
    searchHistory: searchHistoryInstance,
    clearHistory,
    appendSearchItem,
    hasFetched
  }
}

export default useSearchHistory
