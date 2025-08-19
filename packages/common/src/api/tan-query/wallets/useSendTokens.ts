import { AudioWei } from '@audius/fixed-decimal'
import { useMutation, useQueryClient } from '@tanstack/react-query'

import { useQueryContext } from '~/api/tan-query/utils'
import { Name, SolanaWalletAddress } from '~/models'
import { getErrorMessage } from '~/utils'

import { getUserCoinQueryKey } from '../coins/useUserCoin'
import { useWalletAddresses } from '../users/account/useWalletAddresses'

import { useTokenBalance } from './useTokenBalance'

export type SendTokensParams = {
  recipientWallet: SolanaWalletAddress
  amount: AudioWei
}

export type SendTokensResult = {
  signature: string
  success: boolean
}

/**
 * Hook for sending tokens on Solana blockchain.
 * This hook handles only Solana transfers, not ETH transfers.
 *
 * @returns Mutation object with sendTokens function and status
 */
export const useSendTokens = ({ mint }: { mint: string }) => {
  const queryClient = useQueryClient()
  const { audiusBackend, audiusSdk, reportToSentry, analytics, env } =
    useQueryContext()
  const { data: walletAddresses } = useWalletAddresses()

  // Get current user's token balance using the existing hook
  const { data: tokenBalance } = useTokenBalance({ mint })

  return useMutation({
    mutationFn: async ({
      recipientWallet,
      amount
    }: SendTokensParams): Promise<SendTokensResult> => {
      try {
        // For now, we only support wAUDIO transfers
        // This can be extended to support other tokens in the future
        if (mint !== env.WAUDIO_MINT_ADDRESS) {
          throw new Error(`Token mint ${mint} is not supported for sending`)
        }

        // Get current user's ETH address
        const currentUser = walletAddresses?.currentUser
        if (!currentUser) {
          throw new Error('Failed to retrieve current user wallet address')
        }

        // Get SDK instance
        const sdk = await audiusSdk()

        // Check if user has sufficient balance using the hook data
        // tokenBalance.balance is a FixedDecimal, so we need to access its .value property
        if (!tokenBalance?.balance || tokenBalance.balance.value < amount) {
          throw new Error('Insufficient balance to send tokens')
        }

        // Send the tokens using the audius backend
        // This method throws errors instead of returning them
        await audiusBackend.sendWAudioTokens({
          address: recipientWallet,
          amount,
          ethAddress: currentUser,
          sdk
        })

        return {
          signature: 'success', // The backend doesn't return a signature, so we use a placeholder
          success: true
        }
      } catch (error) {
        console.error('Error sending tokens:', error)

        // Use getErrorMessage to extract the error message
        const errorMessage = getErrorMessage(error)

        // Handle specific error cases
        if (errorMessage === 'Missing social proof') {
          throw new Error('Missing social proof')
        }
        if (
          errorMessage ===
          'Recipient has no $AUDIO token account. Please install Phantom-Wallet to create one.'
        ) {
          throw new Error(errorMessage)
        }

        // For other errors, throw a generic message
        throw new Error('Something has gone wrong, please try again.')
      }
    },
    onMutate: async ({ amount }) => {
      // Cancel any outgoing refetches for the user's token balance
      const queryKey = getUserCoinQueryKey(mint)
      await queryClient.cancelQueries({ queryKey })

      // Snapshot the previous balance
      const previousBalance = queryClient.getQueryData(queryKey)

      // Optimistically update the balance by decreasing it
      if (previousBalance) {
        queryClient.setQueryData(queryKey, (old: any) => {
          if (!old) return old

          return {
            ...old,
            balance: old.balance - amount,
            accounts: old.accounts?.map((account: any) =>
              account.isInAppWallet
                ? { ...account, balance: account.balance - amount }
                : account
            )
          }
        })
      }

      // Return context with the previous balance
      return { previousBalance }
    },
    onSuccess: (_, { recipientWallet }) => {
      // Track successful token send
      if (analytics) {
        const currentUser = walletAddresses?.currentUser
        if (currentUser) {
          analytics.track(
            analytics.make({
              eventName: Name.SEND_AUDIO_SUCCESS,
              from: currentUser,
              recipient: recipientWallet
            })
          )
        }
      }
    },
    onError: (error, { amount, recipientWallet }, context) => {
      // If the mutation fails, roll back the optimistic update
      if (context?.previousBalance) {
        const queryKey = getUserCoinQueryKey(mint)
        queryClient.setQueryData(queryKey, context.previousBalance)
      }

      // Track failed token send
      if (analytics) {
        const currentUser = walletAddresses?.currentUser
        if (currentUser) {
          analytics.track(
            analytics.make({
              eventName: Name.SEND_AUDIO_FAILURE,
              from: currentUser,
              recipient: recipientWallet,
              error: error instanceof Error ? error.message : 'Unknown error'
            })
          )
        }
      }

      // Report error to Sentry
      if (reportToSentry) {
        reportToSentry({
          error: error instanceof Error ? error : new Error(error as string),
          name: 'Send Tokens',
          additionalInfo: {
            amount: amount.toString(),
            mint
          }
        })
      }
    },
    onSettled: () => {
      // Always refetch the user's token balance after the mutation settles
      const queryKey = getUserCoinQueryKey(mint)
      queryClient.invalidateQueries({ queryKey })
    }
  })
}
