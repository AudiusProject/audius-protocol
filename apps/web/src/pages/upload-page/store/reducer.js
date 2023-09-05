import {
  TOGGLE_MULTI_TRACK_NOTIFICATION,
  UPLOAD_TRACKS_REQUESTED,
  UPLOAD_TRACKS_SUCCEEDED,
  UPLOAD_TRACKS_FAILED,
  UPLOAD_SINGLE_TRACK_FAILED,
  UPDATE_PROGRESS,
  RESET,
  RESET_STATE,
  UNDO_RESET_STATE
} from './actions'

const initialState = {
  openMultiTrackNotification: true,
  tracks: null,
  metadata: null,
  uploadType: null,
  stems: [],
  uploading: false,
  uploadProgress: null,
  success: false,
  shouldReset: false,

  // For multitrack upload, we allow some tracks to
  // fail without aborting the whole thing
  failedTrackIndices: [],

  // Id to take the user to after completing upload.
  // Can be either a track or playlist/album.
  completionId: null
}

const actionsMap = {
  [TOGGLE_MULTI_TRACK_NOTIFICATION](state, action) {
    return {
      ...state,
      openMultiTrackNotification: action.open
    }
  },
  [UPLOAD_TRACKS_REQUESTED](state, action) {
    const newState = { ...state }
    newState.uploading = true
    newState.tracks = action.tracks
    newState.uploadProgress = action.tracks.map((t) => ({}))
    newState.metadata = action.metadata
    newState.uploadType = action.uploadType
    newState.stems = action.stems
    return newState
  },
  [UPLOAD_TRACKS_SUCCEEDED](state, action) {
    const newState = { ...state }
    newState.uploading = false
    newState.success = true
    newState.completionId = action.id
    newState.uploadType = null
    newState.stems = []

    // Update the upload tracks with resulting metadata. This is used for TikTok sharing
    if (action.trackMetadatas) {
      newState.tracks = state.tracks.map((t, i) => ({
        ...t,
        metadata: action.trackMetadatas[i]
      }))
    }
    return newState
  },
  [UPLOAD_TRACKS_FAILED](state, action) {
    const newState = { ...state }
    newState.uploading = false
    newState.uploadType = null
    newState.tracks = null
    newState.metadata = null
    newState.stems = []
    return newState
  },
  [UPDATE_PROGRESS](state, action) {
    const newState = { ...state }
    newState.uploadProgress = [...state.uploadProgress]
    newState.uploadProgress[action.index] = {
      ...newState.uploadProgress[action.index],
      ...action.progress
    }
    return newState
  },
  [RESET](state, action) {
    return {
      ...initialState,
      openMultiTrackNotification: state.openMultiTrackNotification
    }
  },
  [RESET_STATE](state) {
    return {
      ...state,
      shouldReset: true
    }
  },
  [UNDO_RESET_STATE](state) {
    return {
      ...state,
      shouldReset: false
    }
  },
  [UPLOAD_SINGLE_TRACK_FAILED](state, action) {
    return {
      ...state,
      failedTrackIndices: [...state.failedTrackIndices, action.index]
    }
  }
}

export default function upload(state = initialState, action) {
  const matchingReduceFunction = actionsMap[action.type]
  if (!matchingReduceFunction) return state
  return matchingReduceFunction(state, action)
}
