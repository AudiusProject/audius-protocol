import { Name, signOutActions, accountActions } from '@audius/common'
import { make } from 'common/store/analytics/actions'
import { takeLatest, put, call } from 'typed-redux-saga'

import { audiusBackendInstance } from 'app/services/audius-backend-instance'
import { localStorage } from 'app/services/local-storage'

import { resetOAuthState } from '../oauth/actions'
import { setSearchHistory } from '../search/actions'
import { disablePushNotifications } from '../settings/sagas'

const { resetAccount } = accountActions
const { signOut: signOutAction } = signOutActions

function* watchSignOut() {
  yield* takeLatest(signOutAction.type, function* () {
    yield* put(resetAccount())
    yield* call(disablePushNotifications)
    yield* put(make(Name.SETTINGS_LOG_OUT, {}))

    yield* call([localStorage, 'clearAudiusAccount'])
    yield* call([localStorage, 'clearAudiusAccountUser'])
    yield* call([audiusBackendInstance, 'signOut'])
    yield* call([localStorage, 'removeItem'], 'theme')

    yield* put(setSearchHistory([]))
    yield* put(resetOAuthState())
  })
}

export default function sagas() {
  return [watchSignOut]
}
