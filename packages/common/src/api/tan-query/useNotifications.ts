import { useQuery } from '@tanstack/react-query'

import { useAudiusQueryContext } from '~/audius-query'
import { Id, ID } from '~/models/Identifiers'

import { QUERY_KEYS } from './queryKeys'

export const useNotifications = ({ userId }: { userId: ID | null }) => {
  const { audiusSdk } = useAudiusQueryContext()

  return useQuery({
    queryKey: [QUERY_KEYS.notifications, userId],
    queryFn: async () => {
      const sdk = await audiusSdk()
      const { data } = await sdk.full.users.getNotifications({
        id: Id.parse(userId)
      })
      return data
    },
    enabled: !!userId
  })
}
