import { Id } from '@audius/sdk'
import { useMutation, useQueryClient } from '@tanstack/react-query'

import { useAudiusQueryContext } from '~/audius-query'

import { getManagedAccountsQueryKey } from './useManagedAccounts'
import { getManagersQueryKey } from './useManagers'

type RemoveManagerPayload = {
  userId: number
  managerUserId: number
}

export const useRemoveManager = () => {
  const { audiusSdk } = useAudiusQueryContext()
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (payload: RemoveManagerPayload) => {
      const { managerUserId, userId } = payload
      const encodedUserId = Id.parse(userId) as string
      const encodedManagerUserId = Id.parse(managerUserId)
      const sdk = await audiusSdk()
      await sdk.grants.removeManager({
        userId: encodedUserId,
        managerUserId: encodedManagerUserId
      })
      return payload
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({
        queryKey: getManagedAccountsQueryKey(data.managerUserId)
      })
      queryClient.invalidateQueries({
        queryKey: getManagersQueryKey(data.userId)
      })
    }
  })
}
