import { HashId, Id, BestSellingItem } from '@audius/sdk'
import { useQuery, useQueryClient } from '@tanstack/react-query'

import { userCollectionMetadataFromSDK } from '~/adapters'
import { userTrackMetadataFromSDK } from '~/adapters/track'
import { transformAndCleanList } from '~/adapters/utils'
import {
  primeCollectionData,
  primeTrackData,
  useQueryContext
} from '~/api/tan-query/utils'
import { ID } from '~/models'

import { QUERY_KEYS } from '../queryKeys'
import { QueryKey, SelectableQueryOptions } from '../types'
import { useCurrentUserId } from '../users/account/useCurrentUserId'

export type UseBestSellingArgs = {
  userId: ID | null | undefined
}

export type BestSellingItemWithId = BestSellingItem & { id: ID }

export const getBestSellingQueryKey = ({ userId }: UseBestSellingArgs) => {
  return [QUERY_KEYS.bestSellingAlbums, userId] as unknown as QueryKey<
    BestSellingItemWithId[]
  >
}

export const useBestSelling = <TResult = BestSellingItemWithId[]>(
  options?: SelectableQueryOptions<BestSellingItemWithId[], TResult>
) => {
  const { audiusSdk } = useQueryContext()
  const { data: currentUserId } = useCurrentUserId()
  const queryClient = useQueryClient()
  return useQuery({
    queryKey: getBestSellingQueryKey({ userId: currentUserId }),
    queryFn: async () => {
      const sdk = await audiusSdk()
      const { data = [], related = {} } =
        await sdk.full.explore.getFullBestSelling({
          userId: currentUserId ? Id.parse(currentUserId) : undefined
        })

      const tracks = transformAndCleanList(
        related?.tracks,
        userTrackMetadataFromSDK
      )

      primeTrackData({
        tracks,
        queryClient
      })

      const playlists = transformAndCleanList(
        related?.playlists,
        userCollectionMetadataFromSDK
      )

      primeCollectionData({
        collections: playlists,
        queryClient
      })

      return data.map((item) => ({ ...item, id: HashId.parse(item.contentId) }))
    },
    ...options,
    enabled: options?.enabled !== false
  })
}
