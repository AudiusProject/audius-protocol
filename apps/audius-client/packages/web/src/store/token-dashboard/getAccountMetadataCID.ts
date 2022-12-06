import { accountSelectors, getContext } from '@audius/common'
import { select, call } from 'typed-redux-saga'

import { waitForRead } from 'utils/sagaHelpers'

const { getUserId } = accountSelectors

export function* getAccountMetadataCID() {
  yield* waitForRead()
  const audiusBackendInstance = yield* getContext('audiusBackendInstance')
  const accountUserId = yield* select(getUserId)
  if (!accountUserId) return null

  const users = yield* call(audiusBackendInstance.getCreators, [accountUserId])
  if (users.length !== 1) return null
  return users[0].metadata_multihash
}
