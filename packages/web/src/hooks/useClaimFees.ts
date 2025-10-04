import { type Coin } from '@audius/common/adapters'
import {
  getArtistCoinQueryKey,
  useCurrentAccountUser,
  useQueryContext
} from '@audius/common/api'
import { Feature } from '@audius/common/models'
import type { Provider as SolanaProvider } from '@reown/appkit-adapter-solana/react'
import { VersionedTransaction } from '@solana/web3.js'
import {
  useMutation,
  UseMutationOptions,
  useQueryClient
} from '@tanstack/react-query'

import { appkitModal } from 'app/ReownAppKitModal'
import { reportToSentry } from 'store/errors/reportToSentry'

export type UseClaimFeesParams = {
  tokenMint: string
  ownerWalletAddress: string
}

export type ClaimFeesResponse = {
  claimFeesTx: string
  signature: string
}

/**
 * Hook for claiming creator trading fees from a dynamic bonding curve pool.
 * This gets the TX from solana relay, then signs and sends the claim fees transaction.
 * NOTE: This is a web feature only because the user must sign with the same external wallet they used to launch the coin (wallet connect wallet).
 */
export const useClaimFees = (
  options?: UseMutationOptions<ClaimFeesResponse, Error, UseClaimFeesParams>
) => {
  const { audiusSdk } = useQueryContext()
  const queryClient = useQueryClient()
  const { data: currentUser } = useCurrentAccountUser()

  return useMutation<ClaimFeesResponse, Error, UseClaimFeesParams>({
    mutationFn: async ({
      tokenMint,
      ownerWalletAddress
    }: UseClaimFeesParams): Promise<ClaimFeesResponse> => {
      const sdk = await audiusSdk()
      const solanaProvider = appkitModal.getProvider<SolanaProvider>('solana')
      if (!solanaProvider) {
        throw new Error('Missing SolanaProvider')
      }
      if (!ownerWalletAddress) {
        throw new Error('Missing owner wallet address')
      }
      let splWallet = currentUser?.spl_wallet?.toString()
      if (!splWallet) {
        const { userBank } =
          await sdk.services.claimableTokensClient.getOrCreateUserBank({
            ethWallet: currentUser?.erc_wallet,
            mint: 'wAUDIO'
          })
        splWallet = userBank.toBase58()
      }

      if (!splWallet) {
        throw new Error('Unable to get or create wAUDIO SPL wallet address')
      }
      // Get the claim fee transaction from the relay
      const claimFeesResponse = await sdk.services.solanaRelay.claimFees({
        tokenMint,
        ownerWalletAddress,
        receiverWalletAddress: splWallet.toString()
      })

      const { claimFeesTx: claimFeesTxSerialized } = claimFeesResponse

      // Transaction is sent from the backend as a serialized base64 string
      const deserializedTx = VersionedTransaction.deserialize(
        Buffer.from(claimFeesTxSerialized, 'base64')
      )

      // Triggers 3rd party wallet to sign and send the transaction
      const signature =
        await solanaProvider.signAndSendTransaction(deserializedTx)

      // Confirm the transaction
      await sdk.services.solanaClient.connection.confirmTransaction(
        signature,
        'confirmed'
      )

      return {
        claimFeesTx: claimFeesTxSerialized,
        signature
      }
    },
    ...options,
    onError: (error, params) => {
      // Call the original onError if provided
      reportToSentry({
        error,
        feature: Feature.ArtistCoins,
        name: 'Artist coin fees claim error',
        additionalInfo: {
          ...params
        }
      })
    },
    onSuccess: (data, variables, context) => {
      // Optimistically update the unclaimed fees data
      const queryKey = getArtistCoinQueryKey(variables.tokenMint)
      queryClient.setQueryData<Coin>(queryKey, (existingCoin) => {
        if (!existingCoin) return existingCoin
        return {
          ...existingCoin,
          dynamicBondingCurve: {
            ...existingCoin?.dynamicBondingCurve,
            creatorQuoteFee: 0
          }
        }
      })

      // Call the original onSuccess if provided
      options?.onSuccess?.(data, variables, context)
    }
  })
}
