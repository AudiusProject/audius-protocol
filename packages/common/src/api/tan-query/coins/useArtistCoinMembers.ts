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
  ] as unknown as QueryKey<InfiniteData<CoinMember[], number>>

export const useArtistCoinMembers = (
  {
    mint,
    pageSize = DEFAULT_PAGE_SIZE,
    minBalance,
    sortDirection = 'desc'
  }: UseArtistCoinMembersArgs,
  options?: QueryOptions
) => {
  const { audiusSdk } = useQueryContext()

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

      const sdk = await audiusSdk()
      const mintAddress = getMintAddress(mint)

      const params: any = {
        mint: mintAddress,
        limit: pageSize,
        offset: pageParam,
        sortDirection
      }

      const response = await sdk.coins.getCoinMembers(params)

      console.log('REED', { response })
      const members: CoinMember[] = (response.data ?? []).map(
        (member: any) => ({
          user_id: decodeHashId(member.userId) ?? 0,
          balance: member.balance
        })
      )

      return members
    },
    select: (data) => data.pages.flat(),
    ...options,
    enabled: options?.enabled !== false && !!mint
  })
}
