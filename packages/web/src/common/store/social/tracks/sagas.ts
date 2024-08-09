import { Name, Kind, ID, Track, User } from '@audius/common/models'
import { QueryParams } from '@audius/common/services'
import {
  accountSelectors,
  cacheTracksSelectors,
  cacheActions,
  cacheUsersSelectors,
  tracksSocialActions as socialActions,
  getContext,
  gatedContentSelectors,
  confirmerActions,
  confirmTransaction,
  modalsActions
} from '@audius/common/store'
import {
  formatShareText,
  encodeHashId,
  makeKindId,
  waitForValue,
  getQueryParams,
  removeNullable
} from '@audius/common/utils'
import { capitalize } from 'lodash'
import {
  call,
  select,
  takeEvery,
  put,
  fork,
  take,
  cancel
} from 'typed-redux-saga'

import { make } from 'common/store/analytics/actions'
import { adjustUserField } from 'common/store/cache/users/sagas'
import * as signOnActions from 'common/store/pages/signon/actions'
import { updateProfileAsync } from 'common/store/profile/sagas'
import { waitForRead, waitForWrite } from 'utils/sagaHelpers'

import watchTrackErrors from './errorSagas'
import { watchRecordListen } from './recordListen'
const { getUser } = cacheUsersSelectors
const { getTrack, getTracks } = cacheTracksSelectors
const { getUserId, getUserHandle } = accountSelectors
const { getNftAccessSignatureMap } = gatedContentSelectors
const { setVisibility } = modalsActions

/* REPOST TRACK */
export function* watchRepostTrack() {
  yield* takeEvery(socialActions.REPOST_TRACK, repostTrackAsync)
}

