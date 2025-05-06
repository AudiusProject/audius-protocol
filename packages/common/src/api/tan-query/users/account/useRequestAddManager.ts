import { Id } from '@audius/sdk'
import { useMutation, useQueryClient } from '@tanstack/react-query'

import { useAudiusQueryContext } from '~/audius-query'
import { User, UserMetadata } from '~/models'

import { getManagersQueryKey } from './useManagers'

type RequestAddManagerPayload = {
  userId: number
  managerUser: UserMetadata | User
}

export const useRequestAddManager = () => {
  const { audiusSdk } = useAudiusQueryContext()
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (payload: RequestAddManagerPayload) => {
      const { managerUser, userId } = payload
      const managerUserId = managerUser.user_id
      const encodedUserId = Id.parse(userId) as string
      const encodedManagerUserId = Id.parse(managerUserId)
      const sdk = await audiusSdk()
      await sdk.grants.addManager({
        userId: encodedUserId,
        managerUserId: encodedManagerUserId
      })
      return payload
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({
        queryKey: getManagersQueryKey(data.userId)
      })
    }
  })
}
