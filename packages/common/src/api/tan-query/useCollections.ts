import { Id, OptionalId } from '@audius/sdk'
import { QueryClient, useQueries, useQueryClient } from '@tanstack/react-query'
import { create, keyResolver, windowScheduler } from '@yornaath/batshit'
import { useDispatch } from 'react-redux'
import { Dispatch } from 'redux'

import { userCollectionMetadataFromSDK } from '~/adapters/collection'
import { transformAndCleanList } from '~/adapters/utils'
import { useAudiusQueryContext } from '~/audius-query/AudiusQueryContext'
import { ID } from '~/models'
import { UserCollectionMetadata } from '~/models/Collection'
import { removeNullable } from '~/utils/typeUtils'

import { QUERY_KEYS } from './queryKeys'
import { QueryOptions } from './types'
import { useCurrentUserId } from './useCurrentUserId'
import { combineQueryResults } from './utils/combineQueryResults'
import { primeCollectionData } from './utils/primeCollectionData'

type BatchContext = {
  sdk: any
  currentUserId: ID | null | undefined
  queryClient: QueryClient
  dispatch: Dispatch
}

type BatchQuery = {
  id: ID
  context: BatchContext
}

const getCollectionsBatcher = create({
  fetcher: async (queries: BatchQuery[]): Promise<UserCollectionMetadata[]> => {
    // Hack because batshit doesn't support context properly
    const { sdk, currentUserId, queryClient, dispatch } = queries[0].context
    if (!queries.length) return []
    const ids = queries.map((q) => q.id)

    const { data } = await sdk.full.playlists.getBulkPlaylists({
      playlistId: ids.map((id: ID) => Id.parse(id)).filter(removeNullable),
      userId: OptionalId.parse(currentUserId)
    })

    const collections = transformAndCleanList(
      data,
      userCollectionMetadataFromSDK
    )

    // Prime related entities
    primeCollectionData({
      collections,
      queryClient,
      dispatch
    })

    return collections
  },
  resolver: keyResolver('playlist_id'),
  scheduler: windowScheduler(10)
})

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
