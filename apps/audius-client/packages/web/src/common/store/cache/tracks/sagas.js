import {
  Name,
  DefaultSizes,
  SquareSizes,
  Kind,
  Status,
  makeKindId
} from '@audius/common'
import {
  all,
  call,
  fork,
  getContext,
  put,
  select,
  takeEvery,
  takeLatest
} from 'redux-saga/effects'

import {
  getAccountUser,
  getUserId,
  getUserHandle
} from 'common/store/account/selectors'
import { setDominantColors } from 'common/store/average-color/slice'
import { waitForBackendSetup } from 'common/store/backend/sagas'
import * as cacheActions from 'common/store/cache/actions'
import * as trackActions from 'common/store/cache/tracks/actions'
import { getTrack } from 'common/store/cache/tracks/selectors'
import { fetchUsers } from 'common/store/cache/users/sagas'
import { getUser } from 'common/store/cache/users/selectors'
import { squashNewLines, formatUrlName } from 'common/utils/formatUtil'
import * as signOnActions from 'pages/sign-on/store/actions'
import { fetchCID } from 'services/audius-backend'
import TrackDownload from 'services/audius-backend/TrackDownload'
import { make } from 'store/analytics/actions'
import * as confirmerActions from 'store/confirmer/actions'
import { confirmTransaction } from 'store/confirmer/sagas'
import { dominantColor } from 'utils/imageProcessingUtil'
import { waitForValue } from 'utils/sagaHelpers'

const NATIVE_MOBILE = process.env.REACT_APP_NATIVE_MOBILE

function* fetchRepostInfo(entries) {
  const userIds = []
  entries.forEach((entry) => {
    if (entry.metadata.followee_reposts) {
      entry.metadata.followee_reposts.forEach((repost) =>
        userIds.push(repost.user_id)
      )
    }
  })

  if (userIds.length) {
    yield call(fetchUsers, userIds)
  }
}

function* fetchSegment(metadata) {
  const audiusBackendInstance = yield getContext('audiusBackendInstance')
  const user = yield call(waitForValue, getUser, { id: metadata.owner_id })
  const gateways = audiusBackendInstance.getCreatorNodeIPFSGateways(
    user.creator_node_endpoint
  )
  if (!metadata.track_segments[0]) return
  const cid = metadata.track_segments[0].multihash
  return yield call(fetchCID, cid, gateways, /* cache */ false)
}

// TODO(AUD-1837) -- we should not rely on this logic anymore of fetching first
// segments, particularly to flag unauthorized content, but it should probably
// just be removed altogether since first segment fetch is usually fast.
function* fetchFirstSegments(entries) {
  // Segments aren't part of the critical path so let them resolve later.
  try {
    const firstSegments = yield all(
      entries.map((e) => call(fetchSegment, e.metadata))
    )

    yield put(
      cacheActions.update(
        Kind.TRACKS,
        firstSegments.map((s, i) => {
          if (s === 'Unauthorized') {
            return {
              id: entries[i].id,
              metadata: {
                is_delete: true,
                _blocked: true,
                _marked_deleted: true
              }
            }
          }
          return {
            id: entries[i].id,
            metadata: { _first_segment: s }
          }
        })
      )
    )
  } catch (err) {
    console.error(err)
  }
}

function* watchAdd() {
  yield takeEvery(cacheActions.ADD_SUCCEEDED, function* (action) {
    if (action.kind === Kind.TRACKS) {
      yield put(
        trackActions.setPermalinkStatus(
          action.entries
            .filter((entry) => !!entry.metadata.permalink)
            .map((entry) => ({
              permalink: entry.metadata.permalink,
              id: entry.id,
              status: Status.SUCCESS
            }))
        )
      )
      if (!NATIVE_MOBILE) {
        yield fork(fetchRepostInfo, action.entries)
        yield fork(fetchFirstSegments, action.entries)
      }
    }
  })
}

export function* trackNewRemixEvent(remixTrack) {
  const account = yield select(getAccountUser)
  const remixParentTrack = remixTrack.remix_of.tracks[0]
  const parentTrack = yield select(getTrack, {
    id: remixParentTrack.parent_track_id
  })
  const parentTrackUser = parentTrack
    ? yield select(getUser, { id: parentTrack.owner_id })
    : null
  yield put(
    make(Name.REMIX_NEW_REMIX, {
      id: remixTrack.track_id,
      handle: account.handle,
      title: remixTrack.title,
      parent_track_id: remixParentTrack.parent_track_id,
      parent_track_title: parentTrack ? parentTrack.title : '',
      parent_track_user_handle: parentTrackUser ? parentTrackUser.handle : ''
    })
  )
}

