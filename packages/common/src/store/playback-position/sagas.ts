import { call, delay, put, select, takeEvery } from 'typed-redux-saga'

import { AudioPlayer } from '~/services/audio-player'
import { FeatureFlags } from '~/services/remote-config'
import { getUserId } from '~/store/account/selectors'
import { getTrack } from '~/store/cache/tracks/selectors'
import { getContext } from '~/store/effects'
import { getPlaying, getTrackId } from '~/store/player/selectors'
import { Genre } from '~/utils/genres'

import { getPlaybackPositions } from './selectors'
import {
  clearTrackPosition,
  initializePlaybackPositionState,
  setTrackPosition
} from './slice'
import {
  LEGACY_PLAYBACK_POSITION_LS_KEY,
  PlaybackPositionState,
  PLAYBACK_POSITION_LS_KEY
} from './types'

const RECORD_PLAYBACK_POSITION_INTERVAL = 1000

/**
 * Sets the playback rate from local storage when the app loads
 */
function* setInitialPlaybackPositionState() {
  const remoteConfigInstance = yield* getContext('remoteConfigInstance')
  yield* call(remoteConfigInstance.waitForRemoteConfig)
  const getFeatureEnabled = yield* getContext('getFeatureEnabled')
  const getLocalStorageItem = yield* getContext('getLocalStorageItem')
  const setLocalStorageItem = yield* getContext('setLocalStorageItem')
  const removeLocalStorageItem = yield* getContext('removeLocalStorageItem')
  const isNewPodcastControlsEnabled = yield* call(
    getFeatureEnabled,
    FeatureFlags.PODCAST_CONTROL_UPDATES_ENABLED,
    FeatureFlags.PODCAST_CONTROL_UPDATES_ENABLED_FALLBACK
  )
  if (!isNewPodcastControlsEnabled) return

  const localStorageState = yield* call(
    getLocalStorageItem,
    PLAYBACK_POSITION_LS_KEY
  )
  const legacyLocalStorageState = yield* call(
    getLocalStorageItem,
    LEGACY_PLAYBACK_POSITION_LS_KEY
  )

  if (localStorageState !== null) {
    const playbackPositionState: PlaybackPositionState =
      JSON.parse(localStorageState)
    yield* put(initializePlaybackPositionState({ playbackPositionState }))
  } else if (legacyLocalStorageState !== null) {
    // NOTE: Check for legacy playback position state in local storage and update to new format
    const userId = yield* select(getUserId)
    if (!userId) return

    const legacyPlaybackPositionState: PlaybackPositionState[number] =
      JSON.parse(legacyLocalStorageState)
    const convertedLegacyState: PlaybackPositionState = {
      [userId]: legacyPlaybackPositionState
    }
    yield* put(
      initializePlaybackPositionState({
        playbackPositionState: convertedLegacyState
      })
    )
    setLocalStorageItem(
      PLAYBACK_POSITION_LS_KEY,
      JSON.stringify(convertedLegacyState)
    )
    removeLocalStorageItem(LEGACY_PLAYBACK_POSITION_LS_KEY)
  }
}

function* watchTrackPositionUpdate() {
  const setLocalStorageItem = yield* getContext('setLocalStorageItem')
  yield* takeEvery(
    [setTrackPosition.type, clearTrackPosition.type],
    function* () {
      const fullState = yield* select(getPlaybackPositions)

      // Track info has already been updated in the redux state
      // Write the state to localStorage
      setLocalStorageItem(PLAYBACK_POSITION_LS_KEY, JSON.stringify(fullState))
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
  const remoteConfigInstance = yield* getContext('remoteConfigInstance')
  yield* call(remoteConfigInstance.waitForRemoteConfig)
  const isNativeMobile = yield* getContext('isNativeMobile')

  const audioPlayer = yield* getContext('audioPlayer')
  const getFeatureEnabled = yield* getContext('getFeatureEnabled')
  const isNewPodcastControlsEnabled = yield* call(
    getFeatureEnabled,
    FeatureFlags.PODCAST_CONTROL_UPDATES_ENABLED,
    FeatureFlags.PODCAST_CONTROL_UPDATES_ENABLED_FALLBACK
  )

  // eslint-disable-next-line no-unmodified-loop-condition
  while (isNewPodcastControlsEnabled && !isNativeMobile) {
    const trackId = yield* select(getTrackId)
    const userId = yield* select(getUserId)
    const track = yield* select(getTrack, { id: trackId })
    const playing = yield* select(getPlaying)
    const isLongFormContent =
      track?.genre === Genre.PODCASTS || track?.genre === Genre.AUDIOBOOKS

    if (userId && trackId && isLongFormContent && playing) {
      const { position } = yield* call(getPlayerSeekInfo, audioPlayer)
      yield* put(
        setTrackPosition({
          userId,
          trackId,
          positionInfo: {
            status: 'IN_PROGRESS',
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
    setInitialPlaybackPositionState,
    watchTrackPositionUpdate,
    savePlaybackPositionWorker
  ]
}
