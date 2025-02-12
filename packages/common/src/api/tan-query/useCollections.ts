import { useQueries, useQueryClient } from '@tanstack/react-query'
import { useDispatch } from 'react-redux'

import { useAudiusQueryContext } from '~/audius-query/AudiusQueryContext'
import { ID } from '~/models'
import { UserCollectionMetadata } from '~/models/Collection'

import { getCollectionsBatcher } from './batchers/getCollectionsBatcher'
import { QUERY_KEYS } from './queryKeys'
import { QueryOptions } from './types'
import { useCurrentUserId } from './useCurrentUserId'
import { combineQueryResults } from './utils/combineQueryResults'

export const getCollectionQueryKey = (collectionId: ID | null | undefined) => [
  QUERY_KEYS.collection,
  collectionId
]

export const useCollections = (
  collectionIds: ID[] | null | undefined,
  options?: QueryOptions
) => {
  const { audiusSdk } = useAudiusQueryContext()
  const { data: currentUserId } = useCurrentUserId()
  const queryClient = useQueryClient()
  const dispatch = useDispatch()

  return useQueries({
    queries: (collectionIds ?? []).map((collectionId) => ({
      queryKey: getCollectionQueryKey(collectionId),
      queryFn: async () => {
        const sdk = await audiusSdk()
        return await getCollectionsBatcher.fetch({
          id: collectionId,
          context: { sdk, currentUserId, queryClient, dispatch }
        })
      },
      ...options,
      enabled: options?.enabled !== false && !!collectionId,
      staleTime: options?.staleTime ?? Infinity,
      gcTime: Infinity
    })),
    combine: combineQueryResults<UserCollectionMetadata[]>
  })
}
