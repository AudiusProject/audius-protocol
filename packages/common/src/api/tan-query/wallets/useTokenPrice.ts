import { useQuery } from '@tanstack/react-query'

import { QUERY_KEYS } from '../queryKeys'
import { QueryOptions, type QueryKey } from '../types'

/**
 * Structure of a token price response from Jupiter API
 */
export type TokenPriceResponse = {
  price: string
  mint: string
}

/**
 * Get the query key for token price lookup
 */
export const getTokenPriceQueryKey = (tokenMint: string | null | undefined) =>
  [
    QUERY_KEYS.tokenPrice,
    tokenMint
  ] as unknown as QueryKey<TokenPriceResponse | null>

/**
 * Hook to get the price of a token on Solana using Jupiter's API
 *
 * @param tokenMint The Solana token mint address
 * @param options Optional configuration for the query
 * @returns The token price data or null if not found
 */
export const useTokenPrice = (
  tokenMint: string | null | undefined,
  options?: QueryOptions
) => {
  return useQuery({
    queryKey: getTokenPriceQueryKey(tokenMint),
    queryFn: async () => {
      if (!tokenMint) return null

      try {
        const response = await fetch(
          `https://lite-api.jup.ag/price/v3?ids=${tokenMint}`
        )

        if (!response.ok) {
          throw new Error(`Failed to fetch token price: ${response.statusText}`)
        }

        const responseJson = await response.json()

        // Return the price data for the requested token
        if (responseJson?.[tokenMint]) {
          return {
            price: responseJson[tokenMint].usdPrice.toString(),
            mint: tokenMint
          } as TokenPriceResponse
        }

        return null
      } catch (error) {
        console.error('Failed to fetch token price:', error)
        throw error
      }
    },
    ...options,
    enabled: options?.enabled !== false && !!tokenMint
  })
}
