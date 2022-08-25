import {
  Kind,
  ID,
  Name,
  Track,
  User,
  makeKindId,
  formatShareText,
  accountSelectors,
  accountActions,
  cacheTracksSelectors,
  cacheUsersSelectors,
  cacheActions,
  audioRewardsPageActions,
  getContext,
  tracksSocialActions as socialActions,
  waitForValue,
  waitForAccount
} from '@audius/common'
import { call, select, takeEvery, put } from 'typed-redux-saga'

import { make } from 'common/store/analytics/actions'
import { waitForBackendSetup } from 'common/store/backend/sagas'
import { adjustUserField } from 'common/store/cache/users/sagas'
import * as confirmerActions from 'common/store/confirmer/actions'
import { confirmTransaction } from 'common/store/confirmer/sagas'
import * as signOnActions from 'common/store/pages/signon/actions'
import TrackDownload from 'services/audius-backend/TrackDownload'
import { share } from 'utils/share'

import watchTrackErrors from './errorSagas'
const { updateOptimisticListenStreak } = audioRewardsPageActions
const { getUser } = cacheUsersSelectors
const { getTrack, getTracks } = cacheTracksSelectors

const { getUserId, getUserHandle } = accountSelectors

const NATIVE_MOBILE = process.env.REACT_APP_NATIVE_MOBILE

/* REPOST TRACK */
export function* watchRepostTrack() {
  yield* takeEvery(socialActions.REPOST_TRACK, repostTrackAsync)
}

export function* repostTrackAsync(
  action: ReturnType<typeof socialActions.repostTrack>
) {
  yield* call(waitForBackendSetup)
  yield* waitForAccount()
  const userId = yield* select(getUserId)
  if (!userId) {
    yield* put(signOnActions.openSignOn(false))
    yield* put(signOnActions.showRequiresAccountModal())
    yield* put(make(Name.CREATE_ACCOUNT_OPEN, { source: 'social action' }))
    return
  }

  //  Increment the repost count on the user
  const user = yield* select(getUser, { id: userId })
  if (!user) return

  yield* call(adjustUserField, { user, fieldName: 'repost_count', delta: 1 })
  // Indicates that the user has reposted `this` session
  yield* put(
    cacheActions.update(Kind.USERS, [
      {
        id: user.user_id,
        metadata: {
          _has_reposted: true
        }
      }
    ])
  )

  const event = make(Name.REPOST, {
    kind: 'track',
    source: action.source,
    id: action.trackId
  })
  yield* put(event)

  yield* call(confirmRepostTrack, action.trackId, user)

  const tracks = yield* select(getTracks, { ids: [action.trackId] })
  const track = tracks[action.trackId]

  const eagerlyUpdatedMetadata: Partial<Track> = {
    has_current_user_reposted: true,
    repost_count: track.repost_count + 1
  }

  const remixTrack = track.remix_of?.tracks?.[0]
  const isCoSign = remixTrack?.user?.user_id === userId

  if (remixTrack && isCoSign) {
    // This repost is a co-sign
    const remixOf = {
      tracks: [
        {
          ...remixTrack,
          has_remix_author_reposted: true
        }
      ]
    }
    eagerlyUpdatedMetadata.remix_of = remixOf
    eagerlyUpdatedMetadata._co_sign = remixOf.tracks[0]
  }

  yield* put(
    cacheActions.update(Kind.TRACKS, [
      {
        id: action.trackId,
        metadata: eagerlyUpdatedMetadata
      }
    ])
  )

  if (remixTrack && isCoSign) {
    const {
      parent_track_id,
      has_remix_author_reposted,
      has_remix_author_saved
    } = remixTrack

    // Track Cosign Event
    const hasAlreadyCoSigned =
      has_remix_author_reposted || has_remix_author_saved

    const parentTrack = yield* select(getTrack, { id: parent_track_id })

    if (parentTrack) {
      const coSignIndicatorEvent = make(Name.REMIX_COSIGN_INDICATOR, {
        id: action.trackId,
        handle: user.handle,
        original_track_id: parentTrack.track_id,
        original_track_title: parentTrack.title,
        action: 'reposted'
      })
      yield* put(coSignIndicatorEvent)

      if (!hasAlreadyCoSigned) {
        const coSignEvent = make(Name.REMIX_COSIGN, {
          id: action.trackId,
          handle: user.handle,
          original_track_id: parentTrack.track_id,
          original_track_title: parentTrack.title,
          action: 'reposted'
        })
        yield* put(coSignEvent)
      }
    }
  }
}

