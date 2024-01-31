import { accountSelectors, getContext } from '@audius/common/store'
import {} from '@audius/common'
import { select, call } from 'typed-redux-saga'

import { waitForRead } from 'utils/sagaHelpers'

const { getUserId } = accountSelectors

export function* getAccountMetadataCID() {
  yield* waitForRead()
  const apiClient = yield* getContext('apiClient')
  const accountUserId = yield* select(getUserId)
  if (!accountUserId) return null

  const users = yield* call([apiClient, apiClient.getUser], {
    userId: accountUserId,
    currentUserId: accountUserId
  })
  if (users.length !== 1) return null
  return users[0].metadata_multihash
}
