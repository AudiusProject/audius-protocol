import {
  all,
  call,
  put,
  select,
  takeEvery,
  takeLatest
} from 'redux-saga/effects'

import { ID, UID } from 'common/models/Identifiers'
import Kind from 'common/models/Kind'
import Track from 'common/models/Track'
import { getUserId } from 'common/store/account/selectors'
import * as cacheActions from 'common/store/cache/actions'
import { getCollection } from 'common/store/cache/collections/selectors'
import { getId } from 'common/store/cache/selectors'
import { getTrack } from 'common/store/cache/tracks/selectors'
import { makeUid, Uid } from 'common/utils/uid'
import { Name, PlaybackSource } from 'services/analytics'
import { make } from 'store/analytics/actions'
import { getLineupSelectorForRoute } from 'store/lineup/lineupForRoute'
import {
  getTrackId as getPlayerTrackId,
  getUid as getPlayerUid
} from 'store/player/selectors'
import * as playerActions from 'store/player/slice'
import * as queueActions from 'store/queue/actions'
import {
  getId as getQueueTrackId,
  getIndex,
  getLength,
  getOvershot,
  getRepeat,
  getShuffle,
  getSource,
  getUid,
  getUndershot
} from 'store/queue/selectors'
import {
  add,
  clear,
  next,
  pause,
  play,
  previous,
  remove
} from 'store/queue/slice'
import { Queueable, RepeatMode, Source } from 'store/queue/types'

import { Nullable } from '../../common/utils/typeUtils'
import { getRecommendedTracks } from '../recommendation/sagas'

import mobileSagas from './mobileSagas'

const NATIVE_MOBILE = process.env.REACT_APP_NATIVE_MOBILE
const QUEUE_SUBSCRIBER_NAME = 'QUEUE'

export function* getToQueue(prefix: string, entry: { kind: Kind; uid: UID }) {
  if (entry.kind === Kind.COLLECTIONS) {
    const collection = yield select(getCollection, { uid: entry.uid })
    const {
      playlist_contents: { track_ids: trackIds }
    } = collection
    // Replace the track uid source w/ the full source including collection source
    // Replace the track count w/ it's index in the array
    const collectionUid = Uid.fromString(entry.uid)
    const collectionSource = collectionUid.source

    return trackIds.map(
      ({ track, uid }: { track: ID; uid: UID }, idx: number) => {
        const trackUid = Uid.fromString(uid)
        trackUid.source = `${collectionSource}:${trackUid.source}`
        trackUid.count = idx

        return {
          id: track,
          uid: trackUid.toString(),
          source: prefix
        }
      }
    )
  } else if (entry.kind === Kind.TRACKS) {
    const track = yield select(getTrack, { uid: entry.uid })
    if (!track) return {}
    return {
      id: track.track_id,
      uid: entry.uid,
      source: prefix
    }
  }
}

const flatten = (list: any[]): any[] =>
  list.reduce((a, b) => a.concat(Array.isArray(b) ? flatten(b) : b), [])

/**
 * Play the queue. The side effects are slightly complicated, but can be summarzed in the following
 * cases.
 * 1. If the caller provided a uid, play that uid.
 * 2. If no uid was provided and the queue is empty, find whatever lineup is on the page, queue it and play it.
 * 3. If the queue is indexed onto a different uid than the player, play the queue's uid
 * 4. Resume whatever was playing on the player
 */
export function* watchPlay() {
  yield takeLatest(play.type, function* (action: ReturnType<typeof play>) {
    const { uid, trackId } = action.payload

    // Play a specific uid
    const playerUid = yield select(getPlayerUid)
    const playerTrackId = yield select(getPlayerTrackId)
    if (uid || trackId) {
      const playActionTrack = trackId
        ? yield select(getTrack, { id: trackId })
        : yield select(getTrack, { uid })
      const repeatMode = yield select(getRepeat)

      // Skip deleted tracks
      if (playActionTrack && playActionTrack.is_delete) {
        yield put(next({}))
        return
      }

      // Make sure that we should actually play
      const noTrackPlaying = !playerTrackId
      const trackIsDifferent = playerTrackId !== playActionTrack.track_id
      const trackIsSameButDifferentUid =
        playerTrackId === playActionTrack.track_id && uid !== playerUid
      const trackIsSameAndRepeatSingle =
        playerTrackId === playActionTrack.track_id &&
        repeatMode === RepeatMode.SINGLE
      if (
        noTrackPlaying ||
        trackIsDifferent ||
        trackIsSameButDifferentUid ||
        trackIsSameAndRepeatSingle
      ) {
        yield put(playerActions.stop({}))
        yield put(
          playerActions.play({
            uid: uid,
            trackId: playActionTrack.track_id,
            onEnd: next
          })
        )
      } else {
        yield put(playerActions.play({}))
      }
    } else {
      // If nothing is queued, grab the proper lineup, queue it and play it
      const index = yield select(getIndex)
      if (index === -1) {
        const lineup = yield select(getLineupSelectorForRoute())
        if (!lineup) return
        if (lineup.entries.length > 0) {
          yield put(clear({}))
          const toQueue = yield all(
            lineup.entries.map((e: { kind: Kind; uid: UID }) =>
              call(getToQueue, lineup.prefix, e)
            )
          )
          const flattenedQueue = flatten(toQueue)
          yield put(add({ entries: flattenedQueue }))

          const playTrack = yield select(getTrack, {
            uid: flattenedQueue[0].uid
          })
          yield put(
            play({
              uid: flattenedQueue[0].uid,
              trackId: playTrack.track_id,
              source: lineup.prefix
            })
          )
        }
      } else {
        const queueUid = yield select(getPlayerUid)
        const playerTrackid = yield select(getPlayerTrackId)
        if (queueUid !== playerUid) {
          yield put(playerActions.stop({}))
          yield put(
            playerActions.play({ uid: queueUid, trackId: playerTrackid })
          )
        } else {
          // Play whatever is/was playing
          yield put(playerActions.play({}))
        }
      }
    }
  })
}

