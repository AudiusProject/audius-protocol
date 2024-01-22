import {
  Kind,
  ID,
  UID,
  Name,
  PlaybackSource,
  LineupState,
  User,
  Nullable,
  makeUid,
  Uid,
  accountSelectors,
  cacheCollectionsSelectors,
  cacheTracksSelectors,
  cacheUsersSelectors,
  cacheActions,
  cacheSelectors,
  queueActions,
  RepeatMode,
  QueueSource,
  waitForAccount,
  playerActions,
  playerSelectors,
  queueSelectors,
  getContext
} from '@audius/common'
import { all, call, put, select, takeEvery, takeLatest } from 'typed-redux-saga'

import { make } from 'common/store/analytics/actions'
import { getRecommendedTracks } from 'common/store/recommendation/sagas'
import { isPreview } from 'common/utils/isPreview'

const {
  getCollectible,
  getId: getQueueTrackId,
  getIndex,
  getLength,
  getOvershot,
  getQueueAutoplay,
  getRepeat,
  getShuffle,
  getSource,
  getUid,
  getUndershot
} = queueSelectors

const {
  getTrackId: getPlayerTrackId,
  getUid: getPlayerUid,
  getPreviewing: getPlayerPreviewing
} = playerSelectors

const { add, clear, next, pause, play, queueAutoplay, previous, remove } =
  queueActions
const { getId } = cacheSelectors
const { getUser } = cacheUsersSelectors
const { getTrack } = cacheTracksSelectors
const { getCollection } = cacheCollectionsSelectors
const getUserId = accountSelectors.getUserId

const QUEUE_SUBSCRIBER_NAME = 'QUEUE'

export function* getToQueue(prefix: string, entry: { kind: Kind; uid: UID }) {
  if (entry.kind === Kind.COLLECTIONS) {
    const collection = yield* select(getCollection, { uid: entry.uid })
    if (!collection) return

    const {
      playlist_contents: { track_ids: trackIds }
    } = collection
    // Replace the track uid source w/ the full source including collection source
    // Replace the track count w/ it's index in the array
    const collectionUid = Uid.fromString(entry.uid)
    const collectionSource = collectionUid.source

    return trackIds.map(({ track, uid }, idx: number) => {
      const trackUid = Uid.fromString(uid ?? '')
      trackUid.source = `${collectionSource}:${trackUid.source}`
      trackUid.count = idx

      return {
        id: track,
        uid: trackUid.toString(),
        source: prefix
      }
    })
  } else if (entry.kind === Kind.TRACKS) {
    const track = yield* select(getTrack, { uid: entry.uid })
    const currentUserId = yield* select(getUserId)
    if (!track) return {}
    const doesUserHaveStreamAccess = !!track.access.stream
    return {
      id: track.track_id,
      uid: entry.uid,
      source: prefix,
      isPreview: isPreview(track, currentUserId) && !doesUserHaveStreamAccess
    }
  }
}

const flatten = (list: any[]): any[] =>
  list.reduce((a, b) => a.concat(Array.isArray(b) ? flatten(b) : b), [])

function* handleQueueAutoplay({
  skip,
  ignoreSkip,
  track
}: {
  skip: boolean
  ignoreSkip: boolean
  track: any
}) {
  const isQueueAutoplayEnabled = yield* select(getQueueAutoplay)
  const index = yield* select(getIndex)
  if (!isQueueAutoplayEnabled || index < 0) {
    return
  }

  // Get recommended tracks if not in shuffle mode
  // and not in repeat mode and
  // - close to end of queue, or
  // - playing first song of lineup and lineup has only one song
  const length = yield* select(getLength)
  const shuffle = yield* select(getShuffle)
  const repeatMode = yield* select(getRepeat)
  const isCloseToEndOfQueue = index + 2 >= length
  const isNotRepeating =
    repeatMode === RepeatMode.OFF ||
    (repeatMode === RepeatMode.SINGLE && (skip || ignoreSkip))

  if (!shuffle && isNotRepeating && isCloseToEndOfQueue) {
    yield* waitForAccount()
    const userId = yield* select(getUserId)
    yield* put(
      queueAutoplay({
        genre: track?.genre,
        exclusionList: track ? [track.track_id] : [],
        currentUserId: userId
      })
    )
  }
}

/**
 * Play the queue. The side effects are slightly complicated, but can be summarized in the following
 * cases.
 * 1. If the caller provided a uid, play that uid.
 * 2. If no uid was provided and the queue is empty, find whatever lineup is on the page, queue it and play it.
 * 3. If the queue is indexed onto a different uid than the player, play the queue's uid
 * 4. Resume whatever was playing on the player
 */
