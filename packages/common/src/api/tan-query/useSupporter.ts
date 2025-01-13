import { useQuery, useQueryClient } from '@tanstack/react-query'
import { useDispatch } from 'react-redux'

import { useAudiusQueryContext } from '~/audius-query'
import { ID, Id, OptionalId } from '~/models/Identifiers'
import { supporterMetadataFromSDK } from '~/models/Tipping'

import { QUERY_KEYS } from './queryKeys'
import { QueryOptions } from './types'
import { useCurrentUserId } from './useCurrentUserId'
import { primeUserData } from './utils/primeUserData'

type UseSupporterArgs = {
  userId: ID | null | undefined
  supporterUserId: ID | null | undefined
}

export const useSupporter = (
  { userId, supporterUserId }: UseSupporterArgs,
  options?: QueryOptions
) => {
  const { audiusSdk } = useAudiusQueryContext()
  const { data: currentUserId } = useCurrentUserId()
  const queryClient = useQueryClient()
  const dispatch = useDispatch()

  return useQuery({
    queryKey: [QUERY_KEYS.supporters, userId, supporterUserId],
    queryFn: async () => {
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
    staleTime: options?.staleTime,
    enabled: options?.enabled !== false && !!userId && !!supporterUserId
  })
}
