import { OptionalId } from '@audius/sdk'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { useDispatch } from 'react-redux'

import { userCollectionMetadataFromSDK } from '~/adapters/collection'
import { transformAndCleanList } from '~/adapters/utils'
import { useAudiusQueryContext } from '~/audius-query'
import { ID } from '~/models/Identifiers'
import { removeNullable } from '~/utils'

import { QUERY_KEYS } from './queryKeys'
import { QueryOptions } from './types'
import { primeCollectionData } from './utils/primeCollectionData'

export const useCollections = (
  collectionIds: ID[] | null | undefined,
  options?: QueryOptions
) => {
  const { audiusSdk } = useAudiusQueryContext()
  const queryClient = useQueryClient()
  const dispatch = useDispatch()

  return useQuery({
    queryKey: [QUERY_KEYS.collections, collectionIds],
    queryFn: async () => {
      const encodedIds = collectionIds
        ?.map((id) => OptionalId.parse(id))
        .filter(removeNullable)
      if (!encodedIds || encodedIds.length === 0) return []
      const sdk = await audiusSdk()
      const { data } = await sdk.full.playlists.getBulkPlaylists({
        id: encodedIds
      })

      const collections = transformAndCleanList(
        data,
        userCollectionMetadataFromSDK
      )

      primeCollectionData({ collections, queryClient, dispatch })

      return collections
    },
    staleTime: options?.staleTime,
    enabled: options?.enabled !== false && !!collectionIds
  })
}
