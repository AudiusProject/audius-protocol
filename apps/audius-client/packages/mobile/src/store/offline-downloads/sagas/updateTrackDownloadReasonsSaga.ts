import type { Nullable, Track } from '@audius/common'
import RNFetchBlob from 'rn-fetch-blob'
import { takeEvery, fork, call } from 'typed-redux-saga'

import { getLocalTrackJsonPath } from 'app/services/offline-downloader'

import type {
  TrackReasonsToUpdate,
  UpdateTrackDownloadReasonsAction
} from '../slice'
import { updateTrackDownloadReasons } from '../slice'

export function* watchUpdateTrackDownloadReasons() {
  yield* takeEvery(updateTrackDownloadReasons.type, saveDownloadReasonsToDisk)
}

function* saveDownloadReasonsToDisk(action: UpdateTrackDownloadReasonsAction) {
  const { reasons } = action.payload
  for (const reason of reasons) {
    yield* fork(saveDownloadReasonToDisk, reason)
  }
}

function* saveDownloadReasonToDisk(reason: TrackReasonsToUpdate) {
  const { trackId, reasons_for_download } = reason
  const trackPath = yield* call(getLocalTrackJsonPath, trackId.toString())
  const trackMetadata: Nullable<Track> = yield* call(
    RNFetchBlob.fs.readFile,
    trackPath,
    'utf8'
  )
  if (!trackMetadata) return

  const newTrackMetadata = {
    ...trackMetadata,
    offline: {
      ...trackMetadata.offline,
      reasons_for_download
    }
  }

  yield* call(
    RNFetchBlob.fs.writeFile,
    trackPath,
    JSON.stringify(newTrackMetadata)
  )
}
