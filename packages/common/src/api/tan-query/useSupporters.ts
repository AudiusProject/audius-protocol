import { useQuery, useQueryClient } from '@tanstack/react-query'

import { useAppContext } from '~/context/appContext'
import { Id, OptionalId } from '~/models/Identifiers'
import { supporterMetadataListFromSDK } from '~/models/Tipping'
import { MAX_PROFILE_TOP_SUPPORTERS } from '~/utils/constants'

import { QUERY_KEYS } from './queryKeys'
import { useCurrentUserId } from './useCurrentUserId'

type UseSupportersArgs = {
  userId?: number | null
  limit?: number
}

type Config = {
  staleTime?: number
  enabled?: boolean
}

export const useSupporters = (
  { userId, limit = MAX_PROFILE_TOP_SUPPORTERS + 1 }: UseSupportersArgs,
  config?: Config
) => {
  const { audiusSdk } = useAppContext()
  const queryClient = useQueryClient()
  const { data: currentUserId } = useCurrentUserId()

  return useQuery({
    queryKey: [QUERY_KEYS.supporters, userId, limit],
    queryFn: async () => {
      if (!audiusSdk || !userId) return []
      const { data = [] } = await audiusSdk.full.users.getSupporters({
        id: Id.parse(userId),
        limit,
        userId: OptionalId.parse(currentUserId)
      })

      const supporters = supporterMetadataListFromSDK(data)

      // Cache user data for each supporter
      supporters.forEach((supporter) => {
        if (supporter.sender) {
          queryClient.setQueryData(
            [QUERY_KEYS.user, supporter.sender.user_id],
            supporter.sender
          )
        }
      })

      return supporters
    },
    staleTime: config?.staleTime,
    enabled: config?.enabled !== false && !!userId && !!audiusSdk
  })
}