export function* confirmRepostTrack(trackId: ID, user: User) {
  const audiusBackendInstance = yield* getContext('audiusBackendInstance')
  yield* put(
    confirmerActions.requestConfirmation(
      makeKindId(Kind.TRACKS, trackId),
      function* () {
        const { blockHash, blockNumber } = yield* call(
          audiusBackendInstance.repostTrack,
          trackId
        )
        const confirmed = yield* call(
          confirmTransaction,
          blockHash,
          blockNumber
        )
        if (!confirmed) {
          throw new Error(
            `Could not confirm repost track for track id ${trackId}`
          )
        }
        return trackId
      },
      function* () {},
      // @ts-ignore: remove when confirmer is typed
      function* ({ timeout, message }: { timeout: boolean; message: string }) {
        // Revert the incremented repost count
        yield* call(adjustUserField, {
          user,
          fieldName: 'repost_count',
          delta: -1
        })
        yield* put(
          socialActions.trackRepostFailed(
            trackId,
            timeout ? 'Timeout' : message
          )
        )
      }
    )
  )
}

export function* watchUndoRepostTrack() {
  yield* takeEvery(socialActions.UNDO_REPOST_TRACK, undoRepostTrackAsync)
}

export function* undoRepostTrackAsync(
  action: ReturnType<typeof socialActions.undoRepostTrack>
) {
  yield* call(waitForBackendSetup)
  yield* waitForAccount()
  const userId = yield* select(getUserId)
  if (!userId) {
    yield* put(signOnActions.openSignOn(false))
    yield* put(signOnActions.showRequiresAccountModal())
    yield* put(make(Name.CREATE_ACCOUNT_OPEN, { source: 'social action' }))
    return
  }

  // Decrement the repost count
  const user = yield* select(getUser, { id: userId })
  if (!user) return

  yield* call(adjustUserField, { user, fieldName: 'repost_count', delta: -1 })

  const event = make(Name.UNDO_REPOST, {
    kind: 'track',
    source: action.source,
    id: action.trackId
  })
  yield* put(event)

  yield* call(confirmUndoRepostTrack, action.trackId, user)

  const tracks = yield* select(getTracks, { ids: [action.trackId] })
  const track = tracks[action.trackId]

  const eagerlyUpdatedMetadata: Partial<Track> = {
    has_current_user_reposted: false,
    repost_count: track.repost_count - 1
  }

  if (track.remix_of?.tracks?.[0]?.user?.user_id === userId) {
    // This repost is a co-sign
    const remixOf = {
      tracks: [
        {
          ...track.remix_of.tracks[0],
          has_remix_author_reposted: false
        }
      ]
    }
    eagerlyUpdatedMetadata.remix_of = remixOf
    if (
      remixOf.tracks[0].has_remix_author_saved ||
      remixOf.tracks[0].has_remix_author_reposted
    ) {
      eagerlyUpdatedMetadata._co_sign = remixOf.tracks[0]
    } else {
      eagerlyUpdatedMetadata._co_sign = null
    }
  }

  yield* put(
    cacheActions.update(Kind.TRACKS, [
      {
        id: action.trackId,
        metadata: eagerlyUpdatedMetadata
      }
    ])
  )
}

export function* confirmUndoRepostTrack(trackId: ID, user: User) {
  const audiusBackendInstance = yield* getContext('audiusBackendInstance')
  yield* put(
    confirmerActions.requestConfirmation(
      makeKindId(Kind.TRACKS, trackId),
      function* () {
        const { blockHash, blockNumber } = yield* call(
          audiusBackendInstance.undoRepostTrack,
          trackId
        )
        const confirmed = yield* call(
          confirmTransaction,
          blockHash,
          blockNumber
        )
        if (!confirmed) {
          throw new Error(
            `Could not confirm undo repost track for track id ${trackId}`
          )
        }
        return trackId
      },
      function* () {},
      // @ts-ignore: remove when confirmer is typed
      function* ({ timeout, message }: { timeout: boolean; message: string }) {
        // revert the decremented repost count
        yield* call(adjustUserField, {
          user,
          fieldName: 'repost_count',
          delta: 1
        })
        yield* put(
          socialActions.trackRepostFailed(
            trackId,
            timeout ? 'Timeout' : message
          )
        )
      }
    )
  )
}
/* SAVE TRACK */

