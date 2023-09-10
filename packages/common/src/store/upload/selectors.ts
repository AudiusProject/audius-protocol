import { CommonState } from '../commonStore'

export const getStems = (state: CommonState) => state.upload.stems
export const getUploadProgress = (state: CommonState) =>
  state.upload.uploadProgress
export const getUploadSuccess = (state: CommonState) => state.upload.success
export const getTracks = (state: CommonState) => state.upload.tracks
export const getIsUploading = (state: CommonState) => state.upload.uploading
export const getShouldReset = (state: CommonState) => state.upload.shouldReset

export const getUploadPercentage = (state: CommonState) => {
  const uploadProgress = getUploadProgress(state)
  if (uploadProgress === null) return 0

  const fullProgress = uploadProgress.reduce(
    (acc, progress) => acc + progress.loaded,
    0
  )

  const totalProgress = uploadProgress.reduce(
    (acc, progress) => acc + progress.total,
    0
  )

  return (fullProgress / totalProgress) * 100
}
