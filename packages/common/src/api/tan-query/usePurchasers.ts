import { Id, OptionalId } from '@audius/sdk'
import { useInfiniteQuery, useQueryClient } from '@tanstack/react-query'
import { useDispatch } from 'react-redux'

import { userMetadataListFromSDK } from '~/adapters/user'
import { useAudiusQueryContext } from '~/audius-query'
import { ID } from '~/models/Identifiers'
import { User } from '~/models/User'

import { QUERY_KEYS } from './queryKeys'
import { QueryOptions } from './types'
import { useCurrentUserId } from './useCurrentUserId'
import { primeUserData } from './utils/primeUserData'

const DEFAULT_PAGE_SIZE = 20

type UsePurchasersArgs = {
  userId: ID | null | undefined
  contentId?: ID | null | undefined
  contentType?: string | undefined
  pageSize?: number
}

export const usePurchasers = (
  {
    userId,
    contentId,
    contentType,
    pageSize = DEFAULT_PAGE_SIZE
  }: UsePurchasersArgs,
  options?: QueryOptions
) => {
  const { audiusSdk } = useAudiusQueryContext()
  const { data: currentUserId } = useCurrentUserId()
  const queryClient = useQueryClient()
  const dispatch = useDispatch()

  return useInfiniteQuery({
    queryKey: [QUERY_KEYS.purchasers, userId, pageSize],
    initialPageParam: 0,
    getNextPageParam: (lastPage: User[], allPages) => {
      if (lastPage.length < pageSize) return undefined
      return allPages.length * pageSize
    },
    queryFn: async ({ pageParam }) => {
      const sdk = await audiusSdk()
      const { data = [] } = await sdk.full.users.getPurchasers({
        id: Id.parse(userId),
        limit: pageSize,
        offset: pageParam,
        userId: OptionalId.parse(currentUserId),
        contentId: OptionalId.parse(contentId),
        contentType
      })
      const users = userMetadataListFromSDK(data)
      primeUserData({ users, queryClient, dispatch })
      return users
    },
    select: (data) => data.pages.flat(),
    staleTime: options?.staleTime,
    enabled: options?.enabled !== false && !!userId
  })
}
