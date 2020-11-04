import {
  all,
  call,
  fork,
  put,
  select,
  takeEvery,
  takeLatest
} from 'redux-saga/effects'
import { pick, some } from 'lodash'
import { Kind } from 'store/types'

import AudiusBackend, { fetchCID } from 'services/AudiusBackend'
import TrackDownload from 'services/audius-backend/TrackDownload'
import { averageRgb } from 'utils/imageProcessingUtil'

import { fetchUsers } from 'store/cache/users/sagas'
import {
  getAccountUser,
  getUserId,
  getUserHandle
} from 'store/account/selectors'
import { waitForBackendSetup } from 'store/backend/sagas'
import { pollTrack } from 'store/confirmer/sagas'
import { getCreatorNodeIPFSGateways } from 'utils/gatewayUtil'

import * as cacheActions from 'store/cache/actions'
import * as trackActions from 'store/cache/tracks/actions'
import * as confirmerActions from 'store/confirmer/actions'
import { getUser } from 'store/cache/users/selectors'
import * as signOnActions from 'containers/sign-on/store/actions'
import { DefaultSizes } from 'models/common/ImageSizes'
import { squashNewLines, formatUrlName } from 'utils/formatUtil'
import { make } from 'store/analytics/actions'
import { Name } from 'services/analytics'

import { getTrack } from 'store/cache/tracks/selectors'
import { waitForValue } from 'utils/sagaHelpers'
import { makeKindId } from 'utils/uid'

const NATIVE_MOBILE = process.env.REACT_APP_NATIVE_MOBILE

function* fetchRepostInfo(entries) {
  const userIds = []
  entries.forEach(entry => {
    if (entry.metadata.followee_reposts) {
      entry.metadata.followee_reposts.forEach(repost =>
        userIds.push(repost.user_id)
      )
    }
  })

  if (userIds.length) {
    yield call(fetchUsers, userIds)
  }
}

function* fetchSegment(metadata) {
  const user = yield call(waitForValue, getUser, { id: metadata.owner_id })
  const gateways = getCreatorNodeIPFSGateways(user.creator_node_endpoint)
  if (!metadata.track_segments[0]) return
  const cid = metadata.track_segments[0].multihash
  return yield call(fetchCID, cid, gateways, /* cache */ false)
}

function* fetchFirstSegments(entries) {
  // Segments aren't part of the critical path so let them resolve later.
  try {
    const firstSegments = yield all(
      entries.map(e => call(fetchSegment, e.metadata))
    )
    yield put(
      cacheActions.update(
        Kind.TRACKS,
        firstSegments.map((s, i) => ({
          id: entries[i].id,
          metadata: { _first_segment: s }
        }))
      )
    )
  } catch (err) {
    console.error(err)
  }
}

function* watchAdd() {
  yield takeEvery(cacheActions.ADD_SUCCEEDED, function* (action) {
    if (action.kind === Kind.TRACKS) {
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

  if (track?.remix_of?.tracks) {
    const remixParentsUpdate = track.remix_of.tracks.map(t => ({
      track_id: t.parent_track_id
    }))
    track._remix_parents = remixParentsUpdate
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
  yield put(
    confirmerActions.requestConfirmation(
      makeKindId(Kind.TRACKS, trackId),
      function* () {
        if (!wasDownloadable && isNowDownloadable) {
          yield put(trackActions.checkIsDownloadable(trackId))
        }
        yield call(AudiusBackend.updateTrack, trackId, { ...formFields })
        const toConfirm = pick(formFields, [
          'title',
          'genre',
          'isrc',
          'iswc',
          'license',
          'mood',
          'release_date',
          'tags',
          'download',
          'description',
          'is_unlisted',
          'field_visibility'
        ])
        let check
        // If the user is trying to upload a new album artwork, check for a new CID in confirmation.
        if (formFields.artwork && formFields.artwork.file) {
          check = track =>
            some([track], toConfirm) &&
            track.cover_art_sizes !== formFields.cover_art_sizes
        } else {
          check = track => some([track], toConfirm)
        }

        // Need to poll with the new track name in case it changed
        const handle = yield select(getUserHandle)
        return yield call(
          pollTrack,
          trackId,
          formatUrlName(formFields.title),
          handle,
          check
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
  yield call(waitForBackendSetup)
  const userId = yield select(getUserId)
  if (!userId) {
    yield put(signOnActions.openSignOn(false))
    return
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
  yield put(
    confirmerActions.requestConfirmation(
      makeKindId(Kind.TRACKS, trackId),
      function* () {
        yield call(AudiusBackend.deleteTrack, trackId)
        const track = yield select(getTrack, { id: trackId })
        const handle = yield select(getUserHandle)
        return yield call(
          pollTrack,
          trackId,
          formatUrlName(track.title),
          handle,
          track => track.is_delete
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
      const gateways = getCreatorNodeIPFSGateways(user.creator_node_endpoint)
      const multihash = track.cover_art_sizes || track.cover_art
      const coverArtSize = multihash === track.cover_art_sizes ? size : null
      const url = yield call(
        AudiusBackend.getImageUrl,
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

      const rgb = yield call(averageRgb, url)
      yield put(
        cacheActions.update(Kind.TRACKS, [
          { id: trackId, metadata: { _cover_art_color: rgb } }
        ])
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
