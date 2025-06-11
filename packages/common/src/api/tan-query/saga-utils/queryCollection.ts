import { call } from 'typed-redux-saga'

import { ID } from '~/models/Identifiers'
import { getContext } from '~/store/effects'
import { getSDK } from '~/store/sdkUtils'

import {
  getCollectionQueryFn,
  getCollectionQueryKey
} from '../collection/useCollection'
import { getCollectionByPermalinkQueryFn } from '../collection/useCollectionByPermalink'
import { TQCollection } from '../models'
import { QUERY_KEYS } from '../queryKeys'
import { entityCacheOptions } from '../utils/entityCacheOptions'
import { isValidId } from '../utils/isValidId'

import { queryCurrentUserId } from './queryAccount'

export function* queryCollection(
  id: ID | null | undefined,
  forceFetch = false
) {
  if (!isValidId(id)) return undefined
  const queryClient = yield* getContext('queryClient')
  const dispatch = yield* getContext('dispatch')
  const sdk = yield* getSDK()
  const currentUserId = yield* call(queryCurrentUserId)

  const queryData = yield* call([queryClient, queryClient.fetchQuery], {
    queryKey: getCollectionQueryKey(id),
    queryFn: async () =>
      getCollectionQueryFn(id!, currentUserId, queryClient, sdk, dispatch),
    staleTime: forceFetch ? 0 : undefined
  })

  return queryData as TQCollection | undefined
}

export function* queryCollections(ids: ID[], forceFetch = false) {
  const collections = {} as Record<ID, TQCollection>
  for (const id of ids) {
    // Call each queryCollection individually. They will be batched together in the queryFn (if necessary)
    const collection = yield* call(queryCollection, id, forceFetch)
    if (collection) {
      collections[id] = collection
    }
  }
  return collections
}

export function* queryCollectionByPermalink(
  permalink: string | null | undefined,
  forceFetch = false
) {
  if (!permalink) return undefined
  const queryClient = yield* getContext('queryClient')
  const currentUserId = yield* call(queryCurrentUserId)
  const sdk = yield* getSDK()
  const collectionId = (yield* call([queryClient, queryClient.fetchQuery], {
    queryKey: [QUERY_KEYS.collectionByPermalink, permalink],
    queryFn: async () =>
      getCollectionByPermalinkQueryFn(
        permalink,
        currentUserId,
        queryClient,
        sdk
      ),
    staleTime: forceFetch ? 0 : entityCacheOptions.staleTime
  })) as ID | undefined
  if (!collectionId) return undefined
  const collection = yield* call(queryCollection, collectionId, forceFetch)
  return collection
}

export function* queryCollectionsByPermalink(
  permalinks: string[],
  forceFetch = false
) {
  const collections = {} as Record<string, TQCollection>
  for (const permalink of permalinks) {
    // Call each queryCollectionByPermalink individually. They will be batched together in the queryFn (if necessary)
    const collection = yield* call(
      queryCollectionByPermalink,
      permalink,
      forceFetch
    )
    if (collection) {
      collections[permalink] = collection
    }
  }
  return collections
}