export function* watchSaveTrack() {
  yield* takeEvery(socialActions.SAVE_TRACK, saveTrackAsync)
}

export function* saveTrackAsync(
  action: ReturnType<typeof socialActions.saveTrack>
) {
  yield* call(waitForBackendSetup)
  yield* waitForAccount()
  const userId = yield* select(getUserId)
  if (!userId) {
    yield* put(signOnActions.showRequiresAccountModal())
    yield* put(signOnActions.openSignOn(false))
    yield* put(make(Name.CREATE_ACCOUNT_OPEN, { source: 'social action' }))
    return
  }

  const tracks = yield* select(getTracks, { ids: [action.trackId] })
  const track = tracks[action.trackId]

  if (track.has_current_user_saved) return
  yield* put(accountActions.didFavoriteItem())

  const event = make(Name.FAVORITE, {
    kind: 'track',
    source: action.source,
    id: action.trackId
  })
  yield* put(event)

  yield* call(confirmSaveTrack, action.trackId)

  const eagerlyUpdatedMetadata: Partial<Track> = {
    has_current_user_saved: true,
    save_count: track.save_count + 1
  }

  const remixTrack = track.remix_of?.tracks?.[0]
  const isCoSign = remixTrack?.user?.user_id === userId
  if (remixTrack && isCoSign) {
    // This repost is a co-sign
    const remixOf = {
      tracks: [
        {
          ...remixTrack,
          has_remix_author_saved: true
        }
      ]
    }
    eagerlyUpdatedMetadata.remix_of = remixOf
    eagerlyUpdatedMetadata._co_sign = remixOf.tracks[0]
  }

  yield* put(
    cacheActions.update(Kind.TRACKS, [
      {
        id: action.trackId,
        metadata: eagerlyUpdatedMetadata
      }
    ])
  )
  yield* put(socialActions.saveTrackSucceeded(action.trackId))
  if (isCoSign) {
    // Track Cosign Event
    const parentTrackId = remixTrack.parent_track_id
    const hasAlreadyCoSigned =
      remixTrack.has_remix_author_reposted || remixTrack.has_remix_author_saved

    const parentTrack = yield* select(getTrack, { id: parentTrackId })
    const handle = yield* select(getUserHandle)
    const coSignIndicatorEvent = make(Name.REMIX_COSIGN_INDICATOR, {
      id: action.trackId,
      handle,
      original_track_id: parentTrack?.track_id,
      original_track_title: parentTrack?.title,
      action: 'favorited'
    })
    yield* put(coSignIndicatorEvent)

    if (!hasAlreadyCoSigned) {
      const coSignEvent = make(Name.REMIX_COSIGN, {
        id: action.trackId,
        handle,
        original_track_id: parentTrack?.track_id,
        original_track_title: parentTrack?.title,
        action: 'favorited'
      })
      yield* put(coSignEvent)
    }
  }
}

export function* confirmSaveTrack(trackId: ID) {
  const audiusBackendInstance = yield* getContext('audiusBackendInstance')
  yield* put(
    confirmerActions.requestConfirmation(
      makeKindId(Kind.TRACKS, trackId),
      function* () {
        const { blockHash, blockNumber } = yield* call(
          audiusBackendInstance.saveTrack,
          trackId
        )
        const confirmed = yield* call(
          confirmTransaction,
          blockHash,
          blockNumber
        )
        if (!confirmed) {
          throw new Error(
            `Could not confirm save track for track id ${trackId}`
          )
        }
        return trackId
      },
      function* () {},
      // @ts-ignore: remove when confirmer is typed
      function* ({ timeout, message }: { timeout: boolean; message: string }) {
        yield* put(
          socialActions.saveTrackFailed(trackId, timeout ? 'Timeout' : message)
        )
      }
    )
  )
}

