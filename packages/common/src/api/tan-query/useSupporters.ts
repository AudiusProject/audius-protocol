import { useQuery, useQueryClient } from '@tanstack/react-query'
import { useDispatch } from 'react-redux'

import { useAudiusQueryContext } from '~/audius-query'
import { supporterMetadataListFromSDK } from '~/models'
import { ID, Id, OptionalId } from '~/models/Identifiers'
import { MAX_PROFILE_TOP_SUPPORTERS } from '~/utils/constants'

import { QUERY_KEYS } from './queryKeys'
import { Config } from './types'
import { useCurrentUserId } from './useCurrentUserId'
import { primeUserData } from './utils/primeUserData'

type UseSupportersArgs = {
  userId: ID | null | undefined
  limit?: number
}

export const useSupporters = (
  { userId, limit = MAX_PROFILE_TOP_SUPPORTERS + 1 }: UseSupportersArgs,
  config?: Config
) => {
  const { audiusSdk } = useAudiusQueryContext()
  const queryClient = useQueryClient()
  const { data: currentUserId } = useCurrentUserId()
  const dispatch = useDispatch()

  return useQuery({
    queryKey: [QUERY_KEYS.supporters, userId, limit],
    queryFn: async () => {
      const sdk = await audiusSdk()
      const { data = [] } = await sdk.full.users.getSupporters({
        id: Id.parse(userId),
        limit,
        userId: OptionalId.parse(currentUserId)
      })

      const supporters = supporterMetadataListFromSDK(data)

      // Cache user data for each supporter
      primeUserData({
        users: supporters.map((supporter) => supporter.sender),
        queryClient,
        dispatch
      })

      return supporters
    },
    staleTime: config?.staleTime,
    enabled: config?.enabled !== false && !!userId
  })
}
