import { CommonState } from '../commonStore'

export const getStems = (state: CommonState) => state.upload.stems
export const getUploadProgress = (state: CommonState) =>
  state.upload.uploadProgress
export const getUploadSuccess = (state: CommonState) => state.upload.success
export const getTracks = (state: CommonState) => state.upload.tracks
