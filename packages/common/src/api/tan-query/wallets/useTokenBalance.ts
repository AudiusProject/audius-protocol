import { FixedDecimal } from '@audius/fixed-decimal'

import { useCurrentAccountUser, useUser, useUserCoin } from '~/api'
import { useQueryContext } from '~/api/tan-query/utils'

import { QueryOptions } from '../types'

import { useUSDCBalance } from './useUSDCBalance'
import { ID } from '~/models'

const USDC_DECIMALS = 6

/**
 * Wrapper query that gives the balance of any token including USDC.
 * Uses the appropriate query hook and formats accordingly
 *
 * @param mint The mint address of the token to fetch balance for
 * @param options Options for the query and polling
 * @returns Object with status, data, refresh, and cancelPolling
 */
export const useTokenBalance = ({
  mint,
  userId,
  isPolling,
  pollingInterval = 1000,
  ...queryOptions
}: {
  mint: string
  userId?: ID
  isPolling?: boolean
  pollingInterval?: number
} & QueryOptions) => {
  const { env } = useQueryContext()
  const { data: userById } = useUser(userId)
  const { data: currentUser } = useCurrentAccountUser({ enabled: !userId })
  const user = userId ? userById : currentUser
  const ethAddress = user?.wallet ?? null
  const isUsdc = mint === env.USDC_MINT_ADDRESS

  // Artist coins query (includes AUDIO)
  const userCoinQuery = useUserCoin(
    { mint },
    {
      select: (userCoinWithAccounts) => {
        if (!userCoinWithAccounts) return null

        return {
          balance: new FixedDecimal(
            BigInt(userCoinWithAccounts.balance.toString()),
            userCoinWithAccounts.decimals
          ),
          decimals: userCoinWithAccounts.decimals
        }
      },
      enabled: !isUsdc
    }
  )

  // USDC query
  const usdcQuery = useUSDCBalance({
    isPolling,
    pollingInterval,
    enabled: isUsdc && !!ethAddress,
    select: (usdcBalance) => {
      if (!usdcBalance) return null

      return {
        balance: new FixedDecimal(usdcBalance, USDC_DECIMALS),
        decimals: USDC_DECIMALS
      }
    },
    ...queryOptions
  })

  return isUsdc ? usdcQuery : userCoinQuery
}
