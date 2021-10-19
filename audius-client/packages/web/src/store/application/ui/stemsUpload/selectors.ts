import { ID } from 'common/models/Identifiers'
import { AppState } from 'store/types'

const getBase = (state: AppState) => state.application.ui.stemsUpload
export const getCurrentUploads = (state: AppState, parentTrackId: ID) => {
  const uploads = getBase(state).uploadsInProgress[parentTrackId]
  if (!uploads) return []
  return Object.values(uploads).flat()
}
