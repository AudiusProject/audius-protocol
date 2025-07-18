import { decodeHashId } from '@audius/sdk'
import { InfiniteData, useInfiniteQuery } from '@tanstack/react-query'

import { useQueryContext } from '~/api/tan-query/utils'
import { TOKEN_LISTING_MAP } from '~/store'

import { QUERY_KEYS } from '../queryKeys'
import { QueryKey, QueryOptions } from '../types'

const DEFAULT_PAGE_SIZE = 20

export interface CoinMember {
  user_id: number
  balance: number
}

export interface UseArtistCoinMembersArgs {
  mint: string | null
  pageSize?: number
  minBalance?: number
  sortDirection?: 'asc' | 'desc'
}

export const getCoinLeaderboardQueryKey = (
  mint: string | null | undefined,
  pageSize: number = DEFAULT_PAGE_SIZE,
  minBalance?: number,
  sortDirection?: 'asc' | 'desc'
) =>
  [
    QUERY_KEYS.artistCoinMembers,
    mint,
    pageSize,
    minBalance,
    sortDirection
  ] as unknown as QueryKey<InfiniteData<CoinMember[]>>

export const useArtistCoinMembers = (
  {
    mint,
    pageSize = DEFAULT_PAGE_SIZE,
    minBalance,
    sortDirection = 'desc'
  }: UseArtistCoinMembersArgs,
  options?: QueryOptions
) => {
  const { env } = useQueryContext()

  // Map route key to actual mint address if needed
  const getMintAddress = (mintKey: string) => {
    const token =
      TOKEN_LISTING_MAP[mintKey.toUpperCase() as keyof typeof TOKEN_LISTING_MAP]
    return token?.address || mintKey
  }

  return useInfiniteQuery({
    queryKey: getCoinLeaderboardQueryKey(
      mint,
      pageSize,
      minBalance,
      sortDirection
    ),
    initialPageParam: 0,
    getNextPageParam: (lastPage: CoinMember[], allPages: CoinMember[][]) => {
      if (lastPage.length < pageSize) return undefined
      return allPages.length * pageSize
    },
    queryFn: async ({ pageParam }): Promise<CoinMember[]> => {
      if (!mint) return []

      const mintAddress = getMintAddress(mint)

      // Build query parameters
      const params = new URLSearchParams({
        limit: pageSize.toString(),
        offset: pageParam.toString(),
        sort_direction: sortDirection
      })

      if (minBalance !== undefined) {
        params.append('min_balance', minBalance.toString())
      }

      // Make the API call to the coin members endpoint
      const response = await fetch(
        `${env.API_URL}/v1/coins/${mintAddress}/members?${params.toString()}`
      )

      if (!response.ok) {
        throw new Error(
          `Failed to fetch coin leaderboard: ${response.statusText}`
        )
      }

      const data = await response.json()
      const members: CoinMember[] = (data.data || []).map((member: any) => ({
        user_id: decodeHashId(member.user_id) || 0,
        balance: member.balance
      }))

      return members
    },
    select: (data) => data.pages.flat(),
    ...options,
    enabled: options?.enabled !== false && !!mint
  })
}
