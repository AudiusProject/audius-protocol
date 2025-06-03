import { useMemo } from 'react'

import { useQuery, useQueryClient } from '@tanstack/react-query'
import { useDispatch } from 'react-redux'

import { useQueryContext } from '~/api/tan-query/utils/QueryContext'
import { ID } from '~/models'

import { getCollectionsBatcher } from '../batchers/getCollectionsBatcher'
import { TQCollection } from '../models'
import { QUERY_KEYS } from '../queryKeys'
import { QueryKey, SelectableQueryOptions } from '../types'
import { useCurrentUserId } from '../users/account/useCurrentUserId'
import { entityCacheOptions } from '../utils/entityCacheOptions'

export const getCollectionQueryKey = (collectionId: ID | null | undefined) => {
  return [
    QUERY_KEYS.collection,
    collectionId
  ] as unknown as QueryKey<TQCollection>
}

export const useCollection = <TResult = TQCollection>(
  collectionId: ID | null | undefined,
  options?: SelectableQueryOptions<TQCollection, TResult>
) => {
  const { audiusSdk } = useQueryContext()
  const { data: currentUserId } = useCurrentUserId()
  const queryClient = useQueryClient()
  const dispatch = useDispatch()

  // eslint-disable-next-line react-hooks/exhaustive-deps
  const select = useMemo(() => options?.select, [])

  return useQuery({
    queryKey: getCollectionQueryKey(collectionId),
    queryFn: async () => {
      const sdk = await audiusSdk()
      const batchGetCollections = getCollectionsBatcher({
        sdk,
        currentUserId,
        queryClient,
        dispatch
      })
      return await batchGetCollections.fetch(collectionId!)
    },
    ...options,
    select,
    ...entityCacheOptions,
    enabled: options?.enabled !== false && !!collectionId
  })
}
