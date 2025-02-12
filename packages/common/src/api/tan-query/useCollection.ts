import { useQuery, useQueryClient } from '@tanstack/react-query'
import { useDispatch } from 'react-redux'

import { useAudiusQueryContext } from '~/audius-query/AudiusQueryContext'
import { ID } from '~/models'
import { UserCollectionMetadata } from '~/models/Collection'

import { getCollectionsBatcher } from './batchers/getCollectionsBatcher'
import { QUERY_KEYS } from './queryKeys'
import { QueryOptions } from './types'
import { useCurrentUserId } from './useCurrentUserId'

export const getCollectionQueryKey = (collectionId: ID | null | undefined) => [
  QUERY_KEYS.collection,
  collectionId
]

export const useCollection = (
  collectionId: ID | null | undefined,
  options?: QueryOptions
) => {
  const { audiusSdk } = useAudiusQueryContext()
  const { data: currentUserId } = useCurrentUserId()
  const queryClient = useQueryClient()
  const dispatch = useDispatch()

  return useQuery<UserCollectionMetadata | null>({
    queryKey: getCollectionQueryKey(collectionId),
    queryFn: async () => {
      const sdk = await audiusSdk()
      return await getCollectionsBatcher.fetch({
        id: collectionId!,
        context: { sdk, currentUserId, queryClient, dispatch }
      })
    },
    staleTime: options?.staleTime ?? Infinity,
    gcTime: Infinity,
    enabled: options?.enabled !== false && !!collectionId
  })
}