export function* watchPlay() {
  yield* takeLatest(play.type, function* (action: ReturnType<typeof play>) {
    const { uid, trackId, isPreview, collectible } = action.payload

    // Play a specific uid
    const playerUid = yield* select(getPlayerUid)
    const playerTrackId = yield* select(getPlayerTrackId)
    const playerIsPreviewing = yield* select(getPlayerPreviewing)

    if (uid || trackId) {
      const playActionTrack = yield* select(
        getTrack,
        trackId ? { id: trackId } : { uid }
      )

      if (!playActionTrack) return

      yield* call(handleQueueAutoplay, {
        skip: false,
        ignoreSkip: true,
        track: playActionTrack
      })

      const user: User | null = playActionTrack
        ? yield* select(getUser, { id: playActionTrack.owner_id })
        : null

      // Skip deleted tracks
      if (
        (playActionTrack && playActionTrack.is_delete) ||
        // @ts-ignore user incorrectly typed as `null`. ignoring until we implement typed-redux-saga
        user?.is_deactivated
      ) {
        yield* put(next({}))
        return
      }

      // Make sure that we should actually play
      const noTrackPlaying = !playerTrackId
      const trackIsDifferent = playerTrackId !== playActionTrack.track_id
      const trackIsSameButDifferentUid =
        playerTrackId === playActionTrack.track_id &&
        (uid !== playerUid || !!isPreview !== playerIsPreviewing)
      if (noTrackPlaying || trackIsDifferent || trackIsSameButDifferentUid) {
        yield* put(
          playerActions.play({
            uid,
            isPreview,
            trackId: playActionTrack.track_id,
            onEnd: next
          })
        )
      } else {
        yield* put(playerActions.play({}))
      }
    } else if (collectible) {
      yield* put(playerActions.stop({}))
      yield* put(
        playerActions.playCollectible({
          collectible,
          onEnd: next
        })
      )
    } else {
      // If nothing is queued, grab the proper lineup, queue it and play it
      const index = yield* select(getIndex)
      if (index === -1) {
        const getLineupSelectorForRoute = yield* getContext(
          'getLineupSelectorForRoute'
        )
        if (!getLineupSelectorForRoute) return
        // @ts-ignore todo
        const lineup: LineupState<{ id: number }> = yield* select(
          getLineupSelectorForRoute()
        )
        if (!lineup) return
        if (lineup.entries.length > 0) {
          yield* put(clear({}))
          const toQueue = yield* all(
            lineup.entries.map((e: { kind: Kind; uid: UID }) =>
              call(getToQueue, lineup.prefix, e)
            )
          )
          const flattenedQueue = flatten(toQueue)
          yield* put(add({ entries: flattenedQueue }))

          const playTrack = yield* select(getTrack, {
            uid: flattenedQueue[0].uid
          })

          if (!playTrack) return

          yield* put(
            play({
              uid: flattenedQueue[0].uid,
              trackId: playTrack.track_id,
              source: lineup.prefix
            })
          )
        }
      } else {
        const queueUid = yield* select(getPlayerUid)
        const playerTrackId = yield* select(getPlayerTrackId)
        if (queueUid && playerTrackId && queueUid !== playerUid) {
          yield* put(
            playerActions.play({ uid: queueUid, trackId: playerTrackId })
          )
        } else {
          // Play whatever is/was playing
          yield* put(playerActions.play({}))
        }
      }
    }
  })
}

export function* watchPause() {
  yield* takeEvery(pause.type, function* (action: ReturnType<typeof pause>) {
    yield* put(playerActions.pause({}))
  })
}

export function* watchNext() {
  yield* takeEvery(next.type, function* (action: ReturnType<typeof next>) {
    const skip = action.payload?.skip

    // If the queue has overshot the end, reset the song
    const overshot = yield* select(getOvershot)
    if (overshot) {
      yield* put(playerActions.reset({ shouldAutoplay: false }))
      return
    }

    // For the audio nft playlist flow
    const collectible = yield* select(getCollectible)
    if (collectible) {
      const event = make(Name.PLAYBACK_PLAY, {
        id: `${collectible.id}`,
        source: PlaybackSource.PASSIVE
      })
      yield* put(event)

      const source = yield* select(getSource)
      if (source) {
        yield* put(play({ collectible, source }))
      }
      return
    }

    const id = (yield* select(getQueueTrackId)) as ID
    const track = yield* select(getTrack, { id })
    const user = yield* select(getUser, { id: track?.owner_id })
    const currentUserId = yield* select(getUserId)
    const doesUserHaveStreamAccess = !!track?.access?.stream

    // Skip deleted, owner deactivated, or locked gated track
    if (
      track &&
      (track.is_delete ||
        user?.is_deactivated ||
        (!doesUserHaveStreamAccess && !track.preview_cid))
    ) {
      yield* put(next({ skip }))
    } else {
      const uid = yield* select(getUid)
      const source = yield* select(getSource)

      yield* call(handleQueueAutoplay, {
        skip: !!skip,
        ignoreSkip: false,
        track
      })

      if (track) {
        const repeatMode = yield* select(getRepeat)
        const trackIsSameAndRepeatSingle = repeatMode === RepeatMode.SINGLE
        const isTrackPreview =
          isPreview(track, currentUserId) && !doesUserHaveStreamAccess

        if (trackIsSameAndRepeatSingle) {
          yield* put(
            playerActions.play({
              uid,
              trackId: track.track_id,
              onEnd: next,
              isPreview: isTrackPreview
            })
          )
        } else {
          yield* put(
            play({
              uid,
              trackId: id,
              source,
              isPreview: isTrackPreview
            })
          )
          const event = make(Name.PLAYBACK_PLAY, {
            id: `${id}`,
            source: PlaybackSource.PASSIVE
          })
          yield* put(event)
        }
      } else {
        yield* put(playerActions.stop({}))
      }
    }
  })
}

