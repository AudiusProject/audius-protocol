import { Name } from '@audius/common'
import { takeEvery, put, call, select } from 'typed-redux-saga/macro'

import { getTrack } from 'common/store/cache/tracks/selectors'
import { setVisibility } from 'common/store/ui/modals/slice'
import {
  getAccessToken,
  getIsAuthenticated,
  getOpenId,
  getTrack as getTrackToShare
} from 'common/store/ui/share-sound-to-tiktok-modal/selectors'
import {
  authenticated,
  open,
  requestOpen,
  setIsAuthenticated,
  setStatus,
  share,
  upload
} from 'common/store/ui/share-sound-to-tiktok-modal/slice'
import { Status } from 'common/store/ui/share-sound-to-tiktok-modal/types'
import { getErrorMessage } from 'common/utils/error'
import { encodeHashId } from 'common/utils/hashIds'
import { show as showConfetti } from 'components/music-confetti/store/slice'
import { apiClient } from 'services/audius-api-client'
import { make } from 'store/analytics/actions'
import { AppState } from 'store/types'

const TIKTOK_SHARE_SOUND_ENDPOINT =
  'https://open-api.tiktok.com/share/sound/upload/'

// Because the track blob cannot live in an action (not a POJO),
// we are creating a singleton here to store it
let trackBlob: Blob | null = null

function* handleRequestOpen(action: ReturnType<typeof requestOpen>) {
  const track = yield* select((state: AppState) =>
    getTrack(state, { id: action.payload.id })
  )
  if (!track) return

  yield* put(
    open({
      track: {
        id: track.track_id,
        title: track.title,
        duration: track.duration
      }
    })
  )
  yield* put(setVisibility({ modal: 'ShareSoundToTikTok', visible: true }))
}

async function* handleShare() {
  yield* put(make(Name.TIKTOK_START_SHARE_SOUND, {}))

  yield* put(setStatus({ status: Status.SHARE_STARTED }))

  const track = yield* select(getTrackToShare)
  if (!track) return
  const { id } = track

  try {
    // Fetch the track blob
    const encodedTrackId = encodeHashId(id)

    const response = yield* call(
      window.fetch,
      apiClient.makeUrl(`/tracks/${encodedTrackId}/stream`)
    )

    if (!response.ok) {
      throw new Error('TikTok Share sound request unsuccessful')
    }

    trackBlob = await response.blob()

    // If already authed with TikTok, start the upload
    const authenticated = yield* select(getIsAuthenticated)
    if (authenticated) {
      yield* put(upload())
    }
  } catch (error) {
    const errorMessage = getErrorMessage(error)
    console.log(errorMessage)
    yield* put(make(Name.TIKTOK_SHARE_SOUND_ERROR, { error: errorMessage }))
    yield* put(setStatus({ status: Status.SHARE_ERROR }))
  }
}

function* handleAuthenticated(action: ReturnType<typeof authenticated>) {
  yield* put(setIsAuthenticated())

  // If track blob already downloaded, start the upload
  if (trackBlob) {
    yield* put(upload())
  }
}

function* handleUpload() {
  // Upload the track blob to TikTok api
  const formData = new FormData()
  formData.append('sound_file', trackBlob as Blob)

  const openId = yield* select(getOpenId)
  const accessToken = yield* select(getAccessToken)

  try {
    const response = yield* call(
      window.fetch,
      `${TIKTOK_SHARE_SOUND_ENDPOINT}?open_id=${openId}&access_token=${accessToken}`,
      {
        method: 'POST',
        mode: 'cors',
        body: formData
      }
    )

    if (!response.ok) {
      throw new Error('TikTok Share sound request unsuccessful')
    }

    yield* put(make(Name.TIKTOK_COMPLETE_SHARE_SOUND, {}))
    yield* put(setStatus({ status: Status.SHARE_SUCCESS }))
    yield* put(showConfetti())
  } catch (error) {
    const errorMessage = getErrorMessage(error)
    console.log(errorMessage)
    yield* put(make(Name.TIKTOK_SHARE_SOUND_ERROR, { error: errorMessage }))
    yield* put(setStatus({ status: Status.SHARE_ERROR }))
  } finally {
    trackBlob = null
  }
}

function* watchHandleRequestOpen() {
  yield* takeEvery(requestOpen, handleRequestOpen)
}

function* watchHandleShare() {
  yield* takeEvery(share, handleShare)
}

function* watchHandleAuthenticated() {
  yield* takeEvery(authenticated, handleAuthenticated)
}

function* watchHandleUpload() {
  yield* takeEvery(upload, handleUpload)
}

export default function sagas() {
  return [
    watchHandleRequestOpen,
    watchHandleShare,
    watchHandleAuthenticated,
    watchHandleUpload
  ]
}