export function* watchUnsaveTrack() {
  yield* takeEvery(socialActions.UNSAVE_TRACK, unsaveTrackAsync)
}

export function* unsaveTrackAsync(
  action: ReturnType<typeof socialActions.unsaveTrack>
) {
  yield* call(waitForBackendSetup)
  yield* waitForAccount()
  const userId = yield* select(getUserId)
  if (!userId) {
    yield* put(signOnActions.openSignOn(false))
    yield* put(signOnActions.showRequiresAccountModal())
    yield* put(make(Name.CREATE_ACCOUNT_OPEN, { source: 'social action' }))
    return
  }

  const event = make(Name.UNFAVORITE, {
    kind: 'track',
    source: action.source,
    id: action.trackId
  })
  yield* put(event)

  yield* call(confirmUnsaveTrack, action.trackId)

  const tracks = yield* select(getTracks, { ids: [action.trackId] })
  const track = tracks[action.trackId]
  if (track) {
    const eagerlyUpdatedMetadata: Partial<Track> = {
      has_current_user_saved: false,
      save_count: track.save_count - 1
    }

    if (track.remix_of?.tracks?.[0]?.user?.user_id === userId) {
      // This repost is a co-sign
      const remixOf = {
        tracks: [
          {
            ...track.remix_of.tracks[0],
            has_remix_author_saved: false
          }
        ]
      }
      eagerlyUpdatedMetadata.remix_of = remixOf
      if (
        remixOf.tracks[0].has_remix_author_saved ||
        remixOf.tracks[0].has_remix_author_reposted
      ) {
        eagerlyUpdatedMetadata._co_sign = remixOf.tracks[0]
      } else {
        eagerlyUpdatedMetadata._co_sign = null
      }
    }

    yield* put(
      cacheActions.update(Kind.TRACKS, [
        {
          id: action.trackId,
          metadata: eagerlyUpdatedMetadata
        }
      ])
    )
  }

  yield* put(socialActions.unsaveTrackSucceeded(action.trackId))
}

export function* confirmUnsaveTrack(trackId: ID) {
  const audiusBackendInstance = yield* getContext('audiusBackendInstance')
  yield* put(
    confirmerActions.requestConfirmation(
      makeKindId(Kind.TRACKS, trackId),
      function* () {
        const { blockHash, blockNumber } = yield* call(
          audiusBackendInstance.unsaveTrack,
          trackId
        )
        const confirmed = yield* call(
          confirmTransaction,
          blockHash,
          blockNumber
        )
        if (!confirmed) {
          throw new Error(
            `Could not confirm unsave track for track id ${trackId}`
          )
        }
        return trackId
      },
      function* () {},
      // @ts-ignore: remove when confirmer is typed
      function* ({ timeout, message }: { timeout: boolean; message: string }) {
        yield* put(
          socialActions.unsaveTrackFailed(
            trackId,
            timeout ? 'Timeout' : message
          )
        )
      }
    )
  )
}

export function* watchSetArtistPick() {
  const audiusBackendInstance = yield* getContext('audiusBackendInstance')
  yield* takeEvery(
    socialActions.SET_ARTIST_PICK,
    function* (action: ReturnType<typeof socialActions.setArtistPick>) {
      yield* waitForAccount()
      const userId = yield* select(getUserId)
      yield* put(
        cacheActions.update(Kind.USERS, [
          {
            id: userId,
            metadata: { _artist_pick: action.trackId }
          }
        ])
      )
      yield* call(audiusBackendInstance.setArtistPick, action.trackId)

      const event = make(Name.ARTIST_PICK_SELECT_TRACK, { id: action.trackId })
      yield* put(event)
    }
  )
}

