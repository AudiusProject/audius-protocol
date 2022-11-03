import { CommonState } from '../commonStore'

export const getStems = (state: CommonState) => state.upload.stems
export const getUploadProgress = (state: CommonState) =>
  state.upload.uploadProgress
