import { Name, CreateAccountOpen } from '@audius/common/models'
import { accountSelectors } from '@audius/common/store'
import { put, select, cancel } from 'typed-redux-saga'

import { make } from 'common/store/analytics/actions'
import * as signOnActions from 'common/store/pages/signon/actions'

const { getUserId } = accountSelectors

export function* ensureLoggedIn(source?: CreateAccountOpen['source']) {
  const userId = yield* select(getUserId)
  if (!userId) {
    yield* put(signOnActions.openSignOn(false))
    console.log('asdf ensure logged in')
    yield* put(signOnActions.showRequiresAccountToast())
    yield* put(make(Name.CREATE_ACCOUNT_OPEN, { source }))
    yield* cancel()
    return userId as number
  }

  return userId
}
