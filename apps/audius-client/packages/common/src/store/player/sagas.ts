import { call, delay, put, select, takeEvery } from 'typed-redux-saga'

import { AudioPlayer } from 'services/audio-player'
import { FeatureFlags } from 'services/remote-config'
import { getTrack } from 'store/cache/tracks/selectors'
import { getContext } from 'store/effects'
import { setTrackPosition } from 'store/playback-position/slice'
import { Genre } from 'utils/genres'

import { getPlaying, getTrackId } from './selectors'
import { setPlaybackRate } from './slice'
import { PlaybackRate, PLAYBACK_RATE_LS_KEY } from './types'

const PLAYBACK_COMPLETE_SECONDS = 6
const RECORD_PLAYBACK_POSITION_INTERVAL = 5000

/**
 * Sets the playback rate from local storage when the app loads
 */
function* setInitialPlaybackRate() {
  const getFeatureEnabled = yield* getContext('getFeatureEnabled')
  const getLocalStorageItem = yield* getContext('getLocalStorageItem')
  const isPodcastFeaturesEnabled = yield* call(
    getFeatureEnabled,
    FeatureFlags.PODCAST_CONTROL_UPDATES_ENABLED,
    FeatureFlags.PODCAST_CONTROL_UPDATES_ENABLED_FALLBACK
  )

  const playbackRate = yield* call(getLocalStorageItem, PLAYBACK_RATE_LS_KEY)
  const rate: PlaybackRate = isPodcastFeaturesEnabled
    ? (playbackRate as PlaybackRate | null) ?? '1x'
    : '1x'
  yield* put(setPlaybackRate({ rate }))
}

/**
 * Watches for changes to the playback speed and updates local storage
 */
function* watchSetPlaybackRate() {
  const setLocalStorageItem = yield* getContext('setLocalStorageItem')
  yield* takeEvery(
    setPlaybackRate.type,
    function* (action: ReturnType<typeof setPlaybackRate>) {
      const { rate } = action.payload
      setLocalStorageItem(PLAYBACK_RATE_LS_KEY, rate)
    }
  )
}

const getPlayerSeekInfo = async (audioPlayer: AudioPlayer) => {
  const position = await audioPlayer.getPosition()
  const duration = await audioPlayer.getDuration()
  return {
    position,
    duration
  }
}

/**
 * Poll for saving the playback position of tracks
 */
function* savePlaybackPositionWorker() {
  const audioPlayer = yield* getContext('audioPlayer')
  const getFeatureEnabled = yield* getContext('getFeatureEnabled')
  const isNewPodcastControlsEnabled = yield* call(
    getFeatureEnabled,
    FeatureFlags.PODCAST_CONTROL_UPDATES_ENABLED,
    FeatureFlags.PODCAST_CONTROL_UPDATES_ENABLED_FALLBACK
  )

  // eslint-disable-next-line no-unmodified-loop-condition
  while (isNewPodcastControlsEnabled) {
    const trackId = yield* select(getTrackId)
    const track = yield* select(getTrack, { id: trackId })
    const playing = yield* select(getPlaying)

    if (trackId && track?.genre === Genre.PODCASTS && playing) {
      const { position, duration } = yield* call(getPlayerSeekInfo, audioPlayer)
      const isComplete =
        duration > 0 && PLAYBACK_COMPLETE_SECONDS > duration - position
      yield* put(
        setTrackPosition({
          trackId,
          positionInfo: {
            status: isComplete ? 'COMPLETED' : 'IN_PROGRESS',
            playbackPosition: position
          }
        })
      )
    }
    yield* delay(RECORD_PLAYBACK_POSITION_INTERVAL)
  }
}

export const sagas = () => {
  return [
    setInitialPlaybackRate,
    watchSetPlaybackRate,
    savePlaybackPositionWorker
  ]
}
