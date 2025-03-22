import { Id, OptionalId } from '@audius/sdk'
import { useInfiniteQuery, useQueryClient } from '@tanstack/react-query'
import { useDispatch } from 'react-redux'

import { userMetadataListFromSDK } from '~/adapters/user'
import { useAudiusQueryContext } from '~/audius-query'
import { ID } from '~/models/Identifiers'

import { QUERY_KEYS } from './queryKeys'
import { QueryOptions } from './types'
import { useCurrentUserId } from './useCurrentUserId'
import { useUsers } from './useUsers'
import { primeUserData } from './utils/primeUserData'

const PAGE_SIZE = 20

export type UsePurchasersArgs = {
  contentId?: ID | null | undefined
  contentType?: string | undefined
  pageSize?: number
}

export const getPurchasersQueryKey = ({
  contentId,
  contentType,
  pageSize
}: UsePurchasersArgs) => [
  QUERY_KEYS.purchasers,
  {
    contentId,
    contentType,
    pageSize
  }
]

export const usePurchasers = (
  args: UsePurchasersArgs,
  options?: QueryOptions
) => {
  const { contentId, contentType, pageSize = PAGE_SIZE } = args
  const { audiusSdk } = useAudiusQueryContext()
  const { data: currentUserId } = useCurrentUserId()
  const queryClient = useQueryClient()
  const dispatch = useDispatch()

  const { data: userIds } = useInfiniteQuery({
    queryKey: getPurchasersQueryKey(args),
    initialPageParam: 0,
    getNextPageParam: (lastPage: ID[], allPages) => {
      if (lastPage.length < pageSize) return undefined
      return allPages.length * pageSize
    },
    queryFn: async ({ pageParam }) => {
      const sdk = await audiusSdk()
      if (!currentUserId) return []
      const { data = [] } = await sdk.full.users.getPurchasers({
        id: Id.parse(currentUserId),
        limit: pageSize,
        offset: pageParam,
        userId: Id.parse(currentUserId),
        contentId: OptionalId.parse(contentId),
        contentType
      })
      const users = userMetadataListFromSDK(data)
      primeUserData({ users, queryClient, dispatch })
      return users.map((user) => user.user_id)
    },
    select: (data) => data.pages.flat(),
    ...options,
    enabled: options?.enabled !== false && !!currentUserId
  })

  return useUsers(userIds)
}
