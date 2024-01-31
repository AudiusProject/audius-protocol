import {
  accountSelectors,
  profilePageTracksLineupActions,
  profilePageSelectors,
  uploadActions
} from '@audius/common/store'

import { Kind } from '@audius/common/models'
import { makeUid } from '@audius/common/utils'
import { put, select, takeEvery } from 'typed-redux-saga'

const { UPLOAD_TRACKS_SUCCEEDED, uploadTracksSucceeded } = uploadActions
const { getUserHandle } = accountSelectors
const { getTrackSource } = profilePageSelectors

type UploadTracksSucceededAction = ReturnType<typeof uploadTracksSucceeded>

export function* watchUploadTracksSaga() {
  yield* takeEvery(UPLOAD_TRACKS_SUCCEEDED, addUploadedTrackToLineup)
}

function* addUploadedTrackToLineup(action: UploadTracksSucceededAction) {
  const { id, trackMetadatas } = action
  const accountHandle = yield* select(getUserHandle)
  if (!id || !trackMetadatas || !accountHandle) return

  // We will only be adding single track uploads since multi-adds for lineups
  // are cumbersome. When we want to suport multi-track upload on mobile or
  // properly cache desktop profile lineups, we should revisit this.
  if (trackMetadatas.length > 1) return

  const [uploadedTrack] = trackMetadatas
  const { track_id } = uploadedTrack
  const source = yield* select(getTrackSource, accountHandle)

  const uploadedTrackLineupEntry = {
    kind: Kind.TRACKS,
    id: track_id,
    uid: makeUid(Kind.TRACKS, track_id),
    source
  }

  yield* put(
    profilePageTracksLineupActions.add(
      uploadedTrackLineupEntry,
      track_id,
      accountHandle,
      true
    )
  )
}
