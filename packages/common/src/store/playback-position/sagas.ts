import { call, put, select, takeEvery } from 'typed-redux-saga'

import { FeatureFlags } from 'services/remote-config'
import { getContext } from 'store/effects'

import { getPlaybackPositions } from './selectors'
import {
  clearTrackPosition,
  initializePlaybackPositionState,
  setTrackPosition
} from './slice'
import { PlaybackPositionState, PLAYBACK_POSITION_LS_KEY } from './types'

/**
 * Sets the playback rate from local storage when the app loads
 */
function* setInitialPlaybackPositionState() {
  const getFeatureEnabled = yield* getContext('getFeatureEnabled')
  const getLocalStorageItem = yield* getContext('getLocalStorageItem')
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
  if (localStorageState === null) return

  const playbackPositionState: PlaybackPositionState =
    JSON.parse(localStorageState)
  yield* put(initializePlaybackPositionState({ playbackPositionState }))
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

export const sagas = () => {
  return [setInitialPlaybackPositionState, watchTrackPositionUpdate]
}
