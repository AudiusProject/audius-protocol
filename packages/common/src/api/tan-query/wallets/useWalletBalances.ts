import { FixedDecimal } from '@audius/fixed-decimal'
import { PublicKey } from '@solana/web3.js'
import {
  queryOptions,
  useQueries,
  type QueryFunctionContext
} from '@tanstack/react-query'

import {
  useQueryContext,
  type QueryContextType
} from '~/api/tan-query/utils/QueryContext'
import { Feature } from '~/models/ErrorReporting'
import { toErrorWithMessage } from '~/utils/error'

import { QUERY_KEYS } from '../queryKeys'

type UseWalletBalancesParams = {
  /** Solana wallet address */
  walletAddress: string
  /** Array of token mint addresses to check balances for */
  mints: string[]
}

type TokenBalanceResult = {
  mint: string
  balanceUi: string
  balanceLamports: bigint
  balanceLocaleString: string
  decimals: number
  error?: Error
}

const SOL_MINT = 'So11111111111111111111111111111111111111112' // Native SOL wrapped mint
const SOL_DECIMALS = 9 // SOL has 9 decimal places

const getWalletBalancesQueryKey = ({
  walletAddress,
  mints
}: UseWalletBalancesParams) =>
  [QUERY_KEYS.walletBalances, walletAddress, mints.sort().join(',')] as const

type FetchWalletBalancesContext = Pick<
  QueryContextType,
  'audiusSdk' | 'audiusBackend' | 'reportToSentry'
>

const getSingleTokenBalanceQueryKey = (walletAddress: string, mint: string) =>
  [QUERY_KEYS.walletBalances, walletAddress, mint] as const

const getSingleTokenBalanceQueryFn =
  (context: FetchWalletBalancesContext) =>
  async ({
    queryKey
  }: QueryFunctionContext<
    ReturnType<typeof getSingleTokenBalanceQueryKey>
  >) => {
    const [_ignored, walletAddress, mint] = queryKey
    const { audiusSdk, reportToSentry } = context

    try {
      const sdk = await audiusSdk()
      const connection = sdk.services.solanaClient.connection
      const walletPublicKey = new PublicKey(walletAddress)

      // Handle SOL (native) balance
      if (mint === SOL_MINT || mint.toLowerCase() === 'sol') {
        const solBalance = await connection.getBalance(walletPublicKey)
        const solBalanceFixedDecimal = new FixedDecimal(
          BigInt(solBalance.toString()),
          SOL_DECIMALS
        )

        return {
          mint,
          balanceUi: solBalanceFixedDecimal.toFixed(),
          balanceLamports: solBalanceFixedDecimal.value,
          balanceLocaleString: solBalanceFixedDecimal.toLocaleString('en-US', {
            minimumFractionDigits: 2,
            maximumFractionDigits: 6,
            roundingMode: 'trunc'
          }),
          decimals: SOL_DECIMALS
        } as TokenBalanceResult
      }

      // Handle SPL token balance
      const mintPublicKey = new PublicKey(mint)

      // Get token accounts for this mint
      const tokenAccounts = await connection.getTokenAccountsByOwner(
        walletPublicKey,
        { mint: mintPublicKey }
      )

      if (tokenAccounts.value.length === 0) {
        // No token account exists, balance is 0
        return {
          mint,
          balanceUi: '0',
          balanceLamports: BigInt(0),
          balanceLocaleString: '0',
          decimals: 0 // We don't know decimals without an account, but balance is 0
        } as TokenBalanceResult
      }

      // Get the first token account (users typically have one per mint)
      const tokenAccount = tokenAccounts.value[0]
      const accountInfo = await connection.getTokenAccountBalance(
        tokenAccount.pubkey
      )

      const balance = BigInt(accountInfo.value.amount)
      const decimals = accountInfo.value.decimals
      const balanceFixedDecimal = new FixedDecimal(balance, decimals)

      return {
        mint,
        balanceUi: balanceFixedDecimal.toFixed(),
        balanceLamports: balance,
        balanceLocaleString: balanceFixedDecimal.toLocaleString(),
        decimals
      } as TokenBalanceResult
    } catch (error) {
      reportToSentry({
        error: toErrorWithMessage(error),
        name: 'WalletTokenBalanceFetchError',
        feature: Feature.TanQuery,
        additionalInfo: { walletAddress, mint }
      })

      // Return error result instead of throwing
      return {
        mint,
        balanceUi: '0',
        balanceLamports: BigInt(0),
        balanceLocaleString: '0',
        decimals: 0,
        error: toErrorWithMessage(error)
      } as TokenBalanceResult
    }
  }

/**
 * Helper function to get the query options for fetching balances of multiple tokens.
 * Useful for getting the query key tagged with the data type stored in the cache.
 */
export const getWalletBalancesOptions = (
  context: FetchWalletBalancesContext,
  { walletAddress, mints }: UseWalletBalancesParams
) => {
  return mints.map((mint) =>
    queryOptions({
      queryKey: getSingleTokenBalanceQueryKey(walletAddress, mint),
      queryFn: getSingleTokenBalanceQueryFn(context)
    })
  )
}

/**
 * Hook for getting the balances of multiple tokens for a Solana wallet address.
 * This hook uses useQueries to fetch balances for multiple tokens in parallel.
 *
 * @param params.walletAddress - The Solana wallet address to check
 * @param params.mints - Array of token mint addresses to check balances for
 * @param options - Additional query options
 * @returns Array of query results with status, data, and utility functions for each token
 */
export const useWalletBalances = (
  params: UseWalletBalancesParams,
  options?: {
    enabled?: boolean
    refetchInterval?: number | false
    refetchOnWindowFocus?: boolean
  }
) => {
  const context = useQueryContext()

  const queries = getWalletBalancesOptions(context, params).map(
    (queryOption) => ({
      ...queryOption,
      enabled: options?.enabled !== false,
      refetchInterval: options?.refetchInterval,
      refetchOnWindowFocus: options?.refetchOnWindowFocus
    })
  )

  const results = useQueries({ queries })

  // Transform results to include mint information and provide a cleaner API
  const balances = results.map((result, index) => ({
    mint: params.mints[index],
    isPending: result.isPending,
    isLoading: result.isPending,
    isError: result.isError,
    isSuccess: result.isSuccess,
    data: result.data,
    error: result.error,
    refetch: result.refetch
  }))

  // Provide aggregate status information
  const isPending = results.some((result) => result.isPending)
  const isLoading = isPending
  const isError = results.some((result) => result.isError)
  const isSuccess = results.every((result) => result.isSuccess)

  return {
    balances,
    isPending,
    isLoading,
    isError,
    isSuccess,
    // Refetch all queries
    refetchAll: () => {
      results.forEach((result) => result.refetch())
    }
  }
}
