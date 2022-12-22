import { Name, signOutActions, accountActions } from '@audius/common'
import { setupBackend } from 'audius-client/src/common/store/backend/actions'
import { getIsSetup } from 'audius-client/src/common/store/backend/selectors'
import { make } from 'common/store/analytics/actions'
import { takeLatest, put, call, select, take } from 'typed-redux-saga'

import { audiusBackendInstance } from 'app/services/audius-backend-instance'
import { localStorage } from 'app/services/local-storage'

import { resetOAuthState } from '../oauth/actions'
import { clearOfflineDownloads } from '../offline-downloads/slice'
import { clearHistory } from '../search/actions'
import { disablePushNotifications } from '../settings/sagas'

const { resetAccount } = accountActions
const { signOut: signOutAction } = signOutActions

function* signOut() {
  yield* put(make(Name.SETTINGS_LOG_OUT, {}))
  // UX obstruction, but if the user somehow makes it
  // all the way to the sign out flow before the
  // backend has initted (e.g. there's still an account fetch)
  // in-flight, we need to wait here.
  const isBackendSetup = yield* select(getIsSetup)
  if (!isBackendSetup) {
    yield* take(accountActions.fetchAccountSucceeded.type)
  }

  yield* put(resetAccount())

  yield* put(clearHistory())
  yield* put(resetOAuthState())
  yield* put(clearOfflineDownloads())

  yield* call(disablePushNotifications)
  yield* call([localStorage, 'clearAudiusAccount'])
  yield* call([localStorage, 'clearAudiusAccountUser'])
  yield* call([audiusBackendInstance, 'signOut'])
  yield* call([localStorage, 'removeItem'], 'theme')

  // On web we reload the page to get the app into a state
  // where it is acting like first-load. On mobile, in order to
  // get the same behavior, call to set up the backend again,
  // which will discover that we have no account
  yield* put(setupBackend())
}

function* watchSignOut() {
  yield* takeLatest(signOutAction.type, signOut)
}

export default function sagas() {
  return [watchSignOut]
}