export function* watchUnsetArtistPick() {
  const audiusBackendInstance = yield* getContext('audiusBackendInstance')
  yield* takeEvery(socialActions.UNSET_ARTIST_PICK, function* (action) {
    yield* waitForAccount()
    const userId = yield* select(getUserId)
    yield* put(
      cacheActions.update(Kind.USERS, [
        {
          id: userId,
          metadata: { _artist_pick: null }
        }
      ])
    )
    yield* call(audiusBackendInstance.setArtistPick)

    const event = make(Name.ARTIST_PICK_SELECT_TRACK, { id: 'none' })
    yield* put(event)
  })
}

/* RECORD LISTEN */

export function* watchRecordListen() {
  const audiusBackendInstance = yield* getContext('audiusBackendInstance')
  yield* takeEvery(
    socialActions.RECORD_LISTEN,
    function* (action: ReturnType<typeof socialActions.recordListen>) {
      if (NATIVE_MOBILE) return
      console.debug('Listen recorded for track', action.trackId)

      yield* waitForAccount()
      const userId = yield* select(getUserId)
      const track = yield* select(getTrack, { id: action.trackId })
      if (!userId || !track) return

      if (userId !== track.owner_id || track.play_count < 10) {
        yield* call(audiusBackendInstance.recordTrackListen, action.trackId)
      }

      // Record track listen analytics event
      const event = make(Name.LISTEN, { trackId: action.trackId })
      yield* put(event)

      // Optimistically update the listen streak if applicable
      yield* put(updateOptimisticListenStreak())
    }
  )
}

/* DOWNLOAD TRACK */

function* watchDownloadTrack() {
  yield* takeEvery(
    socialActions.DOWNLOAD_TRACK,
    function* (action: ReturnType<typeof socialActions.downloadTrack>) {
      yield* call(waitForBackendSetup)

      // Check if there is a logged in account and if not,
      // wait for one so we can trigger the download immediately after
      // logging in.
      const accountUserId = yield* select(getUserId)
      if (!accountUserId) {
        yield* call(waitForValue, getUserId)
      }

      const track = yield* select(getTrack, { id: action.trackId })
      if (!track) return

      const userId = track.owner_id
      const user = yield* select(getUser, { id: userId })
      if (!user) return

      let filename
      // Determine if this track requires a follow to download.
      // In the case of a stem, check the parent track
      let requiresFollow =
        track.download?.requires_follow && userId !== accountUserId
      if (track.stem_of?.parent_track_id) {
        const parentTrack = yield* select(getTrack, {
          id: track.stem_of?.parent_track_id
        })
        requiresFollow =
          requiresFollow ||
          (parentTrack?.download?.requires_follow && userId !== accountUserId)

        filename = `${parentTrack?.title} - ${action.stemName} - ${user.name} (Audius).mp3`
      } else {
        filename = `${track.title} - ${user.name} (Audius).mp3`
      }

      // If a follow is required and the current user is not following
      // bail out of downloading.
      if (requiresFollow && !user.does_current_user_follow) {
        return
      }

      const endpoints = action.creatorNodeEndpoints
        .split(',')
        .map((endpoint) => `${endpoint}/ipfs/`)

      if (NATIVE_MOBILE) {
        yield* call(
          TrackDownload.downloadTrackMobile,
          action.cid,
          endpoints,
          filename
        )
      } else {
        yield* call(
          TrackDownload.downloadTrack,
          action.cid,
          endpoints,
          filename
        )
      }
    }
  )
}

/* SHARE */

function* watchShareTrack() {
  yield* takeEvery(
    socialActions.SHARE_TRACK,
    function* (action: ReturnType<typeof socialActions.shareTrack>) {
      const { trackId } = action

      const track = yield* select(getTrack, { id: trackId })
      if (!track) return

      const user = yield* select(getUser, { id: track.owner_id })
      if (!user) return

      const link = track.permalink
      share(link, formatShareText(track.title, user.name))

      const event = make(Name.SHARE, {
        kind: 'track',
        source: action.source,
        id: trackId,
        url: link
      })
      yield* put(event)
    }
  )
}

const sagas = () => {
  return [
    watchRepostTrack,
    watchUndoRepostTrack,
    watchSaveTrack,
    watchUnsaveTrack,
    watchRecordListen,
    watchSetArtistPick,
    watchUnsetArtistPick,
    watchDownloadTrack,
    watchShareTrack,
    watchTrackErrors
  ]
}

export default sagas
