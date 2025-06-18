import { CommonState } from '~/store/commonStore'

import { ID } from '../../models/Identifiers'

const getBase = (state: CommonState) => state.stemsUpload

export const getCurrentUploads = (state: CommonState, parentTrackId: ID) => {
  const uploads = getBase(state).uploadsInProgress[parentTrackId]
  if (!uploads) return []
  return Object.values(uploads).flat()
}

export const getIsUploadingStems = (state: CommonState) => {
  const uploads = getBase(state).uploadsInProgress
  return Object.values(uploads).some((parentTrackUploads) =>
    Object.values(parentTrackUploads).some((uploads) => uploads.length > 0)
  )
}
