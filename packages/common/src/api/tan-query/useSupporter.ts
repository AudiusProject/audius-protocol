import { useQuery } from '@tanstack/react-query'

import { useAppContext } from '~/context/appContext'
import { Id, OptionalId } from '~/models/Identifiers'
import { supporterMetadataFromSDK } from '~/models/Tipping'

import { QUERY_KEYS } from './queryKeys'
import { useCurrentUserId } from './useCurrentUserId'

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
  const { audiusSdk } = useAppContext()
  const { data: currentUserId } = useCurrentUserId()

  return useQuery({
    queryKey: [QUERY_KEYS.supporters, userId, supporterUserId],
    queryFn: async () => {
      if (!audiusSdk || !userId || !supporterUserId) return null
      const { data } = await audiusSdk.full.users.getSupporter({
        id: Id.parse(userId),
        supporterUserId: Id.parse(supporterUserId),
        userId: OptionalId.parse(currentUserId)
      })

      if (!data) return null

      return supporterMetadataFromSDK(data)
    },
    staleTime: config?.staleTime,
    enabled:
      config?.enabled !== false && !!userId && !!supporterUserId && !!audiusSdk
  })
}
