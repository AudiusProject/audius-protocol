import { CommonState } from '../commonStore'

export const getStems = (state: CommonState) => state.upload.stems
export const getUploadProgress = (state: CommonState) =>
  state.upload.uploadProgress
export const getUploadSuccess = (state: CommonState) => state.upload.success
export const getTracks = (state: CommonState) => state.upload.tracks
export const getIsUploading = (state: CommonState) => state.upload.uploading
export const getShouldReset = (state: CommonState) => state.upload.shouldReset

const UPLOAD_WEIGHT = 0.8
const TRANSCODE_WEIGHT = 1 - UPLOAD_WEIGHT

export const getUploadPercentage = (state: CommonState) => {
  const uploadProgress = getUploadProgress(state)
  if (uploadProgress === null) return 0

  // Upload progress
  const allLoaded = uploadProgress.reduce(
    (acc, progress) => acc + (progress.loaded ?? 0),
    0
  )

  const allTotal = uploadProgress.reduce(
    (acc, progress) => acc + (progress.total ?? 0),
    0
  )
  const overallUpload = allTotal > 0 ? allLoaded / allTotal : 0

  // Transcode progress
  const transcodeProgress = uploadProgress.filter(
    (progress) => progress.transcode !== undefined
  )
  const overallTranscode = transcodeProgress.length
    ? transcodeProgress.reduce(
        (acc, progress) => acc + (progress.transcode ?? 0),
        0
      ) / transcodeProgress.length
    : 0

  const overallProgress =
    100 * (UPLOAD_WEIGHT * overallUpload + TRANSCODE_WEIGHT * overallTranscode)
  console.log(uploadProgress)
  console.log({ overallUpload, overallTranscode, overallProgress })

  return overallProgress
}
