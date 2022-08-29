import {
  Kind,
  StringKeys,
  encodeHashId,
  cacheTracksSelectors,
  cacheUsersSelectors,
  cacheActions,
  queueActions,
  tracksSocialActions,
  getContext,
  actionChannelDispatcher,
  playerActions,
  playerSelectors,
  Nullable
} from '@audius/common'
import { eventChannel } from 'redux-saga'
import {
  select,
  take,
  call,
  put,
  spawn,
  takeLatest,
  delay
} from 'typed-redux-saga'

import errorSagas from './errorSagas'
const {
  play,
  playSucceeded,
  playCollectible,
  playCollectibleSucceeded,
  pause,
  stop,
  setBuffering,
  reset,
  resetSuceeded,
  seek,
  error: errorAction
} = playerActions

const { getTrackId, getUid, getCounter, getPlaying } = playerSelectors

const { recordListen } = tracksSocialActions
const { getUser } = cacheUsersSelectors
const { getTrack } = cacheTracksSelectors

const PLAYER_SUBSCRIBER_NAME = 'PLAYER'
const RECORD_LISTEN_SECONDS = 1
const RECORD_LISTEN_INTERVAL = 1000

// Set of track ids that should be forceably streamed as mp3 rather than hls because
// their hls maybe corrupt.
let FORCE_MP3_STREAM_TRACK_IDS: Set<string> | null = null

export function* watchPlay() {
  const audiusBackendInstance = yield* getContext('audiusBackendInstance')
  const apiClient = yield* getContext('apiClient')
  const remoteConfigInstance = yield* getContext('remoteConfigInstance')
  yield* takeLatest(play.type, function* (action: ReturnType<typeof play>) {
    const { uid, trackId, onEnd } = action.payload ?? {}

    if (!FORCE_MP3_STREAM_TRACK_IDS) {
      FORCE_MP3_STREAM_TRACK_IDS = new Set(
        (
          remoteConfigInstance.getRemoteVar(
            StringKeys.FORCE_MP3_STREAM_TRACK_IDS
          ) || ''
        ).split(',')
      )
    }

    const audioPlayer = yield* getContext('audioPlayer')

    if (trackId) {
      // Load and set end action.
      const track = yield* select(getTrack, { id: trackId })
      if (!track) return

      const owner = yield* select(getUser, {
        id: track.owner_id
      })

      const gateways = owner
        ? audiusBackendInstance.getCreatorNodeIPFSGateways(
            owner.creator_node_endpoint
          )
        : []
      const encodedTrackId = encodeHashId(trackId)
      const forceStreamMp3 =
        encodedTrackId && FORCE_MP3_STREAM_TRACK_IDS.has(encodedTrackId)
      const forceStreamMp3Url = forceStreamMp3
        ? apiClient.makeUrl(`/tracks/${encodedTrackId}/stream`)
        : null

      const endChannel = eventChannel((emitter) => {
        audioPlayer.load(
          track.track_segments,
          () => {
            if (onEnd) {
              emitter(onEnd({}))
            }
          },
          // @ts-ignore a few issues with typing here...
          [track._first_segment],
          gateways,
          {
            id: encodedTrackId,
            title: track.title,
            artist: owner?.name
          },
          forceStreamMp3Url
        )
        return () => {}
      })
      yield* spawn(actionChannelDispatcher, endChannel)
      yield* put(
        cacheActions.subscribe(Kind.TRACKS, [
          { uid: PLAYER_SUBSCRIBER_NAME, id: trackId }
        ])
      )
    }
    // Play.
    audioPlayer.play()
    yield* put(playSucceeded({ uid, trackId }))
  })
}

export function* watchCollectiblePlay() {
  yield* takeLatest(
    playCollectible.type,
    function* (action: ReturnType<typeof playCollectible>) {
      const { collectible, onEnd } = action.payload
      const audioPlayer = yield* getContext('audioPlayer')
      const endChannel = eventChannel((emitter) => {
        audioPlayer.load(
          [],
          () => {
            if (onEnd) {
              emitter(onEnd({}))
            }
          },
          [],
          [], // Gateways
          {
            id: collectible.id,
            title: collectible.name ?? 'Collectible',
            // TODO: Add account user name here
            artist: 'YOUR NAME HERE',
            artwork:
              collectible.imageUrl ??
              collectible.frameUrl ??
              collectible.gifUrl ??
              ''
          },
          collectible.animationUrl
        )
        return () => {}
      })
      yield* spawn(actionChannelDispatcher, endChannel)

      audioPlayer.play()
      yield* put(playCollectibleSucceeded({ collectible }))
    }
  )
}

export function* watchPause() {
  yield* takeLatest(pause.type, function* (action: ReturnType<typeof pause>) {
    const onlySetState = action.payload?.onlySetState

    const audioPlayer = yield* getContext('audioPlayer')
    if (onlySetState) return
    audioPlayer.pause()
  })
}

