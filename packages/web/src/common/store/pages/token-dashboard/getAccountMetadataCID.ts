import { userMetadataListFromSDK } from '@audius/common/adapters'
import { accountSelectors, getSDK } from '@audius/common/store'
import { Id } from '@audius/sdk'
import { select, call } from 'typed-redux-saga'

import { waitForRead } from 'utils/sagaHelpers'

const { getUserId } = accountSelectors

export function* getAccountMetadataCID() {
  yield* waitForRead()
  const sdk = yield* getSDK()
  const accountUserId = yield* select(getUserId)
  if (!accountUserId) return null

  const { data = [] } = yield* call([sdk.full.users, sdk.full.users.getUser], {
    id: Id.parse(accountUserId),
    userId: Id.parse(accountUserId)
  })
  const users = userMetadataListFromSDK(data)

  if (users.length !== 1) return null
  return users[0].metadata_multihash
}
