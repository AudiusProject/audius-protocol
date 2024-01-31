import { createSelector } from 'reselect'

import { CommonState } from '~/store/commonStore'

import { ID } from '../../models/Identifiers'

const getBase = (state: CommonState) => state.stemsUpload

export const selectCurrentUploads = createSelector(
  [
    (state: CommonState) => getBase(state).uploadsInProgress,
    (_: CommonState, trackId: ID | undefined) => trackId
  ],
  (uploadsInProgress, trackId) => {
    if (!trackId) return []
    const uploads = uploadsInProgress[trackId]
    if (!uploads) return []
    return Object.values(uploads).flat()
  }
)

export const getCurrentUploads = (state: CommonState, parentTrackId: ID) => {
  const uploads = getBase(state).uploadsInProgress[parentTrackId]
  if (!uploads) return []
  return Object.values(uploads).flat()
}
