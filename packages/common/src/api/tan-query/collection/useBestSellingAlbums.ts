import { HashId, Id } from '@audius/sdk'
import { useQuery } from '@tanstack/react-query'

import { useQueryContext } from '~/api/tan-query/utils'
import { ID } from '~/models'

import { QUERY_KEYS } from '../queryKeys'
import { QueryKey, SelectableQueryOptions } from '../types'
import { useCurrentUserId } from '../users/account/useCurrentUserId'

export type UseBestSellingAlbumsArgs = {
  userId: ID | null | undefined
}

export const getBestSellingAlbumsQueryKey = ({
  userId
}: UseBestSellingAlbumsArgs) => {
  return [QUERY_KEYS.bestSellingAlbums, userId] as unknown as QueryKey<ID[]>
}

export const useBestSellingAlbums = <TResult = ID[]>(
  options?: SelectableQueryOptions<ID[], TResult>
) => {
  const { audiusSdk } = useQueryContext()
  const { data: currentUserId } = useCurrentUserId()

  return useQuery({
    queryKey: getBestSellingAlbumsQueryKey({ userId: currentUserId }),
    queryFn: async () => {
      if (!currentUserId) return []
      const sdk = await audiusSdk()
      const { data = [] } = await sdk.explore.getBestSelling({
        userId: Id.parse(currentUserId),
        type: 'album'
      })
      return data.map((item) => HashId.parse(item.contentId))
    },
    ...options,
    enabled: options?.enabled !== false && !!currentUserId
  })
}
