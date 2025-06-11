import { queryCurrentUserId } from '@audius/common/api'
import { Name, CreateAccountOpen } from '@audius/common/models'
import { put, cancel, call } from 'typed-redux-saga'

import { make } from 'common/store/analytics/actions'
import * as signOnActions from 'common/store/pages/signon/actions'

export function* ensureLoggedIn(source?: CreateAccountOpen['source']) {
  const userId = yield* call(queryCurrentUserId)
  if (!userId) {
    yield* put(signOnActions.openSignOn(false))
    yield* put(signOnActions.showRequiresAccountToast())
    yield* put(make(Name.CREATE_ACCOUNT_OPEN, { source }))
    yield* cancel()
    return userId as number
  }

  return userId
}