export function* watchQueueAutoplay() {
  yield* takeEvery(
    queueAutoplay.type,
    function* (action: ReturnType<typeof queueAutoplay>) {
      const { genre, exclusionList, currentUserId } = action.payload
      const tracks = yield* call(
        getRecommendedTracks,
        genre,
        exclusionList,
        currentUserId
      )
      const recommendedTracks = tracks.map(({ track_id }) => ({
        id: track_id,
        uid: makeUid(Kind.TRACKS, track_id),
        source: QueueSource.RECOMMENDED_TRACKS
      }))
      yield* put(add({ entries: recommendedTracks }))
    }
  )
}

export function* watchPrevious() {
  yield* takeEvery(
    previous.type,
    function* (action: ReturnType<typeof previous>) {
      // If the queue has undershot the beginning, reset the song
      const undershot = yield* select(getUndershot)
      if (undershot) {
        yield* put(playerActions.reset({ shouldAutoplay: false }))
        return
      }

      // For the audio nft playlist flow
      const collectible = yield* select(getCollectible)
      if (collectible) {
        const event = make(Name.PLAYBACK_PLAY, {
          id: `${collectible.id}`,
          source: PlaybackSource.PASSIVE
        })
        yield* put(event)

        const source = yield* select(getSource)
        if (source) {
          yield* put(play({ collectible, source }))
        }
        return
      }

      const uid = yield* select(getUid)
      const id = (yield* select(getQueueTrackId)) as Nullable<ID>
      const track = yield* select(getTrack, { id })
      const source = yield* select(getSource)
      const user = yield* select(getUser, { id: track?.owner_id })
      const currentUserId = yield* select(getUserId)
      const doesUserHaveStreamAccess = !!track?.access?.stream

      // If we move to a previous song that's been
      // deleted or to which the user does not have access, skip over it.
      if (
        track &&
        (track.is_delete ||
          user?.is_deactivated ||
          (!doesUserHaveStreamAccess && !track.preview_cid))
      ) {
        yield* put(previous())
      } else {
        const index = yield* select(getIndex)
        if (track && index >= 0) {
          yield* put(
            play({
              uid,
              trackId: id,
              source,
              isPreview:
                isPreview(track, currentUserId) && !doesUserHaveStreamAccess
            })
          )
          const event = make(Name.PLAYBACK_PLAY, {
            id: `${id}`,
            source: PlaybackSource.PASSIVE
          })
          yield* put(event)
        } else {
          yield* put(playerActions.stop({}))
        }
      }
    }
  )
}

export function* watchAdd() {
  yield* takeEvery(add.type, function* (action: ReturnType<typeof add>) {
    const { entries } = action.payload

    const subscribers = entries.map((entry) => ({
      uid: QUEUE_SUBSCRIBER_NAME,
      id: entry.id
    }))
    yield* put(cacheActions.subscribe(Kind.TRACKS, subscribers))
  })
}

export function* watchRemove() {
  yield* takeEvery(remove.type, function* (action: ReturnType<typeof remove>) {
    const { uid } = action.payload

    const id = yield* select(getId, { kind: Kind.TRACKS, uid })
    yield* put(
      cacheActions.unsubscribe(Kind.TRACKS, [
        { uid: QUEUE_SUBSCRIBER_NAME, id }
      ])
    )
  })
}

const sagas = () => {
  const sagas = [
    watchPlay,
    watchPause,
    watchNext,
    watchQueueAutoplay,
    watchPrevious,
    watchAdd,
    watchRemove
  ]
  return sagas
}

export default sagas
