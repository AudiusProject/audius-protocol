import { Kind } from '@audius/common/models'
import { FeatureFlags, QueryParams } from '@audius/common/services'
import {
  accountSelectors,
  cacheTracksActions,
  cacheTracksSelectors,
  cacheActions,
  queueActions,
  reachabilitySelectors,
  tracksSocialActions,
  getContext,
  playerActions,
  playerSelectors,
  playbackPositionActions,
  playbackPositionSelectors,
  gatedContentSelectors,
  calculatePlayerBehavior,
  queueSelectors
} from '@audius/common/store'
import {
  Genre,
  encodeHashId,
  actionChannelDispatcher,
  getQueryParams,
  getTrackPreviewDuration,
  Nullable
} from '@audius/common/utils'
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

import { waitForWrite } from 'utils/sagaHelpers'

import errorSagas from './errorSagas'

const { getUserId } = accountSelectors
const { setTrackPosition } = playbackPositionActions
const { getTrackPosition } = playbackPositionSelectors
const { getTrackStreamUrl, getTrack } = cacheTracksSelectors
const { setStreamUrls } = cacheTracksActions
const {
  play,
  playSucceeded,
  playCollectible,
  playCollectibleSucceeded,
  pause,
  stop,
  setBuffering,
  reset,
  resetSucceeded,
  seek,
  setPlaybackRate,
  error: errorAction
} = playerActions

const { getTrackId, getUid, getCounter, getPlaying, getPlaybackRate } =
  playerSelectors
const { getPlayerBehavior } = queueSelectors

const { recordListen } = tracksSocialActions
const { getNftAccessSignatureMap } = gatedContentSelectors
const { getIsReachable } = reachabilitySelectors

const PLAYER_SUBSCRIBER_NAME = 'PLAYER'
const RECORD_LISTEN_SECONDS = 1
const RECORD_LISTEN_INTERVAL = 1000

