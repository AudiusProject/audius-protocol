import RNFetchBlob from 'rn-fetch-blob'
import { takeEvery, call } from 'typed-redux-saga'

import { getLocalTrackDir } from 'app/services/offline-downloader'

import type { RemoveTrackDownloadsAction } from '../slice'
import { removeTrackDownloads } from '../slice'

function* removeTracksFromDisk(action: RemoveTrackDownloadsAction) {
  const { trackIds } = action.payload
  for (const trackId of trackIds) {
    const trackDirectory = yield* call(getLocalTrackDir, trackId.toString())
    yield* call(RNFetchBlob.fs.unlink, trackDirectory)
  }
}

export function* watchRemoveTrackDownloads() {
  yield* takeEvery(removeTrackDownloads.type, removeTracksFromDisk)
}
