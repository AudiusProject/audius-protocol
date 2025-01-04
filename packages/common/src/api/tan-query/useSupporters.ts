import { useQuery, useQueryClient } from '@tanstack/react-query'
import { useDispatch } from 'react-redux'

import { useAppContext } from '~/context/appContext'
import { Id, OptionalId } from '~/models/Identifiers'
import { supporterMetadataListFromSDK } from '~/models/Tipping'
import { MAX_PROFILE_TOP_SUPPORTERS } from '~/utils/constants'

import { QUERY_KEYS } from './queryKeys'
import { useCurrentUserId } from './useCurrentUserId'
import { primeUserData } from './utils/primeUserData'

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
  const dispatch = useDispatch()

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
      primeUserData({
        users: supporters.map((supporter) => supporter.sender),
        queryClient,
        dispatch
      })

      return supporters
    },
    staleTime: config?.staleTime,
    enabled: config?.enabled !== false && !!userId && !!audiusSdk
  })
}
