import { AppState } from 'store/types'
import { ID } from 'models/common/Identifiers'

const getBase = (state: AppState) => state.application.ui.stemsUpload
export const getCurrentUploads = (state: AppState, parentTrackId: ID) => {
  const uploads = getBase(state).uploadsInProgress[parentTrackId]
  if (!uploads) return []
  return Object.values(uploads).flat()
}
