import { Id } from '@audius/sdk'
import { useMutation, useQueryClient } from '@tanstack/react-query'

import { useAudiusQueryContext } from '~/audius-query'
import { type Chain } from '~/models'

import { QUERY_KEYS } from './queryKeys'
import { useCurrentUserId } from './useCurrentUserId'

export type RemoveConnectedWalletParams = {
  wallet: { address: string; chain: Chain }
}

export const useRemoveConnectedWallet = () => {
  const queryClient = useQueryClient()
  const { audiusSdk, reportToSentry } = useAudiusQueryContext()
  const { data: currentUserId } = useCurrentUserId()
  return useMutation({
    mutationFn: async ({ wallet }: RemoveConnectedWalletParams) => {
      const sdk = await audiusSdk()
      const response = await sdk.users.removeAssociatedWallet({
        userId: Id.parse(currentUserId),
        wallet
      })
      return response
    },
    onSettled: async () => {
      return await queryClient.invalidateQueries({
        queryKey: [QUERY_KEYS.connectedWallets]
      })
    },
    onError: (error) => {
      reportToSentry({
        error,
        name: 'Remove Connected Wallet'
      })
    }
  })
}