export function* watchPlay() {
  const getFeatureEnabled = yield* getContext('getFeatureEnabled')
  yield* takeLatest(play.type, function* (action: ReturnType<typeof play>) {
    const { uid, trackId, playerBehavior, startTime, onEnd } =
      action.payload ?? {}

    const audioPlayer = yield* getContext('audioPlayer')
    const isNativeMobile = yield getContext('isNativeMobile')
    const isNewPodcastControlsEnabled = yield* call(
      getFeatureEnabled,
      FeatureFlags.PODCAST_CONTROL_UPDATES_ENABLED,
      FeatureFlags.PODCAST_CONTROL_UPDATES_ENABLED_FALLBACK
    )

    if (trackId) {
      // Load and set end action.
      const track = yield* select(getTrack, { id: trackId })

      const isReachable = yield* select(getIsReachable)

      if (!track) return

      if (!isReachable && isNativeMobile) {
        // Play offline.
        audioPlayer.play()
        yield* put(playSucceeded({ uid, trackId }))
        return
      }

      yield* call(waitForWrite)
      const audiusBackendInstance = yield* getContext('audiusBackendInstance')
      const apiClient = yield* getContext('apiClient')
      const currentUserId = yield* select(getUserId)
      const isOwner = currentUserId === track.owner_id

      const encodedTrackId = encodeHashId(trackId)

      let queryParams: QueryParams = {}
      const nftAccessSignatureMap = yield* select(getNftAccessSignatureMap)
      const nftAccessSignature =
        nftAccessSignatureMap[track.track_id]?.mp3 ?? null
      queryParams = (yield* call(getQueryParams, {
        audiusBackendInstance,
        nftAccessSignature,
        userId: currentUserId
      })) as unknown as QueryParams

      let trackDuration = track.duration

      const usePrefetchStreamUrls = yield* call(
        getFeatureEnabled,
        FeatureFlags.PREFETCH_STREAM_URLS
      )

      const { shouldSkip, shouldPreview } = calculatePlayerBehavior(
        track,
        playerBehavior
      )

      if (shouldSkip) {
        yield* put(queueActions.next({}))
        return
      }

      if (shouldPreview) {
        // Add preview query string and calculate preview duration for use later
        queryParams.preview = true
        trackDuration = getTrackPreviewDuration(track)
      }

      const streamUrl = yield* select(getTrackStreamUrl, track.track_id)

      const mp3Url = apiClient.makeUrl(
        `/tracks/${encodedTrackId}/stream`,
        queryParams
      )

      const isLongFormContent =
        track.genre === Genre.PODCASTS || track.genre === Genre.AUDIOBOOKS

      // Always prefer stream url unless an owner is previewing their own track,
      // since we haven't prefetched the preview.
      const url =
        usePrefetchStreamUrls && streamUrl && !(shouldPreview && isOwner)
          ? streamUrl
          : mp3Url

      const endChannel = eventChannel((emitter) => {
        audioPlayer.load(
          trackDuration ||
            track.track_segments.reduce(
              (duration, segment) => duration + parseFloat(segment.duration),
              0
            ),
          () => {
            if (onEnd) {
              emitter(onEnd({}))
            }
            if (isNewPodcastControlsEnabled && isLongFormContent) {
              emitter(
                setTrackPosition({
                  userId: currentUserId,
                  trackId,
                  positionInfo: {
                    status: 'COMPLETED',
                    playbackPosition: 0
                  }
                })
              )
            }
          },
          url
        )
        return () => {}
      })
      yield* spawn(actionChannelDispatcher, endChannel)
      yield* put(
        cacheActions.subscribe(Kind.TRACKS, [
          { uid: PLAYER_SUBSCRIBER_NAME, id: trackId }
        ])
      )

      if (isLongFormContent) {
        // Make sure that the playback rate is set when playing a podcast
        const playbackRate = yield* select(getPlaybackRate)
        audioPlayer.setPlaybackRate(playbackRate)

        if (isNewPodcastControlsEnabled) {
          // Set playback position for track to in progress if not already tracked
          const currentUserId = yield* select(getUserId)
          const trackPlaybackInfo = yield* select(getTrackPosition, {
            trackId,
            userId: currentUserId
          })
          if (trackPlaybackInfo?.status !== 'IN_PROGRESS') {
            yield* put(
              setTrackPosition({
                userId: currentUserId,
                trackId,
                positionInfo: {
                  status: 'IN_PROGRESS',
                  playbackPosition: 0
                }
              })
            )
          } else {
            audioPlayer.play()
            yield* put(
              playSucceeded({ uid, trackId, isPreview: shouldPreview })
            )
            yield* put(seek({ seconds: trackPlaybackInfo.playbackPosition }))
            return
          }
        }
      } else if (audioPlayer.getPlaybackRate() !== '1x') {
        // Reset playback rate when playing a regular track
        audioPlayer.setPlaybackRate('1x')
      }
    }

    // Play if user has access to track.
    const track = yield* select(getTrack, { id: trackId })
    const { shouldSkip, shouldPreview } = calculatePlayerBehavior(
      track,
      playerBehavior
    )
    if (shouldSkip) {
      yield* put(queueActions.next({}))
    } else {
      if (startTime) {
        audioPlayer.seek(startTime)
      }
      audioPlayer.play()
      yield* put(playSucceeded({ uid, trackId, isPreview: shouldPreview }))
    }
  })
}

