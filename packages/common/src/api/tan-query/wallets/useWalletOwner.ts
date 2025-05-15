import { getAccount } from '@solana/spl-token'
import { PublicKey } from '@solana/web3.js'
import { useQuery } from '@tanstack/react-query'

import { useQueryContext } from '~/api/tan-query/utils/QueryContext'
import { SolanaWalletAddress } from '~/models'

import { QUERY_KEYS } from '../queryKeys'
import { QueryOptions, type QueryKey } from '../types'

/**
 * Get the query key for wallet owner lookup
 */
export const getWalletOwnerQueryKey = (
  walletAddress: SolanaWalletAddress | null | undefined
) => [QUERY_KEYS.walletOwner, walletAddress] as unknown as QueryKey<string>

/**
 * Hook to get the owner of a Solana token account
 * If walletAddress represents an associated token account, this returns the owner's address.
 * If the fetch fails, it falls back to returning the original walletAddress.
 * @param walletAddress The Solana wallet address to check
 * @param options Optional configuration for the query
 * @returns The owner's wallet address or the original address on error
 */
export const useWalletOwner = (
  walletAddress: SolanaWalletAddress | null | undefined,
  options?: QueryOptions
) => {
  const { audiusSdk } = useQueryContext()

  return useQuery({
    queryKey: getWalletOwnerQueryKey(walletAddress),
    queryFn: async () => {
      if (!walletAddress) return null

      try {
        const sdk = await audiusSdk()
        const connection = sdk.services.solanaClient.connection
        const { owner } = await getAccount(
          connection,
          new PublicKey(walletAddress)
        )
        // If owner is null, it might mean the ATA doesn't exist or is invalid,
        // but we still want to display the configured address to avoid confusion.
        // We'll fall back to the original wallet address if owner lookup fails.
        return owner?.toString() ?? walletAddress
      } catch (e) {
        console.error('Failed to get associated token account owner:', e)
        // Fallback to displaying the stored address on error
        return walletAddress
      }
    },
    ...options,
    enabled: options?.enabled !== false && !!walletAddress
  })
}