function* editTrackAsync(action) {
  yield call(waitForBackendSetup)
  action.formFields.description = squashNewLines(action.formFields.description)

  const currentTrack = yield select(getTrack, { id: action.trackId })
  const wasDownloadable =
    currentTrack.download && currentTrack.download.is_downloadable
  const isNowDownloadable =
    action.formFields.download && action.formFields.download.is_downloadable

  const isPublishing = currentTrack._is_publishing
  const wasUnlisted = currentTrack.is_unlisted
  const isNowListed = !action.formFields.is_unlisted

  if (!isPublishing && wasUnlisted && isNowListed) {
    yield put(
      cacheActions.update(Kind.TRACKS, [
        {
          id: action.trackId,
          metadata: { _is_publishing: true }
        }
      ])
    )
  }

  yield call(
    confirmEditTrack,
    action.trackId,
    action.formFields,
    wasDownloadable,
    isNowDownloadable,
    wasUnlisted,
    isNowListed,
    currentTrack
  )

  const track = { ...action.formFields }
  track.track_id = action.trackId
  if (track.artwork) {
    track._cover_art_sizes = {
      ...track._cover_art_sizes,
      [DefaultSizes.OVERRIDE]: track.artwork.url
    }
  }

  yield put(
    cacheActions.update(Kind.TRACKS, [{ id: track.track_id, metadata: track }])
  )
  yield put(trackActions.editTrackSucceeded())

  // This is a new remix
  if (
    track?.remix_of?.tracks?.[0]?.parent_track_id &&
    currentTrack?.remix_of?.tracks?.[0]?.parent_track_id !==
      track?.remix_of?.tracks?.[0]?.parent_track_id
  ) {
    // This is a new remix
    yield call(trackNewRemixEvent, track)
  }
}

function* confirmEditTrack(
  trackId,
  formFields,
  wasDownloadable,
  isNowDownloadable,
  wasUnlisted,
  isNowListed,
  currentTrack
) {
  const audiusBackendInstance = yield getContext('audiusBackendInstance')
  const apiClient = yield getContext('apiClient')
  yield put(
    confirmerActions.requestConfirmation(
      makeKindId(Kind.TRACKS, trackId),
      function* () {
        if (!wasDownloadable && isNowDownloadable) {
          yield put(trackActions.checkIsDownloadable(trackId))
        }

        const { blockHash, blockNumber } = yield call(
          audiusBackendInstance.updateTrack,
          trackId,
          { ...formFields }
        )

        const confirmed = yield call(confirmTransaction, blockHash, blockNumber)
        if (!confirmed) {
          throw new Error(
            `Could not confirm edit track for track id ${trackId}`
          )
        }

        // Need to poll with the new track name in case it changed
        const userId = yield select(getUserId)
        const handle = yield select(getUserHandle)

        return yield apiClient.getTrack(
          {
            id: trackId,
            currentUserId: userId,
            unlistedArgs: {
              urlTitle: formatUrlName(formFields.title),
              handle
            }
          },
          /* retry */ false
        )
      },
      function* (confirmedTrack) {
        if (wasUnlisted && isNowListed) {
          confirmedTrack._is_publishing = false
        }
        // Update the cached track so it no longer contains image upload artifacts
        yield put(
          cacheActions.update(Kind.TRACKS, [
            {
              id: confirmedTrack.track_id,
              metadata: { ...confirmedTrack, artwork: {} }
            }
          ])
        )

        // Record analytics on track edit
        // Note: if remixes is not defined in field_visibility, it defaults to true
        if (
          (currentTrack?.field_visibility?.remixes ?? true) &&
          confirmedTrack?.field_visibility?.remixes === false
        ) {
          const handle = yield select(getUserHandle)
          // Record event if hide remixes was turned on
          yield put(
            make(Name.REMIX_HIDE, {
              id: confirmedTrack.track_id,
              handle
            })
          )
        }
      },
      function* () {
        yield put(trackActions.editTrackFailed())
        // Throw so the user can't capture a bad upload state (especially for downloads).
        // TODO: Consider better update revesion logic here coupled with a toast or similar.
        throw new Error('Edit track failed')
      }
    )
  )
}

function* watchEditTrack() {
  yield takeEvery(trackActions.EDIT_TRACK, editTrackAsync)
}

function* deleteTrackAsync(action) {
  const audiusBackendInstance = yield getContext('audiusBackendInstance')
  yield call(waitForBackendSetup)
  const userId = yield select(getUserId)
  if (!userId) {
    yield put(signOnActions.openSignOn(false))
    return
  }
  const handle = yield select(getUserHandle)

  // Before deleting, check if the track is set as the artist pick & delete if so
  const socials = yield call(
    audiusBackendInstance.getCreatorSocialHandle,
    handle
  )
  if (socials.pinnedTrackId === action.trackId) {
    yield call(audiusBackendInstance.setArtistPick)
    yield put(
      cacheActions.update(Kind.USERS, [
        {
          id: userId,
          metadata: { _artist_pick: null }
        }
      ])
    )
  }

  const track = yield select(getTrack, { id: action.trackId })
  yield put(
    cacheActions.update(Kind.TRACKS, [
      { id: track.track_id, metadata: { _marked_deleted: true } }
    ])
  )

  yield call(confirmDeleteTrack, track.track_id)
}

