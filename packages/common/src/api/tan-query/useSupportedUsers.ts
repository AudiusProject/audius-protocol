import { useQuery, useQueryClient } from '@tanstack/react-query'

import { useAppContext } from '~/context/appContext'
import { Id, OptionalId } from '~/models/Identifiers'
import { supportedUserMetadataListFromSDK } from '~/models/Tipping'
import { SUPPORTING_PAGINATION_SIZE } from '~/utils/constants'

import { QUERY_KEYS } from './queryKeys'
import { useCurrentUserId } from './useCurrentUserId'

type UseSupportedUsersArgs = {
  userId?: number
  limit?: number
}

type Config = {
  staleTime?: number
  enabled?: boolean
}

export const useSupportedUsers = (
  { userId, limit = SUPPORTING_PAGINATION_SIZE }: UseSupportedUsersArgs,
  config?: Config
) => {
  const { audiusSdk } = useAppContext()
  const queryClient = useQueryClient()
  const { data: currentUserId } = useCurrentUserId()

  return useQuery({
    queryKey: [QUERY_KEYS.supportedUsers, userId],
    queryFn: async () => {
      if (!audiusSdk || !userId) return []
      const { data = [] } = await audiusSdk.full.users.getSupportedUsers({
        id: Id.parse(userId),
        limit,
        userId: OptionalId.parse(currentUserId)
      })

      const supporting = supportedUserMetadataListFromSDK(data)

      // Cache user data for each supported user
      supporting.forEach((supportedUser) => {
        if (supportedUser.receiver) {
          queryClient.setQueryData(
            [QUERY_KEYS.user, supportedUser.receiver.user_id],
            supportedUser.receiver
          )
        }
      })

      return supporting
    },
    staleTime: config?.staleTime,
    enabled: config?.enabled !== false && !!userId && !!audiusSdk
  })
}
