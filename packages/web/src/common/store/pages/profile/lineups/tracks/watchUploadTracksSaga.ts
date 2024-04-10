import { Kind } from '@audius/common/models'
import {
  accountSelectors,
  profilePageTracksLineupActions,
  profilePageSelectors,
  uploadActions,
  CommonState,
  UploadType
} from '@audius/common/store'
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
  const accountHandle = yield* select(getUserHandle)
  const { uploadType, completedEntity } = yield* select(
    (state: CommonState) => state.upload
  )
  // We will only be adding single track uploads since multi-adds for lineups
  // are cumbersome. When we want to suport multi-track upload on mobile or
  // properly cache desktop profile lineups, we should revisit this.
  if (
    !completedEntity ||
    !accountHandle ||
    uploadType !== UploadType.INDIVIDUAL_TRACK
  )
    return

  const uploadedTrack = completedEntity
  const id = uploadedTrack.track_id
  const source = yield* select(getTrackSource, accountHandle)

  const uploadedTrackLineupEntry = {
    kind: Kind.TRACKS,
    id,
    uid: makeUid(Kind.TRACKS, id),
    source,
    ...uploadedTrack
  }

  yield* put(
    profilePageTracksLineupActions.add(
      uploadedTrackLineupEntry,
      id,
      accountHandle,
      true
    )
  )
}
