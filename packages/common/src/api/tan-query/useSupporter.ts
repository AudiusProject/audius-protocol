import { useQuery, useQueryClient } from '@tanstack/react-query'
import { useDispatch } from 'react-redux'

import { useAudiusQueryContext } from '~/audius-query'
import { Id, OptionalId } from '~/models/Identifiers'
import { supporterMetadataFromSDK } from '~/models/Tipping'

import { QUERY_KEYS } from './queryKeys'
import { useCurrentUserId } from './useCurrentUserId'
import { primeUserData } from './utils/primeUserData'

type UseSupporterArgs = {
  userId?: number | null
  supporterUserId?: number | null
}

type Config = {
  staleTime?: number
  enabled?: boolean
}

export const useSupporter = (
  { userId, supporterUserId }: UseSupporterArgs,
  config?: Config
) => {
  const { audiusSdk } = useAudiusQueryContext()
  const { data: currentUserId } = useCurrentUserId()
  const queryClient = useQueryClient()
  const dispatch = useDispatch()

  return useQuery({
    queryKey: [QUERY_KEYS.supporters, userId, supporterUserId],
    queryFn: async () => {
      if (!userId || !supporterUserId) return null
      const sdk = await audiusSdk()
      const { data } = await sdk.full.users.getSupporter({
        id: Id.parse(userId),
        supporterUserId: Id.parse(supporterUserId),
        userId: OptionalId.parse(currentUserId)
      })

      if (!data) return null

      const supporter = supporterMetadataFromSDK(data)
      if (supporter?.sender) {
        primeUserData({ users: [supporter.sender], queryClient, dispatch })
      }
      return supporter
    },
    staleTime: config?.staleTime,
    enabled: config?.enabled !== false && !!userId && !!supporterUserId
  })
}