export function* repostTrackAsync(
  action: ReturnType<typeof socialActions.repostTrack>
) {
  yield* call(waitForWrite)
  const userId = yield* select(getUserId)
  if (!userId) {
    yield* put(signOnActions.openSignOn(false))
    yield* put(signOnActions.showRequiresAccountModal())
    yield* put(make(Name.CREATE_ACCOUNT_OPEN, { source: 'social action' }))
    return
  }

  // Increment the repost count on the user
  const user = yield* select(getUser, { id: userId })
  if (!user) return

  const track = yield* select(getTrack, { id: action.trackId })
  if (!track) return

  if (track.owner_id === userId) {
    return
  }

  yield* call(adjustUserField, { user, fieldName: 'repost_count', delta: 1 })

  const event = make(Name.REPOST, {
    kind: 'track',
    source: action.source,
    id: action.trackId
  })
  yield* put(event)

  const repostMetadata = action.isFeed
    ? // If we're on the feed, and someone i follow has
      // reposted the content i am reposting,
      // is_repost_of_repost is true
      { is_repost_of_repost: track.followee_reposts.length !== 0 }
    : { is_repost_of_repost: false }
  yield* call(confirmRepostTrack, action.trackId, user, repostMetadata)

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

export function* confirmRepostTrack(
  trackId: ID,
  user: User,
  metadata?: { is_repost_of_repost: boolean }
) {
  const audiusBackendInstance = yield* getContext('audiusBackendInstance')
  yield* put(
    confirmerActions.requestConfirmation(
      makeKindId(Kind.TRACKS, trackId),
      function* () {
        const { blockHash, blockNumber } = yield* call(
          audiusBackendInstance.repostTrack,
          trackId,
          metadata
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
  yield* call(waitForWrite)
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
  yield* call(waitForWrite)
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

  // Increment the save count on the user
  const user = yield* select(getUser, { id: userId })
  if (!user) return

  if (track.owner_id === userId) {
    return
  }

  yield* call(adjustUserField, {
    user,
    fieldName: 'track_save_count',
    delta: 1
  })

  const event = make(Name.FAVORITE, {
    kind: 'track',
    source: action.source,
    id: action.trackId
  })
  yield* put(event)

  const saveMetadata = action.isFeed
    ? // If we're on the feed, and the content
      // being saved is a repost
      { is_save_of_repost: track.followee_reposts.length !== 0 }
    : { is_save_of_repost: false }
  yield* call(confirmSaveTrack, action.trackId, user, saveMetadata)

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

export function* confirmSaveTrack(
  trackId: ID,
  user: User,
  metadata?: { is_save_of_repost: boolean }
) {
  const audiusBackendInstance = yield* getContext('audiusBackendInstance')
  yield* put(
    confirmerActions.requestConfirmation(
      makeKindId(Kind.TRACKS, trackId),
      function* () {
        const { blockHash, blockNumber } = yield* call(
          audiusBackendInstance.saveTrack,
          trackId,
          metadata
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
        // Revert the incremented save count
        yield* call(adjustUserField, {
          user,
          fieldName: 'track_save_count',
          delta: -1
        })

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
  yield* call(waitForWrite)
  const userId = yield* select(getUserId)
  if (!userId) {
    yield* put(signOnActions.openSignOn(false))
    yield* put(signOnActions.showRequiresAccountModal())
    yield* put(make(Name.CREATE_ACCOUNT_OPEN, { source: 'social action' }))
    return
  }

  // Decrement the save count
  const user = yield* select(getUser, { id: userId })
  if (!user) return

  yield* call(adjustUserField, {
    user,
    fieldName: 'track_save_count',
    delta: -1
  })

  const event = make(Name.UNFAVORITE, {
    kind: 'track',
    source: action.source,
    id: action.trackId
  })
  yield* put(event)

  yield* call(confirmUnsaveTrack, action.trackId, user)

  const tracks = yield* select(getTracks, { ids: [action.trackId] })
  const track = tracks[action.trackId]

  if (track) {
    const eagerlyUpdatedMetadata: Partial<Track> = {
      has_current_user_saved: false,
      save_count: track.save_count - 1
    }

    if (track.remix_of?.tracks?.[0]?.user?.user_id === userId) {
      // This save is a co-sign
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

export function* confirmUnsaveTrack(trackId: ID, user: User) {
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
        // revert the decremented save count
        yield* call(adjustUserField, {
          user,
          fieldName: 'track_save_count',
          delta: 1
        })
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
  yield* takeEvery(
    socialActions.SET_ARTIST_PICK,
    function* (action: ReturnType<typeof socialActions.setArtistPick>) {
      yield* call(waitForWrite)
      const userId: ID | null = yield* select(getUserId)

      if (!userId) return
      yield* put(
        cacheActions.update(Kind.USERS, [
          {
            id: userId,
            metadata: {
              artist_pick_track_id: action.trackId
            }
          }
        ])
      )
      const user = yield* call(waitForValue, getUser, { id: userId })
      yield* fork(updateProfileAsync, { metadata: user })

      const event = make(Name.ARTIST_PICK_SELECT_TRACK, { id: action.trackId })
      yield* put(event)
    }
  )
}

export function* watchUnsetArtistPick() {
  yield* takeEvery(socialActions.UNSET_ARTIST_PICK, function* (action) {
    yield* call(waitForWrite)
    const userId = yield* select(getUserId)

    if (!userId) return
    yield* put(
      cacheActions.update(Kind.USERS, [
        {
          id: userId,
          metadata: {
            artist_pick_track_id: null
          }
        }
      ])
    )
    const user = yield* call(waitForValue, getUser, { id: userId })
    yield* fork(updateProfileAsync, { metadata: user })

    const event = make(Name.ARTIST_PICK_SELECT_TRACK, { id: 'none' })
    yield* put(event)
  })
}

const getFilename = ({
  track,
  user,
  original
}: {
  track: Track
  user: User
  original?: boolean
}) => {
  let filename
  const hasCategory = !!track.stem_of?.category

  // Fallback case - should not occur
  if (!track.orig_filename) {
    filename = `${track.title} ${
      hasCategory ? `- ${capitalize(track.stem_of?.category)}` : null
    } - ${user.name} (Audius)${original ? '.wav' : '.mp3'}`
  } else if (original) {
    filename = `${track.orig_filename}`
  } else {
    const dotIndex = track.orig_filename.lastIndexOf('.')
    filename =
      dotIndex !== -1
        ? track.orig_filename.substring(0, dotIndex) + '.mp3'
        : track.orig_filename + '.mp3'
  }
  return filename
}

/**
 * Downloads all tracks in the given quality. Can be used for a single
 * track or multiple tracks (usually for stems). First track is the parent track.
 */
function* downloadTracks({
  tracks,
  original,
  rootDirectoryName,
  abortSignal
}: {
  tracks: { trackId: ID; filename: string }[]
  original?: boolean
  rootDirectoryName?: string
  abortSignal?: AbortSignal
  userId?: ID
}) {
  const { trackId: parentTrackId } = tracks[0]
  try {
    const audiusBackendInstance = yield* getContext('audiusBackendInstance')
    const apiClient = yield* getContext('apiClient')
    const audiusSdk = yield* getContext('audiusSdk')
    const sdk = yield* call(audiusSdk)
    const trackDownload = yield* getContext('trackDownload')
    let queryParams: QueryParams = {}

    const nftAccessSignatureMap = yield* select(getNftAccessSignatureMap)
    const userId = yield* select(getUserId)
    const nftAccessSignature = original
      ? nftAccessSignatureMap[parentTrackId]?.original ?? null
      : nftAccessSignatureMap[parentTrackId]?.mp3 ?? null

    queryParams = (yield* call(getQueryParams, {
      audiusBackendInstance,
      nftAccessSignature,
      userId
    })) as unknown as QueryParams

    queryParams.original = original

    const files = tracks.map(({ trackId, filename }) => {
      queryParams.filename = filename
      return {
        url: apiClient.makeUrl(
          `/tracks/${encodeHashId(trackId)}/download`,
          queryParams
        ),
        filename
      }
    })
    yield* call(trackDownload.downloadTracks, {
      files,
      rootDirectoryName,
      abortSignal
    })
    yield* call(async () => {
      await Promise.all(
        tracks.map(async ({ trackId }) => {
          try {
            await sdk.tracks.recordTrackDownload({
              userId: userId ? encodeHashId(userId)! : undefined,
              trackId: encodeHashId(trackId)!
            })
            console.debug('Recorded download for track', trackId)
          } catch (e) {
            console.error('Failed to record download for track', trackId, e)
          }
        })
      )
    })
  } catch (e) {
    console.error(
      `Could not download files for track ${parentTrackId}: ${
        (e as Error).message
      }. Error: ${e}`
    )
  }
}

function* watchDownloadTrack() {
  yield* takeEvery(
    socialActions.DOWNLOAD_TRACK,
    function* (action: ReturnType<typeof socialActions.downloadTrack>) {
      const controller = new AbortController()
      const task = yield* fork(function* () {
        const { trackIds, parentTrackId, original } = action
        yield* call(waitForRead)

        // Check if there is a logged in account and if not,
        // wait for one so we can trigger the download immediately after
        // logging in.
        const accountUserId = yield* select(getUserId)
        if (!accountUserId) {
          yield* call(waitForValue, getUserId)
        }

        const mainTrackId = parentTrackId ?? trackIds[0]
        const mainTrack = yield* select(getTrack, {
          id: mainTrackId
        })
        if (!mainTrack) {
          console.error(
            `Failed to download because no mainTrack ${mainTrackId}`
          )
          return
        }
        const userId = mainTrack?.owner_id
        const user = yield* select(getUser, { id: userId })
        if (!user) {
          console.error(`Failed to download because no user ${userId}`)
          return
        }
        const rootDirectoryName = `${user.name} - ${mainTrack.title} (Audius)`
        // Mobile typecheck complains if this array isn't typed
        const tracks: { trackId: ID; filename: string }[] = []

        for (const trackId of [...trackIds, parentTrackId].filter(
          removeNullable
        )) {
          const track: Track | null = yield* select(getTrack, { id: trackId })
          if (!track) {
            console.error(
              `Skipping individual download because no track ${trackId}`
            )
            return
          }

          tracks.push({
            trackId,
            filename: getFilename({
              track,
              user,
              original
            })
          })
        }

        yield* call(downloadTracks, {
          tracks,
          original,
          rootDirectoryName,
          abortSignal: controller.signal
        })
      })
      yield* take(socialActions.CANCEL_DOWNLOAD)
      controller.abort()
      yield* cancel(task)
    }
  )
}

function* watchDownloadFinished() {
  yield* takeEvery(
    socialActions.DOWNLOAD_FINISHED,
    function* (action: ReturnType<typeof socialActions.downloadFinished>) {
      yield* put(
        setVisibility({ modal: 'WaitForDownloadModal', visible: false })
      )
    }
  )
}

/* SHARE */

function* watchShareTrack() {
  yield* takeEvery(
    socialActions.SHARE_TRACK,
    function* (action: ReturnType<typeof socialActions.shareTrack>) {
      const { trackId } = action

      const track: Track | null = yield* select(getTrack, { id: trackId })
      if (!track) return

      const user = yield* select(getUser, { id: track.owner_id })
      if (!user) return

      const link = track.permalink
      const share = yield* getContext('share')
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
    watchDownloadFinished,
    watchShareTrack,
    watchTrackErrors
  ]
}

export default sagas
