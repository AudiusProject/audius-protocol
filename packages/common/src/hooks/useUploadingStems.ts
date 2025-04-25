import { shallowEqual, useSelector } from 'react-redux'

import { ID } from '../models/Identifiers'
import { CommonState } from '../store/commonStore'
import { getCurrentUploads } from '../store/stems-upload/selectors'

/**
 * Returns an object for the current stem uploads for a given track id
 * @param {object} object that contains the track id whose stems are to be returned
 * @returns {object} the currently uploading stems
 */
export const useUploadingStems = (trackId: ID) => {
  const currentUploads = useSelector(
    (state: CommonState) => getCurrentUploads(state, trackId),
    shallowEqual
  )
  const uploadingTracks = currentUploads.map((u) => ({
    name: u.file?.name ?? '', // the file should always exist here
    size: u.file?.size ?? 0, // the file should always exist here
    category: u.category,
    downloadable: false
  }))
  return { uploadingTracks }
}
