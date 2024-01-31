import { call, put, takeEvery } from 'typed-redux-saga'

import { FeatureFlags } from '~/services/remote-config'
import { getContext } from '~/store/effects'

import { setPlaybackRate } from './slice'
import { PlaybackRate, PLAYBACK_RATE_LS_KEY } from './types'

/**
 * Sets the playback rate from local storage when the app loads
 */
function* setInitialPlaybackRate() {
  const remoteConfigInstance = yield* getContext('remoteConfigInstance')
  yield* call(remoteConfigInstance.waitForRemoteConfig)

  const getFeatureEnabled = yield* getContext('getFeatureEnabled')
  const getLocalStorageItem = yield* getContext('getLocalStorageItem')
  const isNewPodcastControlsEnabled = yield* call(
    getFeatureEnabled,
    FeatureFlags.PODCAST_CONTROL_UPDATES_ENABLED,
    FeatureFlags.PODCAST_CONTROL_UPDATES_ENABLED_FALLBACK
  )

  const playbackRate = yield* call(getLocalStorageItem, PLAYBACK_RATE_LS_KEY)
  const rate: PlaybackRate = isNewPodcastControlsEnabled
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

export const sagas = () => {
  return [setInitialPlaybackRate, watchSetPlaybackRate]
}
