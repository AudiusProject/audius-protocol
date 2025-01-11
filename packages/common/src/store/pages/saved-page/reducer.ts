import { Storage, persistReducer } from 'redux-persist'

import { asLineup } from '~/store/lineup/reducer'
import {
  END_FETCHING,
  FETCH_MORE_SAVES,
  FETCH_MORE_SAVES_FAILED,
  FETCH_MORE_SAVES_SUCCEEDED,
  FETCH_SAVES,
  FETCH_SAVES_FAILED,
  FETCH_SAVES_REQUESTED,
  FETCH_SAVES_SUCCEEDED,
  SET_SELECTED_CATEGORY
} from '~/store/pages/saved-page/actions'
import tracksReducer, {
  initialState as initialLineupState
} from '~/store/pages/saved-page/lineups/tracks/reducer'
import { signOut } from '~/store/sign-out/slice'
import { ActionsMap } from '~/utils/reducer'

import { PREFIX as tracksPrefix } from './lineups/tracks/actions'
import { LibraryCategory, SavedPageState } from './types'
import { calculateNewLibraryCategories } from './utils'

const initialState = {
  trackSaves: [],
  initialFetch: false,
  hasReachedEnd: false,
  fetchingMore: false,
  tracks: initialLineupState,
  tracksCategory: LibraryCategory.Favorite,
  collectionsCategory: LibraryCategory.Favorite
} as SavedPageState

const actionsMap: ActionsMap<SavedPageState> = {
  [FETCH_SAVES](state) {
    return {
      ...state
    }
  },
  [FETCH_SAVES_REQUESTED](state) {
    return {
      ...state,
      initialFetch: true,
      hasReachedEnd: false
    }
  },
  [FETCH_SAVES_SUCCEEDED](state, action) {
    return {
      ...state,
      trackSaves: action.saves,
      initialFetch: false
    }
  },
  [FETCH_MORE_SAVES](state) {
    return {
      ...state,
      fetchingMore: true
    }
  },
  [FETCH_SAVES_FAILED](state) {
    return {
      ...state,
      fetchingMore: false,
      trackSaves: []
    }
  },
  [FETCH_MORE_SAVES_SUCCEEDED](state, action) {
    const savesCopy = state.trackSaves.slice()
    savesCopy.splice(action.offset, action.saves.length, ...action.saves)

    return {
      ...state,
      fetchingMore: false,
      trackSaves: savesCopy
    }
  },
  [FETCH_MORE_SAVES_FAILED](state) {
    return { ...state }
  },
  [END_FETCHING](state, action) {
    const savesCopy = state.trackSaves.slice(0, action.endIndex)
    return {
      ...state,
      trackSaves: savesCopy,
      hasReachedEnd: true
    }
  },
  [SET_SELECTED_CATEGORY](state, action) {
    return {
      ...state,
      ...calculateNewLibraryCategories({
        currentTab: action.currentTab,
        chosenCategory: action.category,
        prevTracksCategory: state.tracksCategory
      })
    }
  },
  [signOut.type]() {
    return initialState
  }
}

const tracksLineupReducer = asLineup(tracksPrefix, tracksReducer)

export const savePageReducer = (state = initialState, action: any) => {
  const tracks = tracksLineupReducer(state.tracks as any, action)
  if (tracks !== state.tracks) return { ...state, tracks }

  const matchingReduceFunction = actionsMap[action.type]
  if (!matchingReduceFunction) return state
  return matchingReduceFunction(state, action)
}

export const savedPagePersistConfig = (storage: Storage) => ({
  key: 'saved-page',
  storage,
  whitelist: ['tracksCategory', 'collectionsCategory']
})

export const persistedSavePageReducer = (storage: Storage) => {
  return persistReducer(savedPagePersistConfig(storage), savePageReducer)
}