function* confirmDeleteTrack(trackId) {
  const audiusBackendInstance = yield getContext('audiusBackendInstance')
  const apiClient = yield getContext('apiClient')
  yield put(
    confirmerActions.requestConfirmation(
      makeKindId(Kind.TRACKS, trackId),
      function* () {
        const { blockHash, blockNumber } = yield call(
          audiusBackendInstance.deleteTrack,
          trackId
        )

        const confirmed = yield call(confirmTransaction, blockHash, blockNumber)
        if (!confirmed) {
          throw new Error(
            `Could not confirm delete track for track id ${trackId}`
          )
        }

        const track = yield select(getTrack, { id: trackId })
        const handle = yield select(getUserHandle)
        const userId = yield select(getUserId)

        return yield apiClient.getTrack(
          {
            id: trackId,
            currentUserId: userId,
            unlistedArgs: {
              urlTitle: formatUrlName(track.title),
              handle
            }
          },
          /* retry */ false
        )
      },
      function* (deletedTrack) {
        // NOTE: we do not delete from the cache as the track may be playing
        yield put(trackActions.deleteTrackSucceeded(deletedTrack.track_id))

        // Record Delete Event
        const event = make(Name.DELETE, {
          kind: 'track',
          id: deletedTrack.trackId
        })
        yield put(event)
        if (deletedTrack.stem_of) {
          const stemDeleteEvent = make(Name.STEM_DELETE, {
            id: deletedTrack.track_id,
            parent_track_id: deletedTrack.stem_of.parent_track_id,
            category: deletedTrack.stem_of.category
          })
          yield put(stemDeleteEvent)
        }
      },
      function* () {
        // On failure, do not mark the track as deleted
        yield put(
          cacheActions.update(Kind.TRACKS, [
            { id: trackId, metadata: { _marked_deleted: false } }
          ])
        )
      }
    )
  )
}

function* watchDeleteTrack() {
  yield takeEvery(trackActions.DELETE_TRACK, deleteTrackAsync)
}

function* watchFetchCoverArt() {
  const audiusBackendInstance = yield getContext('audiusBackendInstance')
  const inProgress = new Set()
  yield takeEvery(trackActions.FETCH_COVER_ART, function* ({ trackId, size }) {
    // Unique on id and size
    const key = `${trackId}-${size}`
    if (inProgress.has(key)) return
    inProgress.add(key)

    try {
      let track = yield call(waitForValue, getTrack, { id: trackId })
      const user = yield call(waitForValue, getUser, { id: track.owner_id })
      if (!track || !user || (!track.cover_art_sizes && !track.cover_art))
        return
      const gateways = audiusBackendInstance.getCreatorNodeIPFSGateways(
        user.creator_node_endpoint
      )
      const multihash = track.cover_art_sizes || track.cover_art
      const coverArtSize = multihash === track.cover_art_sizes ? size : null
      const url = yield call(
        audiusBackendInstance.getImageUrl,
        multihash,
        coverArtSize,
        gateways
      )
      track = yield select(getTrack, { id: trackId })
      track._cover_art_sizes = {
        ...track._cover_art_sizes,
        [coverArtSize || DefaultSizes.OVERRIDE]: url
      }
      yield put(
        cacheActions.update(Kind.TRACKS, [{ id: trackId, metadata: track }])
      )

      let smallImageUrl = url
      if (coverArtSize !== SquareSizes.SIZE_150_BY_150) {
        smallImageUrl = yield call(
          audiusBackendInstance.getImageUrl,
          multihash,
          SquareSizes.SIZE_150_BY_150,
          gateways
        )
      }
      const dominantColors = yield call(dominantColor, smallImageUrl)

      yield put(
        setDominantColors({
          multihash,
          colors: dominantColors
        })
      )
    } catch (e) {
      console.error(`Unable to fetch cover art for track ${trackId}`)
    } finally {
      inProgress.delete(key)
    }
  })
}

function* watchCheckIsDownloadable() {
  yield takeLatest(trackActions.CHECK_IS_DOWNLOADABLE, function* (action) {
    const track = yield select(getTrack, { id: action.trackId })
    if (!track) return

    const user = yield select(getUser, { id: track.owner_id })
    if (!user) return
    if (!user.creator_node_endpoint) return

    const cid = yield call(
      TrackDownload.checkIfDownloadAvailable,
      track.track_id,
      user.creator_node_endpoint
    )

    const updatedMetadata = {
      ...track,
      download: {
        ...track.download,
        cid
      }
    }

    yield put(
      cacheActions.update(Kind.TRACKS, [
        {
          id: track.track_id,
          metadata: updatedMetadata
        }
      ])
    )

    const currentUserId = yield select(getUserId)
    if (currentUserId === user.user_id) {
      yield call(
        TrackDownload.updateTrackDownloadCID,
        track.track_id,
        track,
        cid
      )
    }
  })
}

const sagas = () => {
  return [
    watchAdd,
    watchEditTrack,
    watchDeleteTrack,
    watchFetchCoverArt,
    watchCheckIsDownloadable
  ]
}

export default sagas
