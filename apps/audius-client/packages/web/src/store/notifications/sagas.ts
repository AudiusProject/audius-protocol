import { accountSelectors, getContext, waitForValue } from '@audius/common'
import { eventChannel } from 'redux-saga'
import { call, delay, fork, take } from 'typed-redux-saga'

import { waitForBackendSetup } from 'common/store/backend/sagas'
import {
  getNotifications,
  getPollingIntervalMs
} from 'common/store/notifications/sagas'
import { isElectron } from 'utils/clientUtil'
const { getHasAccount } = accountSelectors

function* notificationPollingDaemon() {
  const audiusBackendInstance = yield* getContext('audiusBackendInstance')
  const remoteConfigInstance = yield* getContext('remoteConfigInstance')
  yield* call(waitForBackendSetup)
  yield* call(waitForValue, getHasAccount, {})
  yield* call(audiusBackendInstance.getEmailNotificationSettings)

  // Set up daemon that will watch for browser into focus and refetch notifications
  // as soon as it goes into focus
  const visibilityChannel = eventChannel((emitter) => {
    document.addEventListener('visibilitychange', () => {
      if (!document.hidden) {
        emitter(true)
      }
    })
    return () => {}
  })
  yield* fork(function* () {
    while (true) {
      yield* take(visibilityChannel)
      yield* call(getNotifications, false)
    }
  })

  // Set up daemon that will poll for notifications every 10s if the browser is
  // in the foreground
  const isFirstFetch = true
  let isBrowserInBackground = false
  document.addEventListener(
    'visibilitychange',
    () => {
      if (document.hidden) {
        isBrowserInBackground = true
      } else {
        isBrowserInBackground = false
      }
    },
    false
  )

  while (true) {
    if (!isBrowserInBackground || isElectron()) {
      yield* call(getNotifications, isFirstFetch)
    }
    yield* delay(getPollingIntervalMs(remoteConfigInstance))
  }
}

export default function sagas() {
  return [notificationPollingDaemon]
}
