import { ID } from '~/models/Identifiers'
import { getContext } from '~/store/effects'

import { TQCollection } from '../models'
import { getCollectionQueryKey } from '../useCollection'

export function* queryCollection(id: ID | null | undefined) {
  if (!id) return null
  const queryClient = yield* getContext('queryClient')
  return queryClient.getQueryData<TQCollection>(getCollectionQueryKey(id))
}
