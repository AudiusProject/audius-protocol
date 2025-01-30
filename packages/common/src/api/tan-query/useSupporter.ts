import { Id } from '@audius/sdk'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { useDispatch } from 'react-redux'

import { useAudiusQueryContext } from '~/audius-query'
import { ID } from '~/models/Identifiers'
import {
  supporterMetadataFromSDK,
  supporterMetadataListFromSDK
} from '~/models/Tipping'

import { QUERY_KEYS } from './queryKeys'
import { QueryOptions } from './types'
import { useCurrentUserId } from './useCurrentUserId'
import { primeUserData } from './utils/primeUserData'

type UseSupporterArgs = {
  userId: ID | null | undefined
  supporterUserId: ID | null | undefined
}

const DEFAULT_STALE_TIME = 1000 * 30

export const getSupporterQueryKey = (
  userId: ID | null | undefined,
  supporterUserId: ID | null | undefined
) => [QUERY_KEYS.supporter, userId, supporterUserId]

export const useSupporter = (
  { userId, supporterUserId }: UseSupporterArgs,
  options?: QueryOptions
) => {
  const { audiusSdk } = useAudiusQueryContext()
  const { data: currentUserId } = useCurrentUserId()
  const queryClient = useQueryClient()
  const dispatch = useDispatch()

  return useQuery({
    queryKey: getSupporterQueryKey(userId, supporterUserId),
    queryFn: async () => {
      const sdk = await audiusSdk()
      const { data } = await sdk.full.users.getSupporter({
        id: Id.parse(userId),
        supporterUserId: Id.parse(supporterUserId),
        userId: Id.parse(currentUserId)
      })

      if (!data) return null

      const supporter = supporterMetadataFromSDK(data)
      if (supporter?.sender) {
        primeUserData({ users: [supporter.sender], queryClient, dispatch })
      }
      return supporter
    },
    staleTime: options?.staleTime ?? DEFAULT_STALE_TIME,
    enabled: options?.enabled !== false && !!userId && !!supporterUserId
  })
}

export const useTopSupporter = (userId: ID | null | undefined) => {
  const { audiusSdk } = useAudiusQueryContext()
  const { data: currentUserId } = useCurrentUserId()
  const queryClient = useQueryClient()
  const dispatch = useDispatch()

  return useQuery({
    queryKey: [QUERY_KEYS.topSupporter, userId],
    queryFn: async () => {
      const sdk = await audiusSdk()
      const { data } = await sdk.full.users.getSupporters({
        id: Id.parse(userId),
        userId: Id.parse(currentUserId),
        limit: 1
      })

      if (!data) return null

      const [supporter] = supporterMetadataListFromSDK(data)

      // Prime the cache for each supporter
      if (supporter?.sender) {
        primeUserData({ users: [supporter.sender], queryClient, dispatch })
      }

      return supporter
    }
  })
}
