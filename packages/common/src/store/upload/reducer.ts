import { cloneDeep } from 'lodash'

import { StemUploadWithFile } from '~/models'

import {
  TOGGLE_MULTI_TRACK_NOTIFICATION,
  UPLOAD_TRACKS_REQUESTED,
  UPLOAD_TRACKS_SUCCEEDED,
  UPLOAD_TRACKS_FAILED,
  UPDATE_PROGRESS,
  RESET,
  RESET_STATE,
  UNDO_RESET_STATE,
  uploadTracksRequested,
  uploadTracksSucceeded,
  updateProgress
} from './actions'
import {
  ProgressState,
  ProgressStatus,
  UploadState,
  TrackForUpload,
  UploadType
} from './types'

const initialState: UploadState = {
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
  completionId: null,
  error: false
}

const initialUploadState: ProgressState = {
  art: {
    status: ProgressStatus.UPLOADING,
    loaded: 0,
    total: 0,
    transcode: 0
  },
  audio: {
    status: ProgressStatus.UPLOADING,
    loaded: 0,
    total: 0,
    transcode: 0
  },
  stems: []
}
const getInitialProgress = (upload: TrackForUpload | StemUploadWithFile) => {
  const res = cloneDeep(initialUploadState)
  res.art.total =
    'artwork' in upload.metadata ? upload.metadata.artwork?.file?.size ?? 0 : 0
  res.audio.total = upload.file?.size ?? 0
  res.stems = upload.metadata.stems?.map(getInitialProgress) ?? []
  return res
}

const actionsMap = {
  [TOGGLE_MULTI_TRACK_NOTIFICATION](
    state: UploadState,
    action: { open: boolean }
  ) {
    return {
      ...state,
      openMultiTrackNotification: action.open
    }
  },
  [UPLOAD_TRACKS_REQUESTED](
    state: UploadState,
    action: ReturnType<typeof uploadTracksRequested>
  ) {
    const newState = { ...state }
    const { tracks, uploadType } = action.payload
    newState.uploading = true
    newState.tracks = tracks ?? null
    newState.uploadProgress = tracks?.map(getInitialProgress)
    newState.metadata =
      action.payload.uploadType === UploadType.ALBUM ||
      action.payload.uploadType === UploadType.PLAYLIST
        ? action.payload.metadata
        : null
    newState.uploadType = uploadType ?? null
    newState.error = false
    newState.success = false
    return newState
  },
  [UPLOAD_TRACKS_SUCCEEDED](
    state: UploadState,
    action: ReturnType<typeof uploadTracksSucceeded>
  ) {
    const { id, trackMetadatas } = action
    const newState = { ...state }
    newState.uploading = false
    newState.success = true
    newState.completionId = id
    newState.uploadType = null
    newState.stems = []

    // Update the upload tracks with resulting metadata. This is used for TikTok sharing
    if (trackMetadatas) {
      newState.tracks =
        state.tracks?.map((t, i) => ({
          ...t,
          metadata: {
            ...t.metadata,
            ...trackMetadatas[i]
          }
        })) ?? null
    }
    newState.completedEntity = action.completedEntity
    return newState
  },
  [UPLOAD_TRACKS_FAILED](state: UploadState) {
    const newState = { ...state }
    newState.uploading = false
    newState.uploadType = null
    newState.tracks = null
    newState.metadata = null
    newState.stems = []
    newState.error = true
    return newState
  },
  [UPDATE_PROGRESS](
    state: UploadState,
    action: ReturnType<typeof updateProgress>
  ) {
    const { key, trackIndex, stemIndex, progress } = action.payload
    const newState = { ...state }
    newState.uploadProgress = [...(state.uploadProgress ?? [])]
    if (!newState.uploadProgress[trackIndex]) {
      newState.uploadProgress[trackIndex] = cloneDeep(initialUploadState)
    }
    const prevProgress =
      stemIndex === null
        ? newState.uploadProgress[trackIndex]?.[key]
        : newState.uploadProgress[trackIndex]?.stems[stemIndex][key]
    const nextProgress = { ...prevProgress }
    nextProgress.status = progress.status
    if (progress.loaded && progress.total) {
      nextProgress.loaded = progress.loaded
      nextProgress.total = progress.total
    }
    if (progress.transcode) {
      nextProgress.transcode = Math.min(
        Math.max(progress.transcode, nextProgress.transcode ?? 0),
        1
      )
    }
    if (stemIndex === null) {
      newState.uploadProgress[trackIndex][key] = nextProgress
    } else {
      newState.uploadProgress[trackIndex].stems[stemIndex][key] = nextProgress
    }
    return newState
  },
  [RESET](state: UploadState) {
    return {
      ...initialState,
      openMultiTrackNotification: state.openMultiTrackNotification
    }
  },
  [RESET_STATE](state: UploadState) {
    return {
      ...state,
      shouldReset: true
    }
  },
  [UNDO_RESET_STATE](state: UploadState) {
    return {
      ...state,
      shouldReset: false
    }
  }
}

export default function upload(
  state = initialState,
  action: { type: keyof typeof actionsMap }
) {
  const matchingReduceFunction = actionsMap[action.type]
  if (!matchingReduceFunction) return state
  // @ts-ignore action type should be a unionType of all actions in actions.ts
  return matchingReduceFunction(state, action)
}
