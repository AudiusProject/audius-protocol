import { floor, clamp } from 'lodash'

import { CommonState } from '../commonStore'

export const getStems = (state: CommonState) => state.upload.stems
export const getUploadProgress = (state: CommonState) =>
  state.upload.uploadProgress
export const getUploadSuccess = (state: CommonState) => state.upload.success
export const getTracks = (state: CommonState) => state.upload.tracks
export const getIsUploading = (state: CommonState) => state.upload.uploading
export const getShouldReset = (state: CommonState) => state.upload.shouldReset

// Should sum to 1
const UPLOAD_WEIGHT = 0.5
const TRANSCODE_WEIGHT = 1 - UPLOAD_WEIGHT

// Should sum to 1
const AUDIO_WEIGHT = 1
const ART_WEIGHT = 0

const getKeyUploadProgress = (state: CommonState, key: 'art' | 'audio') => {
  const uploadProgress = getUploadProgress(state)
  if (uploadProgress == null) return 0

  const filteredProgress = uploadProgress.filter((progress) => key in progress)
  if (filteredProgress.length === 0) return 0

  const loaded = filteredProgress.reduce(
    (acc, progress) => acc + (progress[key].loaded ?? 0),
    0
  )
  const total = filteredProgress.reduce(
    (acc, progress) => acc + (progress[key].total ?? 0),
    0
  )
  const fileUploadProgress = total > 0 ? loaded / total : 0

  const transcodeProgress =
    filteredProgress.reduce(
      (acc, progress) => acc + (progress[key].transcode ?? 0),
      0
    ) / filteredProgress.length

  const overallProgress =
    key === 'art'
      ? fileUploadProgress
      : UPLOAD_WEIGHT * fileUploadProgress +
        TRANSCODE_WEIGHT * transcodeProgress

  return overallProgress
}

export const getCombinedUploadPercentage = (state: CommonState) => {
  const artProgress = getKeyUploadProgress(state, 'art')
  const audioProgress = getKeyUploadProgress(state, 'audio')
  const percent = floor(
    100 * (ART_WEIGHT * artProgress + AUDIO_WEIGHT * audioProgress)
  )
  return clamp(percent, 0, 100)
}
