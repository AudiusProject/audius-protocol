export const FETCH_SAVES = 'SAVED/FETCH_SAVES'
export const FETCH_SAVES_SUCCEEDED = 'SAVED/FETCH_SAVES_SUCCEEDED'
export const FETCH_SAVES_FAILED = 'SAVED/FETCH_SAVES_FAILED'

export const ADD_LOCAL_SAVE = 'SAVED/ADD_LOCAL_SAVE'
export const REMOVE_LOCAL_SAVE = 'SAVED/REMOVE_LOCAL_SAVE'

export const fetchSaves = () => ({
  type: FETCH_SAVES
})

export const fetchSavesSucceeded = saves => ({
  type: FETCH_SAVES_SUCCEEDED,
  saves
})

export const fetchSavesFailed = () => ({
  type: FETCH_SAVES_FAILED
})

export const addLocalSave = (trackId, uid) => ({
  type: ADD_LOCAL_SAVE,
  trackId,
  uid
})

export const removeLocalSave = trackId => ({
  type: REMOVE_LOCAL_SAVE,
  trackId
})