export function* watchPause() {
  yield takeEvery(pause.type, function* (action: ReturnType<typeof pause>) {
    yield put(playerActions.pause({}))
  })
}

export function* watchNext() {
  yield takeEvery(next.type, function* (action: ReturnType<typeof next>) {
    const { skip } = action.payload

    // If the queue has overshot the end, reset the song
    const overshot = yield select(getOvershot)
    if (overshot) {
      yield put(playerActions.reset({ shouldAutoplay: false }))
      return
    }

    // Skip deleted track
    const id = yield select(getQueueTrackId)
    const track = yield select(getTrack, { id })
    if (track && track.is_delete) {
      yield put(next({ skip }))
    } else {
      const index = yield select(getIndex)
      if (index >= 0) {
        const source = yield select(getSource)
        const length = yield select(getLength)
        const shuffle = yield select(getShuffle)
        const repeatMode = yield select(getRepeat)

        const isCloseToEndOfQueue = index + 1 >= length
        const isNotRepeating =
          repeatMode === RepeatMode.OFF ||
          (repeatMode === RepeatMode.SINGLE && skip)

        // Get recommended tracks if not in shuffle and repeat modes and close to end of queue
        if (!shuffle && isNotRepeating && isCloseToEndOfQueue) {
          const userId = yield select(getUserId)
          yield put(
            queueActions.queueAutoplay(
              track?.genre,
              track ? [track.track_id] : [],
              userId
            )
          )
        }
        const uid = yield select(getUid)
        yield put(play({ uid, trackId: id, source }))

        const event = make(Name.PLAYBACK_PLAY, {
          id: `${id}`,
          source: PlaybackSource.PASSIVE
        })
        yield put(event)
      } else {
        yield put(playerActions.stop({}))
      }
    }
  })
}

export function* watchQueueAutoplay() {
  yield takeEvery(queueActions.QUEUE_AUTOPLAY, function* (
    action: ReturnType<typeof queueActions.queueAutoplay>
  ) {
    const { genre, exclusionList, currentUserId } = action
    const tracks: Track[] = yield call(
      getRecommendedTracks,
      genre,
      exclusionList,
      currentUserId
    )
    const recommendedTracks = tracks.map(({ track_id }) => ({
      id: track_id,
      uid: makeUid(Kind.TRACKS, track_id),
      source: Source.RECOMMENDED_TRACKS
    }))
    yield put(add({ entries: recommendedTracks }))
  })
}

export function* watchPrevious() {
  yield takeEvery(previous.type, function* (
    action: ReturnType<typeof previous>
  ) {
    // If the queue has undershot the beginning, reset the song
    const undershot = yield select(getUndershot)
    if (undershot) {
      yield put(playerActions.reset({ shouldAutoplay: false }))
      return
    }

    const uid = yield select(getUid)
    const id = yield select(getQueueTrackId)
    const track = yield select(getTrack, { id })
    const source = yield select(getSource)

    // If we move to a previous song that's been
    // deleted, skip over it.
    if (track && track.is_delete) {
      yield put(previous({}))
    } else {
      const index = yield select(getIndex)
      if (index >= 0) {
        yield put(play({ uid, trackId: id, source }))
        const event = make(Name.PLAYBACK_PLAY, {
          id: `${id}`,
          source: PlaybackSource.PASSIVE
        })
        yield put(event)
      } else {
        yield put(playerActions.stop({}))
      }
    }
  })
}

export function* watchAdd() {
  yield takeEvery(add.type, function* (action: ReturnType<typeof add>) {
    const { entries } = action.payload

    const subscribers = entries.map(entry => ({
      uid: QUEUE_SUBSCRIBER_NAME,
      id: entry.id
    }))
    yield put(cacheActions.subscribe(Kind.TRACKS, subscribers))
  })
}

export function* watchRemove() {
  yield takeEvery(remove.type, function* (action: ReturnType<typeof remove>) {
    const { uid } = action.payload

    const id = yield select(getId, { kind: Kind.TRACKS, uid })
    yield put(
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
  return NATIVE_MOBILE ? sagas.concat(mobileSagas()) : sagas
}

export default sagas
