import { Favorite } from '~/models/Favorite'

import { LibraryCategory, LibraryCategoryType, SavedPageTabs } from './types'

export const FETCH_SAVES = 'SAVED/FETCH_SAVES'
export const FETCH_SAVES_REQUESTED = 'SAVED/FETCH_SAVES_REQUESTED'
export const FETCH_SAVES_SUCCEEDED = 'SAVED/FETCH_SAVES_SUCCEEDED'
export const FETCH_SAVES_FAILED = 'SAVED/FETCH_SAVES_FAILED'

export const FETCH_MORE_SAVES = 'SAVED/FETCH_MORE_SAVES'
export const FETCH_MORE_SAVES_SUCCEEDED = 'SAVED/FETCH_MORE_SAVES_SUCCEEDED'
export const FETCH_MORE_SAVES_FAILED = 'SAVED/FETCH_MORE_SAVES_FAILED'

// Reached the end of the list before hitting the total number of saves
// Usually when filtering
export const END_FETCHING = 'SAVED/END_FETCHING'

export const SET_SELECTED_CATEGORY = 'SAVED/SET_SELECTED_CATEGORY'

export const fetchSaves = (
  // the filter query for the "get tracks" query
  query = '',
  category: LibraryCategoryType = LibraryCategory.Favorite,
  // the sort method for the "get tracks" query
  sortMethod = '',
  // the sort direction for the "get tracks" query
  sortDirection = '',
  // the offset into the "get tracks" query
  offset = 0,
  // the limit for the "get tracks" query
  limit = 50
) => ({
  type: FETCH_SAVES,
  category,
  offset,
  limit,
  query,
  sortMethod,
  sortDirection
})

export const fetchMoreSaves = (
  // the filter query for the "get tracks" query
  query = '',
  category: LibraryCategoryType = LibraryCategory.Favorite,
  // the sort method for the "get tracks" query
  sortMethod = '',
  // the sort direction for the "get tracks" query
  sortDirection = '',
  // the offset into the "get tracks" query
  offset = 0,
  // the limit for the "get tracks" query
  limit = 50
) => ({
  type: FETCH_MORE_SAVES,
  category,
  offset,
  limit,
  query,
  sortMethod,
  sortDirection
})

export const fetchSavesRequested = () => ({
  type: FETCH_SAVES_REQUESTED
})

export const fetchSavesSucceeded = (saves: Favorite[]) => ({
  type: FETCH_SAVES_SUCCEEDED,
  saves
})

export const fetchSavesFailed = () => ({
  type: FETCH_SAVES_FAILED
})

export const fetchMoreSavesSucceeded = (saves: Favorite[], offset: number) => ({
  type: FETCH_MORE_SAVES_SUCCEEDED,
  saves,
  offset
})

export const fetchMoreSavesFailed = () => ({
  type: FETCH_MORE_SAVES_FAILED
})

export const endFetching = (endIndex: number) => ({
  type: END_FETCHING,
  endIndex
})

export const setSelectedCategory = ({
  category,
  currentTab
}: {
  category: LibraryCategoryType
  currentTab: SavedPageTabs
}) => ({
  type: SET_SELECTED_CATEGORY,
  category,
  currentTab
})
