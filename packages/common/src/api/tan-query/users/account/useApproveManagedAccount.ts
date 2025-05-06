import { Id } from '@audius/sdk'
import { useMutation, useQueryClient } from '@tanstack/react-query'

import { useAudiusQueryContext } from '~/audius-query'
import { User, UserMetadata } from '~/models'

import { getManagedAccountsQueryKey } from './useManagedAccounts'

type ApproveManagedAccountPayload = {
  userId: number
  grantorUser: UserMetadata | User
}

export const useApproveManagedAccount = () => {
  const { audiusSdk } = useAudiusQueryContext()
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (payload: ApproveManagedAccountPayload) => {
      const { grantorUser, userId } = payload
      const grantorUserId = grantorUser.user_id
      const encodedUserId = Id.parse(userId) as string
      const encodedGrantorUserId = Id.parse(grantorUserId)
      const sdk = await audiusSdk()
      await sdk.grants.approveGrant({
        userId: encodedUserId,
        grantorUserId: encodedGrantorUserId
      })
      return payload
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({
        queryKey: getManagedAccountsQueryKey(data.userId)
      })
    }
  })
}
