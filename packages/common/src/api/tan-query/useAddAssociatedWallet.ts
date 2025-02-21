import { Id } from '@audius/sdk'
import { useMutation, useQueryClient } from '@tanstack/react-query'

import { useAudiusQueryContext } from '~/audius-query'
import { type Chain } from '~/models'

import { QUERY_KEYS } from './queryKeys'
import { useCurrentUserId } from './useCurrentUserId'

type ConnectedWallet = { address: string; chain: Chain; isPending?: boolean }

type AddConnectedWalletParams = {
  wallet: ConnectedWallet
  signature: string
}

export const useAddConnectedWallet = () => {
  const queryClient = useQueryClient()
  const { audiusSdk, reportToSentry } = useAudiusQueryContext()
  const { data: currentUserId } = useCurrentUserId()
  return useMutation({
    mutationFn: async ({ wallet, signature }: AddConnectedWalletParams) => {
      const sdk = await audiusSdk()
      await sdk.users.addAssociatedWallet({
        userId: Id.parse(currentUserId),
        wallet,
        signature
      })
    },
    onMutate: async (params) => {
      // Cache old state
      const previousAssociatedWallets = queryClient.getQueryData<
        ConnectedWallet[]
      >([QUERY_KEYS.connectedWallets])

      if (!previousAssociatedWallets) {
        return { previousAssociatedWallets: [] }
      }

      // Optimistically add the new wallet
      queryClient.setQueryData(
        [QUERY_KEYS.connectedWallets],
        (old: ConnectedWallet[]) => [
          ...old,
          { ...params.wallet, isPending: true }
        ]
      )

      return { previousAssociatedWallets }
    },
    onSettled: async () => {
      return await queryClient.invalidateQueries({
        queryKey: [QUERY_KEYS.connectedWallets]
      })
    },
    onError: (error, _newWallet, context) => {
      queryClient.setQueryData(
        [QUERY_KEYS.connectedWallets],
        context?.previousAssociatedWallets
      )
      reportToSentry({
        error,
        name: 'Add Connected Wallet'
      })
    }
  })
}
