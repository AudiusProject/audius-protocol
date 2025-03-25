import { Id } from '@audius/sdk'
import { useMutation, useQueryClient } from '@tanstack/react-query'

import { useAudiusQueryContext } from '~/audius-query'
import { type Chain } from '~/models'

import { getConnectedWalletsQueryKey } from './useConnectedWallets'
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
      >(getConnectedWalletsQueryKey({ userId: currentUserId }))

      if (!previousAssociatedWallets) {
        return { previousAssociatedWallets: [] }
      }

      // Optimistically add the new wallet
      queryClient.setQueryData(
        getConnectedWalletsQueryKey({ userId: currentUserId }),
        (old: ConnectedWallet[]) => [
          ...old,
          { ...params.wallet, isPending: true }
        ]
      )

      return { previousAssociatedWallets }
    },
    onSettled: async () => {
      return await queryClient.invalidateQueries({
        queryKey: getConnectedWalletsQueryKey({ userId: currentUserId })
      })
    },
    onError: (error, _newWallet, context) => {
      queryClient.setQueryData(
        getConnectedWalletsQueryKey({ userId: currentUserId }),
        context?.previousAssociatedWallets
      )
      reportToSentry({
        error,
        name: 'Add Connected Wallet'
      })
    }
  })
}
