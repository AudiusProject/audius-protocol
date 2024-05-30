import { createSlice } from '@reduxjs/toolkit'
import type { Storage } from 'redux-persist'
import { persistReducer } from 'redux-persist'

import {
  AddSearchHistoryItemAction,
  RemoveSearchHistoryItemAction,
  SearchItem,
  SearchItemBackwardsCompatible,
  SearchState,
  SetSearchHistoryAction
} from './types'

const initialState: SearchState = {
  history: []
}

export const isSearchItem = (
  searchItem: SearchItemBackwardsCompatible
): searchItem is SearchItem => {
  return (searchItem as SearchItem).kind !== undefined
}

const slice = createSlice({
  name: 'search',
  initialState,
  reducers: {
    setHistory: (state, action: SetSearchHistoryAction) => {
      state.history = action.payload.searchHistory
    },
    clearHistory: (state) => {
      state.history = []
    },
    addItem: (state, action: AddSearchHistoryItemAction) => {
      const { searchItem } = action.payload
      if (!searchItem) return state

      if (isSearchItem(searchItem)) {
        const filteredSearch = state.history.filter(
          (i) => !isSearchItem(i) || i.id !== searchItem.id
        )
        state.history = [searchItem, ...filteredSearch]
        return state
      }

      const trimmedItem = searchItem.trim()
      if (trimmedItem === '') return state
      const filteredSearch = state.history.filter(
        (term) => term !== trimmedItem
      )
      state.history = [trimmedItem, ...filteredSearch]
      return state
    },
    removeItem: (state, action: RemoveSearchHistoryItemAction) => {
      const { searchItem } = action.payload
      state.history = state.history.filter((item) => {
        if (isSearchItem(searchItem) && isSearchItem(item)) {
          return item.id !== searchItem.id || item.kind !== searchItem.kind
        } else {
          return item !== searchItem
        }
      })
    }
  }
})

export const actions = slice.actions

const persistedSearchReducer = (storage: Storage) => {
  const searchPersistConfig = {
    key: 'search',
    storage,
    whitelist: ['history']
  }
  return persistReducer(searchPersistConfig, slice.reducer)
}

export default persistedSearchReducer
