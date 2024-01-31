import { accountSelectors, getContext } from '@audius/common/store'
import { waitForValue } from '@audius/common/utils'
import { eventChannel } from 'redux-saga'
import { call, delay, fork, take } from 'typed-redux-saga'

import { checkForNewNotificationsSaga } from 'common/store/notifications/checkForNewNotificationsSaga'
import { getPollingIntervalMs } from 'common/store/notifications/sagas'
import { isElectron } from 'utils/clientUtil'
import { waitForRead } from 'utils/sagaHelpers'
const { getHasAccount } = accountSelectors

function* notificationPollingDaemon() {
  const remoteConfigInstance = yield* getContext('remoteConfigInstance')
  yield* call(waitForRead)
  yield* call(waitForValue, getHasAccount, {})

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
      yield* call(checkForNewNotificationsSaga)
    }
  })

  // Set up daemon that will poll for notifications every 10s if the browser is
  // in the foreground
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
      yield* call(checkForNewNotificationsSaga)
    }
    yield* delay(getPollingIntervalMs(remoteConfigInstance))
  }
}

export default function sagas() {
  return [notificationPollingDaemon]
}
