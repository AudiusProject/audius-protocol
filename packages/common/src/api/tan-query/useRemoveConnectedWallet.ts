import { Id } from '@audius/sdk'
import { useMutation, useQueryClient } from '@tanstack/react-query'

import { useAudiusQueryContext } from '~/audius-query'
import { type Chain } from '~/models'

import { getConnectedWalletsQueryKey } from './useConnectedWallets'
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
        queryKey: getConnectedWalletsQueryKey({ userId: currentUserId })
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
