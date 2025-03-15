import { PublicKey } from '@solana/web3.js'
import { useQuery } from '@tanstack/react-query'

import { useAudiusQueryContext } from '~/audius-query'

import { QUERY_KEYS } from './queryKeys'
import { QueryOptions } from './types'
// Define the allowed mint types based on the SDK
type MintType = 'USDC' | 'wAUDIO'

export type GetOrCreateUserBankParams = {
  wallet: string
  mint?: MintType
}

const getUserBankQueryKey = (wallet: string) => [QUERY_KEYS.userbank, wallet]

/**
 * Hook to get or create a user bank for a wallet
 * This is a migration of the getOrCreateUserBank saga function to a TanStack Query mutation
 */
export const useGetOrCreateUserBank = (
  wallet: string,
  mint: MintType = 'USDC',
  options?: QueryOptions
) => {
  const { audiusSdk } = useAudiusQueryContext()

  return useQuery({
    queryKey: getUserBankQueryKey(wallet),
    queryFn: async (): Promise<PublicKey> => {
      try {
        const sdk = await audiusSdk()

        // Call the SDK's method to get or create a user bank
        const result =
          await sdk.services.claimableTokensClient.getOrCreateUserBank({
            ethWallet: wallet,
            mint
          })

        return result.userBank
      } catch (error) {
        console.error('Error getting or creating user bank', error)
        throw error
      }
    },
    ...options,
    enabled: options?.enabled !== false && !!wallet
  })
}
