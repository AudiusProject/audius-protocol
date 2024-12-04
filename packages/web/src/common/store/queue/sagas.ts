import {
  Kind,
  ID,
  Name,
  PlaybackSource,
  LineupState,
  User,
  Collectible,
  Track,
  Collection,
  UserTrackMetadata,
  LineupEntry
} from '@audius/common/models'
import {
  accountSelectors,
  cacheCollectionsSelectors,
  cacheTracksSelectors,
  cacheUsersSelectors,
  lineupRegistry,
  queueActions,
  queueSelectors,
  reachabilitySelectors,
  RepeatMode,
  QueueSource,
  getContext,
  playerActions,
  playerSelectors,
  PlayerBehavior
} from '@audius/common/store'
import { Uid, makeUid, waitForAccount, Nullable } from '@audius/common/utils'
import { all, call, put, select, takeEvery, takeLatest } from 'typed-redux-saga'

import { make } from 'common/store/analytics/actions'
import { getRecommendedTracks } from 'common/store/recommendation/sagas'
import { getLocation } from 'store/routing/selectors'

const {
  getCollectible,
  getId: getQueueTrackId,
  getIndex,
  getLength,
  getOvershot,
  getRepeat,
  getShuffle,
  getSource,
  getUid,
  getUndershot
} = queueSelectors

const {
  getTrackId: getPlayerTrackId,
  getUid: getPlayerUid,
  getPlayerBehavior
} = playerSelectors

const { add, clear, next, pause, play, queueAutoplay, previous } = queueActions
const { getUser } = cacheUsersSelectors
const { getTrack } = cacheTracksSelectors
const { getCollection } = cacheCollectionsSelectors
const { getUserId } = accountSelectors
const { getIsReachable } = reachabilitySelectors

export function* getToQueue(
  prefix: string,
  entry: LineupEntry<Track | Collection>
) {
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
    if (!track) return {}
    return {
      id: track.track_id,
      uid: entry.uid,
      source: prefix,
      playerBehavior: PlayerBehavior.FULL_OR_PREVIEW
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
  const index = yield* select(getIndex)
  if (index < 0) {
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
    const { uid, trackId, collectible, playerBehavior } = action.payload

    // Play a specific uid
    const playerUid = yield* select(getPlayerUid)
    const playerTrackId = yield* select(getPlayerTrackId)
    const playerPlayerBehavior = yield* select(getPlayerBehavior)

    if (uid || trackId) {
      const playActionTrack = yield* select(
        getTrack,
        trackId ? { id: trackId } : { uid }
      )

      if (!playActionTrack) return

      const length = yield* select(getLength)
      const index = yield* select(getIndex)
      const isNearEndOfQueue = index + 3 >= length

      if (isNearEndOfQueue) {
        /* Fetch more lineup tracks if available. Ideally, this would run async after we've started
        playing the next track. But since we may skip the next track, we need the lineup and/or autoplay
        logic to be run ahead of time.
        Important note: Using the track we're being asked to play, as the lineup
        source may be changing with that track, and we don't want to look up a lineup
        using the "currentTrack" in the player.
        */
        yield* call(fetchLineupTracks, playActionTrack)
      }

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
        playerTrackId === playActionTrack.track_id && uid !== playerUid
      const trackIsSameButDifferentPlayerBehavior =
        playerTrackId === playActionTrack.track_id &&
        playerPlayerBehavior !== playerBehavior
      if (
        noTrackPlaying ||
        trackIsDifferent ||
        trackIsSameButDifferentUid ||
        trackIsSameButDifferentPlayerBehavior
      ) {
        yield* put(
          playerActions.play({
            uid,
            trackId: playActionTrack.track_id,
            onEnd: next,
            playerBehavior
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

        const location = yield* select(getLocation)

        const lineup: LineupState<Track> = yield* select(
          getLineupSelectorForRoute(location)
        )
        if (!lineup) return
        if (lineup.entries.length > 0) {
          yield* put(clear({}))
          const toQueue = yield* all(
            lineup.entries.map((e) => call(getToQueue, lineup.prefix, e))
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

// Fetches more lineup tracks if available. This is needed for cases
// where the user hasn't scrolled through the lineup.
function* fetchLineupTracks(currentTrack: Track) {
  const source = yield* select(getSource)
  if (!source) return

  const lineupEntry = lineupRegistry[source]
  if (!lineupEntry) return

  const currentTrackOwner = yield* select(getUser, {
    id: currentTrack.owner_id
  })

  const lineup = yield* select(lineupEntry.selector, currentTrackOwner?.handle)

  if (lineup.hasMore) {
    const offset = lineup.entries.length + lineup.deleted + lineup.nullCount
    yield* put(
      lineupEntry.actions.fetchLineupMetadatas(
        offset,
        5,
        false,
        lineup.payload,
        { handle: lineup.handle }
      )
    )
  }
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
    const playerBehavior = (yield* select(getPlayerBehavior) || undefined) as
      | PlayerBehavior
      | undefined
    const track = yield* select(getTrack, { id })
    const user = yield* select(getUser, { id: track?.owner_id })
    const doesUserHaveStreamAccess =
      !track?.is_stream_gated || !!track?.access?.stream

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

        if (trackIsSameAndRepeatSingle) {
          yield* put(
            playerActions.play({
              uid,
              trackId: track.track_id,
              onEnd: next,
              playerBehavior
            })
          )
        } else {
          yield* put(
            play({
              uid,
              trackId: id,
              source,
              playerBehavior
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
      const isReachable = yield* select(getIsReachable)
      if (!isReachable) return
      const tracks: UserTrackMetadata[] = yield* call(
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
      const collectible: Collectible | null = yield* select(getCollectible)
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
      const playerBehavior = (yield* select(getPlayerBehavior) || undefined) as
        | PlayerBehavior
        | undefined
      const track = yield* select(getTrack, { id })
      const source = yield* select(getSource)
      const user = yield* select(getUser, { id: track?.owner_id })
      const doesUserHaveStreamAccess =
        !track?.is_stream_gated || !!track?.access?.stream

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
              playerBehavior
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

const sagas = () => {
  const sagas = [
    watchPlay,
    watchPause,
    watchNext,
    watchQueueAutoplay,
    watchPrevious
  ]
  return sagas
}

export default sagas
