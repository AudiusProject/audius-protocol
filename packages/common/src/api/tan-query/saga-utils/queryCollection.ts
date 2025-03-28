import { ID } from '~/models/Identifiers'
import { getContext } from '~/store/effects'

import { getCollectionQueryKey } from '../useCollection'

export function* queryCollection(id: ID) {
  const queryClient = yield* getContext('queryClient')
  return queryClient.getQueryData(getCollectionQueryKey(id))
}
