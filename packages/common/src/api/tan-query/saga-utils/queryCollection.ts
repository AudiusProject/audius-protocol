import { ID } from '~/models/Identifiers'
import { getContext } from '~/store/effects'

import { getCollectionQueryKey } from '../collection/useCollection'
import { TQCollection } from '../models'
import { QUERY_KEYS } from '../queryKeys'

export function* queryCollection(id: ID | null | undefined) {
  if (!id) return null
  const queryClient = yield* getContext('queryClient')
  return queryClient.getQueryData(getCollectionQueryKey(id))
}

export function* queryCollections(ids: ID[]) {
  const queryClient = yield* getContext('queryClient')
  return ids.reduce(
    (acc, id) => {
      const collection = queryClient.getQueryData(getCollectionQueryKey(id))
      if (collection) {
        acc[id] = collection
      }
      return acc
    },
    {} as Record<ID, TQCollection>
  )
}

export function* queryAllCollections() {
  const queryClient = yield* getContext('queryClient')
  const queries = queryClient.getQueriesData<TQCollection>({
    queryKey: [QUERY_KEYS.collection]
  })
  return queries.reduce(
    (acc, [_, collection]) => {
      if (collection?.playlist_id) {
        acc[collection.playlist_id] = collection
      }
      return acc
    },
    {} as Record<ID, TQCollection>
  )
}
