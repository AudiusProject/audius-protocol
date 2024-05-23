import type { PayloadAction } from '@reduxjs/toolkit'
import { createSlice } from '@reduxjs/toolkit'
import type { Storage } from 'redux-persist'
import { persistReducer } from 'redux-persist'

import { Nullable } from '~/utils/typeUtils'

import { SearchItem as SearchItemV2 } from './types'

type SearchItem = string | SearchItemV2

const isSearchItemV2 = (searchItem: SearchItem): searchItem is SearchItemV2 => {
  return (searchItem as SearchItemV2).kind !== undefined
}

export type SearchState = {
  history: SearchItem[]
}

const initialState: SearchState = {
  history: []
}

export type SetSearchHistoryAction = PayloadAction<{
  searchHistory: SearchItem[]
}>

export type AddSearchHistoryItemAction = PayloadAction<{
  searchItem: Nullable<SearchItem>
}>

export type RemoveSearchHistoryItemAction = PayloadAction<{
  searchItem: SearchItem
}>

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

      if (isSearchItemV2(searchItem)) {
        const filteredSearch = state.history.filter(
          (i) => !isSearchItemV2(i) || i.id !== searchItem.id
        )
        state.history = [searchItem, ...filteredSearch]
      } else {
        const trimmedItem = searchItem.trim()
        if (trimmedItem === '') return state
        const filteredSearch = state.history.filter(
          (term) => term !== trimmedItem
        )
        state.history = [trimmedItem, ...filteredSearch]
      }
    },
    removeItem: (state, action: RemoveSearchHistoryItemAction) => {
      const { searchItem } = action.payload
      state.history = state.history.filter((item) => {
        if (isSearchItemV2(searchItem) && isSearchItemV2(item)) {
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
