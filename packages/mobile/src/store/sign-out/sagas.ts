import { Name, Theme } from '@audius/common/models'
import {
  accountActions,
  tokenDashboardPageActions,
  feedPageLineupActions,
  signOutActions,
  themeActions
} from '@audius/common/store'
import { waitForValue } from '@audius/common/utils'
import { setupBackend } from 'audius-client/src/common/store/backend/actions'
import { getIsSettingUp } from 'audius-client/src/common/store/backend/selectors'
import { resetSignOn } from 'audius-client/src/common/store/pages/signon/actions'
import { make } from 'common/store/analytics/actions'
import { takeLatest, put, call } from 'typed-redux-saga'

import {
  ENTROPY_KEY,
  SEARCH_HISTORY_KEY,
  THEME_STORAGE_KEY
} from 'app/constants/storage-keys'
import { audiusBackendInstance } from 'app/services/audius-backend-instance'
import { localStorage } from 'app/services/local-storage'

import { resetOAuthState } from '../oauth/actions'
import { clearOfflineDownloads } from '../offline-downloads/slice'
import { clearHistory } from '../search/searchSlice'
import { deregisterPushNotifications } from '../settings/sagas'

const { resetAccount } = accountActions
const { resetState: resetWalletState } = tokenDashboardPageActions
const { signOut: signOutAction } = signOutActions
const { setTheme } = themeActions

const storageKeysToRemove = [THEME_STORAGE_KEY, ENTROPY_KEY, SEARCH_HISTORY_KEY]

function* signOut() {
  yield* put(make(Name.SETTINGS_LOG_OUT, {}))

  // Wait for in-flight set up to resolve
  yield* call(waitForValue, getIsSettingUp, {}, (isSettingUp) => !isSettingUp)

  yield* put(resetAccount())
  yield* put(feedPageLineupActions.reset())

  yield* put(clearHistory())
  yield* put(resetOAuthState())
  yield* put(clearOfflineDownloads())
  yield* put(resetWalletState())
  yield* put(resetSignOn())

  yield* call(deregisterPushNotifications)
  yield* call([localStorage, 'clearAudiusAccount'])
  yield* call([localStorage, 'clearAudiusAccountUser'])
  yield* call([audiusBackendInstance, 'signOut'])
  for (const storageKey of storageKeysToRemove) {
    yield* call([localStorage, 'removeItem'], storageKey)
  }
  yield* put(setTheme({ theme: Theme.DEFAULT }))
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
