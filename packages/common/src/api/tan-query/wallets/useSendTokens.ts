import { PublicKey } from '@solana/web3.js'
import { useMutation, useQueryClient } from '@tanstack/react-query'

import { useQueryContext } from '~/api/tan-query/utils'
import { Name, SolanaWalletAddress } from '~/models'
import { getErrorMessage } from '~/utils'

import { getUserCoinQueryKey } from '../coins/useUserCoin'
import { useWalletAddresses } from '../users/account/useWalletAddresses'

import { useTokenBalance } from './useTokenBalance'

export type SendTokensParams = {
  recipientWallet: SolanaWalletAddress
  amount: bigint
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
  const { audiusBackend, audiusSdk, reportToSentry, analytics } =
    useQueryContext()
  const { data: walletAddresses } = useWalletAddresses()

  const { data: tokenBalance } = useTokenBalance({ mint })

  return useMutation({
    mutationFn: async ({
      recipientWallet,
      amount
    }: SendTokensParams): Promise<SendTokensResult> => {
      try {
        const currentUser = walletAddresses?.currentUser
        if (!currentUser) {
          throw new Error('Failed to retrieve current user wallet address')
        }

        const sdk = await audiusSdk()

        if (!tokenBalance?.balance || tokenBalance.balance.value < amount) {
          throw new Error('Insufficient balance to send tokens')
        }

        const { res: signature } = await audiusBackend.sendTokens({
          address: recipientWallet,
          amount: amount as any, // TODO: Fix type mismatch between bigint and AudioWei
          ethAddress: currentUser,
          sdk,
          mint: new PublicKey(mint) as any // TODO: Fix type mismatch between string and MintName | PublicKey
        })

        return {
          signature,
          success: true
        }
      } catch (error) {
        console.error('Error sending tokens:', error)

        const errorMessage = getErrorMessage(error)

        if (errorMessage === 'Missing social proof') {
          throw new Error('Missing social proof')
        }
        if (
          errorMessage ===
          'Recipient has no $AUDIO token account. Please install Phantom-Wallet to create one.'
        ) {
          throw new Error(errorMessage)
        }

        throw new Error('Something has gone wrong, please try again.')
      }
    },
    onMutate: async ({ amount }) => {
      const queryKey = getUserCoinQueryKey(mint)
      await queryClient.cancelQueries({ queryKey })

      const previousBalance = queryClient.getQueryData(queryKey)

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

      return { previousBalance }
    },
    onSuccess: (_, { recipientWallet }) => {
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
      if (context?.previousBalance) {
        const queryKey = getUserCoinQueryKey(mint)
        queryClient.setQueryData(queryKey, context.previousBalance)
      }

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
      const queryKey = getUserCoinQueryKey(mint)
      queryClient.invalidateQueries({ queryKey })
    }
  })
}