export function* watchReset() {
  yield* takeLatest(reset.type, function* (action: ReturnType<typeof reset>) {
    const { shouldAutoplay } = action.payload

    const audioPlayer = yield* getContext('audioPlayer')

    audioPlayer.seek(0)
    if (!shouldAutoplay) {
      audioPlayer.pause()
    } else {
      const playerUid = yield* select(getUid)
      const playerTrackId = yield* select(getTrackId)
      if (playerUid && playerTrackId) {
        yield* put(
          play({
            uid: playerUid,
            trackId: playerTrackId,
            onEnd: queueActions.next
          })
        )
      }
    }
    yield* put(resetSuceeded({ shouldAutoplay }))
  })
}

export function* watchStop() {
  yield* takeLatest(stop.type, function* (action: ReturnType<typeof stop>) {
    const id = yield* select(getTrackId)
    yield* put(
      cacheActions.unsubscribe(Kind.TRACKS, [
        { uid: PLAYER_SUBSCRIBER_NAME, id }
      ])
    )
    const audioPlayer = yield* getContext('audioPlayer')
    audioPlayer.stop()
  })
}

export function* watchSeek() {
  yield* takeLatest(seek.type, function* (action: ReturnType<typeof seek>) {
    const { seconds } = action.payload

    const audioPlayer = yield* getContext('audioPlayer')
    audioPlayer.seek(seconds)
  })
}

// NOTE: Event listeners are attached to the audio object b/c the audio can be manipulated
// directly by the browser & not via the ui or hot keys. If the event listener is triggered
// and the playing field does not match audio, then dispatch an action to update the store.
const AudioEvents = Object.freeze({
  PLAY: 'play',
  PAUSE: 'pause'
})

export function* setAudioListeners() {
  const audioPlayer = yield* getContext('audioPlayer')
  const chan = yield* call(watchAudio, audioPlayer.audio)
  while (true) {
    const audioEvent = yield* take(chan)
    const playing = yield* select(getPlaying)
    if (audioEvent === AudioEvents.PLAY && !playing) {
      yield* put(play({}))
    } else if (audioEvent === AudioEvents.PAUSE && playing) {
      yield* put(pause({}))
    }
  }
}

export function* handleAudioBuffering() {
  const audioPlayer = yield* getContext('audioPlayer')
  const chan = eventChannel((emitter) => {
    audioPlayer.onBufferingChange = (isBuffering: boolean) => {
      emitter(setBuffering({ buffering: isBuffering }))
    }
    return () => {}
  })
  yield* spawn(actionChannelDispatcher, chan)
}

export function* handleAudioErrors() {
  // Watch for audio errors and emit an error saga dispatching action
  const audioPlayer = yield* getContext('audioPlayer')

  const chan = eventChannel<{ error: string; data: string }>((emitter) => {
    audioPlayer.onError = (error: string, data: string | Event) => {
      emitter({ error, data: data as string })
    }
    return () => {}
  })

  while (true) {
    const { error, data } = yield* take(chan)
    const trackId = yield* select(getTrackId)
    if (trackId) {
      yield* put(errorAction({ error, trackId, info: data }))
    }
  }
}

function watchAudio(audio: HTMLAudioElement) {
  return eventChannel((emitter) => {
    const emitPlay = () => emitter(AudioEvents.PLAY)
    const emitPause = () => {
      if (!audio.ended) {
        emitter(AudioEvents.PAUSE)
      }
    }

    if (audio) {
      audio.addEventListener(AudioEvents.PLAY, emitPlay)
      audio.addEventListener(AudioEvents.PAUSE, emitPause)
    }

    return () => {
      if (audio) {
        audio.removeEventListener(AudioEvents.PLAY, emitPlay)
        audio.removeEventListener(AudioEvents.PAUSE, emitPause)
      }
    }
  })
}

/**
 * Poll for whether a track has been listened to.
 */
function* recordListenWorker() {
  // Store the last seen play counter to make sure we only record
  // a listen for each "unique" track play. Using an id here wouldn't
  // be enough because the user might have "repeat single" mode turned on.
  let lastSeenPlayCounter: Nullable<number> = null
  while (true) {
    const trackId = yield* select(getTrackId)
    const playCounter = yield* select(getCounter)
    const audioPlayer = yield* getContext('audioPlayer')
    const position = audioPlayer.getPosition()

    const newPlay = lastSeenPlayCounter !== playCounter

    if (newPlay && position > RECORD_LISTEN_SECONDS) {
      if (trackId) yield* put(recordListen(trackId))
      lastSeenPlayCounter = playCounter
    }
    yield* delay(RECORD_LISTEN_INTERVAL)
  }
}

const sagas = () => {
  return [
    watchPlay,
    watchCollectiblePlay,
    watchPause,
    watchStop,
    watchReset,
    watchSeek,
    setAudioListeners,
    handleAudioErrors,
    handleAudioBuffering,
    recordListenWorker,
    errorSagas
  ]
}

export default sagas