export function* watchCollectiblePlay() {
  yield* takeLatest(
    playCollectible.type,
    function* (action: ReturnType<typeof playCollectible>) {
      const { collectible, onEnd } = action.payload
      const { animationUrl, videoUrl } = collectible
      const audioPlayer = yield* getContext('audioPlayer')
      const endChannel = eventChannel((emitter) => {
        audioPlayer.load(
          0,
          () => {
            if (onEnd) {
              emitter(onEnd({}))
            }
          },
          animationUrl ?? videoUrl
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
      const playerBehavior = yield* select(getPlayerBehavior)
      if (playerUid && playerTrackId) {
        yield* put(
          play({
            uid: playerUid,
            trackId: playerTrackId,
            onEnd: queueActions.next,
            playerBehavior: playerBehavior ?? undefined
          })
        )
      }
    }
    yield* put(resetSucceeded({ shouldAutoplay }))
  })
}

export function* watchStop() {
  yield* takeLatest(stop.type, function* (action: ReturnType<typeof stop>) {
    const id = yield* select(getTrackId)
    if (id) {
      yield* put(
        cacheActions.unsubscribe(Kind.TRACKS, [
          { uid: PLAYER_SUBSCRIBER_NAME, id }
        ])
      )
    }
    const audioPlayer = yield* getContext('audioPlayer')
    audioPlayer.stop()
  })
}

export function* watchSeek() {
  const getFeatureEnabled = yield* getContext('getFeatureEnabled')
  const audioPlayer = yield* getContext('audioPlayer')

  yield* takeLatest(seek.type, function* (action: ReturnType<typeof seek>) {
    const { seconds } = action.payload
    const isNewPodcastControlsEnabled = yield* call(
      getFeatureEnabled,
      FeatureFlags.PODCAST_CONTROL_UPDATES_ENABLED,
      FeatureFlags.PODCAST_CONTROL_UPDATES_ENABLED_FALLBACK
    )
    const trackId = yield* select(getTrackId)

    audioPlayer.seek(seconds)

    if (isNewPodcastControlsEnabled && trackId) {
      const track = yield* select(getTrack, { id: trackId })
      const currentUserId = yield* select(getUserId)
      const isLongFormContent =
        track?.genre === Genre.PODCASTS || track?.genre === Genre.AUDIOBOOKS

      if (isLongFormContent) {
        yield* put(
          setTrackPosition({
            trackId,
            userId: currentUserId,
            positionInfo: {
              status: 'IN_PROGRESS',
              playbackPosition: seconds
            }
          })
        )
      }
    }
  })
}

export function* watchSetPlaybackRate() {
  const audioPlayer = yield* getContext('audioPlayer')
  yield* takeLatest(
    setPlaybackRate.type,
    function* (action: ReturnType<typeof setPlaybackRate>) {
      const { rate } = action.payload
      audioPlayer.setPlaybackRate(rate)
    }
  )
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
      const getFeatureEnabled = yield* getContext('getFeatureEnabled')
      const usePrefetchStreamUrls = yield* call(
        getFeatureEnabled,
        FeatureFlags.PREFETCH_STREAM_URLS
      )
      const streamUrl = yield* select(getTrackStreamUrl, trackId)
      // Check if we were attempting to use a prefetched url
      // If so we likely have a recovery option
      if (streamUrl && usePrefetchStreamUrls) {
        const reportToSentry = yield* getContext('reportToSentry')
        reportToSentry({
          error: new Error('Audio prefetch playback saga error'),
          additionalInfo: { trackId, streamUrl }
        })
        // The pre-fetched stream url failed, so we set the value to undefined
        yield* put(setStreamUrls({ [trackId]: undefined }))
        // Retrigger play action.
        // Now the prefetch url is unset and it will instead play from the discovery node /stream endpoint as a fallback
        yield* put(play({ trackId }))
      } else {
        yield* put(errorAction({ error, trackId, info: data }))
      }
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
  const isNativeMobile = yield* getContext('isNativeMobile')
  if (isNativeMobile) return
  // Store the last seen play counter to make sure we only record
  // a listen for each "unique" track play. Using an id here wouldn't
  // be enough because the user might have "repeat single" mode turned on.
  let lastSeenPlayCounter: Nullable<number> = null
  while (true) {
    const trackId = yield* select(getTrackId)
    const playCounter = yield* select(getCounter)
    const audioPlayer = yield* getContext('audioPlayer')
    const position = audioPlayer.getPosition() as number

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
    watchSetPlaybackRate,
    setAudioListeners,
    handleAudioErrors,
    handleAudioBuffering,
    recordListenWorker,
    errorSagas
  ]
}

export default sagas
