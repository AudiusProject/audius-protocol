import type { Nullable } from '@audius/common/utils'
import AsyncStorage from '@react-native-async-storage/async-storage'
import type { PayloadAction } from '@reduxjs/toolkit'
import { createSlice } from '@reduxjs/toolkit'
import { persistReducer } from 'redux-persist'

export type SearchState = {
  history: string[]
}

const initialState: SearchState = {
  history: []
}

export type SetSearchHistoryAction = PayloadAction<{
  searchHistory: string[]
}>

export type AddSearchHistoryItemAction = PayloadAction<{
  searchItem: Nullable<string>
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
      const trimmedItem = searchItem.trim()
      if (trimmedItem === '') return state
      const filteredSearch = state.history.filter(
        (term) => term !== trimmedItem
      )
      state.history = [trimmedItem, ...filteredSearch]
    }
  }
})

export const { setHistory, clearHistory, addItem } = slice.actions

const searchPersistConfig = {
  key: 'search',
  storage: AsyncStorage,
  whitelist: ['history']
}

const persistedSearchReducer = persistReducer(
  searchPersistConfig,
  slice.reducer
)

export default persistedSearchReducer
