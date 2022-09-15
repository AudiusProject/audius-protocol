// @ts-nocheck
// TODO(nkang) - convert to TS
export const FETCH_SAVES = 'SAVED/FETCH_SAVES'
export const FETCH_SAVES_REQUESTED = 'SAVED/FETCH_SAVES_REQUESTEd'
export const FETCH_SAVES_SUCCEEDED = 'SAVED/FETCH_SAVES_SUCCEEDED'
export const FETCH_SAVES_FAILED = 'SAVED/FETCH_SAVES_FAILED'

export const FETCH_MORE_SAVES = 'SAVED/FETCH_MORE_SAVES'
export const FETCH_MORE_SAVES_SUCCEEDED = 'SAVED/FETCH_MORE_SAVES_SUCCEEDED'
export const FETCH_MORE_SAVES_FAILED = 'SAVED/FETCH_MORE_SAVES_FAILED'

export const ADD_LOCAL_SAVE = 'SAVED/ADD_LOCAL_SAVE'
export const REMOVE_LOCAL_SAVE = 'SAVED/REMOVE_LOCAL_SAVE'

export const fetchSaves = (
  // the filter query for the "get tracks" query
  query = '',
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
  offset,
  limit,
  query,
  sortMethod,
  sortDirection
})

export const fetchMoreSaves = (
  // the filter query for the "get tracks" query
  query = '',
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
  offset,
  limit,
  query,
  sortMethod,
  sortDirection
})

export const fetchSavesRequested = () => ({
  type: FETCH_SAVES_REQUESTED
})

export const fetchSavesSucceeded = (saves) => ({
  type: FETCH_SAVES_SUCCEEDED,
  saves
})

export const fetchSavesFailed = () => ({
  type: FETCH_SAVES_FAILED
})

export const fetchMoreSavesSucceeded = (saves, offset) => ({
  type: FETCH_MORE_SAVES_SUCCEEDED,
  saves,
  offset
})

export const fetchMoreSavesFailed = () => ({
  type: FETCH_MORE_SAVES_FAILED
})

export const addLocalSave = (trackId, uid) => ({
  type: ADD_LOCAL_SAVE,
  trackId,
  uid
})

export const removeLocalSave = (trackId) => ({
  type: REMOVE_LOCAL_SAVE,
  trackId
})
