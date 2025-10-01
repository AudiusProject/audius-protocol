import { useQueryContext } from '@audius/common/api'
import type { Provider as SolanaProvider } from '@reown/appkit-adapter-solana/react'
import { VersionedTransaction } from '@solana/web3.js'
import { useMutation, UseMutationOptions } from '@tanstack/react-query'

import { appkitModal } from 'app/ReownAppKitModal'

export type UseClaimFeeParams = {
  tokenMint: string
  ownerWalletAddress: string
  receiverWalletAddress: string
}

export type ClaimFeeResponse = {
  claimFeeTx: string
  signature: string
}

/**
 * Hook for claiming creator trading fees from a dynamic bonding curve pool.
 * This creates, signs, and sends the claim fee transaction.
 */
export const useClaimFee = (
  options?: UseMutationOptions<ClaimFeeResponse, Error, UseClaimFeeParams>
) => {
  const { audiusSdk } = useQueryContext()

  return useMutation<ClaimFeeResponse, Error, UseClaimFeeParams>({
    mutationFn: async ({
      tokenMint,
      ownerWalletAddress,
      receiverWalletAddress
    }: UseClaimFeeParams): Promise<ClaimFeeResponse> => {
      const sdk = await audiusSdk()
      const solanaProvider = appkitModal.getProvider<SolanaProvider>('solana')
      if (!solanaProvider) {
        throw new Error('Missing SolanaProvider')
      }
      if (!ownerWalletAddress) {
        throw new Error('Missing owner wallet address')
      }

      // Get the claim fee transaction from the relay
      const claimFeeResponse = await sdk.services.solanaRelay.claimFee({
        tokenMint,
        ownerWalletAddress,
        receiverWalletAddress
      })

      const { claimFeeTx: claimFeeTxSerialized } = claimFeeResponse

      // Transaction is sent from the backend as a serialized base64 string
      const deserializedTx = VersionedTransaction.deserialize(
        Buffer.from(claimFeeTxSerialized, 'base64')
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
        claimFeeTx: claimFeeTxSerialized,
        signature
      }
    },
    ...options
  })
}
