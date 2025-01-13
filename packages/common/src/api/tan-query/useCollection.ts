import { useQuery, useQueryClient } from '@tanstack/react-query'
import { useDispatch, useSelector } from 'react-redux'

import { userCollectionMetadataFromSDK } from '~/adapters/collection'
import { useAudiusQueryContext } from '~/audius-query'
import { Id, ID, OptionalId } from '~/models/Identifiers'
import { getUserId } from '~/store/account/selectors'

import { QUERY_KEYS } from './queryKeys'
import { QueryOptions } from './types'
import { primeCollectionData } from './utils/primeCollectionData'

export const useCollection = (
  collectionId: ID | null | undefined,
  options?: QueryOptions
) => {
  const { audiusSdk } = useAudiusQueryContext()
  const queryClient = useQueryClient()
  const dispatch = useDispatch()
  const currentUserId = useSelector(getUserId)

  return useQuery({
    queryKey: [QUERY_KEYS.collection, collectionId],
    queryFn: async () => {
      const sdk = await audiusSdk()
      const { data } = await sdk.full.playlists.getPlaylist({
        playlistId: Id.parse(collectionId),
        userId: OptionalId.parse(currentUserId)
      })

      if (!data?.[0]) return null
      const collection = userCollectionMetadataFromSDK(data[0])

      if (collection) {
        // Prime related entities
        primeCollectionData({
          collections: [collection],
          queryClient,
          dispatch
        })

        // Prime collectionByPermalink cache if we have a permalink
        if (collection.permalink) {
          queryClient.setQueryData(
            [QUERY_KEYS.collectionByPermalink, collection.permalink],
            collection
          )
        }
      }

      return collection
    },
    staleTime: options?.staleTime,
    enabled: options?.enabled !== false && !!collectionId
  })
}
