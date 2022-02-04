import { ID } from 'common/models/Identifiers'
import { CommonState } from 'common/store'

const getBase = (state: CommonState) => state.stemsUpload
export const getCurrentUploads = (state: CommonState, parentTrackId: ID) => {
  const uploads = getBase(state).uploadsInProgress[parentTrackId]
  if (!uploads) return []
  return Object.values(uploads).flat()
}
