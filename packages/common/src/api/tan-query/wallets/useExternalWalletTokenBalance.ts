import { FixedDecimal } from '@audius/fixed-decimal'
import {
  getAssociatedTokenAddressSync,
  getAccount,
  TokenAccountNotFoundError
} from '@solana/spl-token'
import { PublicKey } from '@solana/web3.js'
import {
  queryOptions,
  useQuery,
  type QueryFunctionContext
} from '@tanstack/react-query'

import {
  useQueryContext,
  type QueryContextType
} from '~/api/tan-query/utils/QueryContext'
import { Feature } from '~/models/ErrorReporting'
import { TOKEN_LISTING_MAP } from '~/store'
import { toErrorWithMessage } from '~/utils/error'

import { QUERY_KEYS } from '../queryKeys'
import { QueryOptions } from '../types'

type UseExternalWalletTokenBalanceParams = {
  walletAddress: string
  mint: string
}

const getExternalWalletTokenBalanceQueryKey = ({
  walletAddress,
  mint
}: UseExternalWalletTokenBalanceParams) =>
  [QUERY_KEYS.externalWalletTokenBalance, { walletAddress, mint }] as const

type FetchExternalWalletTokenBalanceContext = Pick<
  QueryContextType,
  'audiusSdk' | 'env' | 'reportToSentry'
>

const getExternalWalletTokenBalanceQueryFn =
  (context: FetchExternalWalletTokenBalanceContext) =>
  async ({
    queryKey
  }: QueryFunctionContext<
    ReturnType<typeof getExternalWalletTokenBalanceQueryKey>
  >) => {
    const [_ignored, { walletAddress, mint }] = queryKey
    const { audiusSdk, env, reportToSentry } = context
    try {
      const sdk = await audiusSdk()
      const connection = sdk.services.solanaClient.connection
      const walletPublicKey = new PublicKey(walletAddress)

      // Get SOL balance
      const walletSolBalance = await connection.getBalance(walletPublicKey)

      // Get USDC balance
      let usdcBalance = BigInt(0)
      try {
        const usdcMint = new PublicKey(env.USDC_MINT_ADDRESS)
        const usdcTokenAccountAddress = getAssociatedTokenAddressSync(
          usdcMint,
          walletPublicKey,
          true // allowOwnerOffCurve
        )

        const usdcTokenAccount = await getAccount(
          connection,
          usdcTokenAccountAddress
        )

        usdcBalance = usdcTokenAccount.amount
      } catch (e) {
        // If the token account doesn't exist, balance is 0
        if (e instanceof TokenAccountNotFoundError) {
          usdcBalance = BigInt(0)
        } else {
          console.error('Error fetching USDC balance:', e)
          usdcBalance = BigInt(0)
        }
      }

      const solTokenInfo = {
        balance: walletSolBalance,
        name: 'SOL',
        symbol: '$SOL',
        decimals: 9,
        address: TOKEN_LISTING_MAP.SOL.address,
        logoURI: '',
        isStablecoin: false
      }
      const usdcTokenInfo = {
        balance: new FixedDecimal(usdcBalance, 6),
        name: 'USDC',
        symbol: '$USDC',
        decimals: 6,
        address: mint,
        logoURI: '',
        isStablecoin: true
      }
      return usdcTokenInfo
    } catch (error) {
      reportToSentry({
        error: toErrorWithMessage(error),
        name: 'ExternalWalletTokenBalanceFetchError',
        feature: Feature.TanQuery,
        additionalInfo: { walletAddress }
      })
      throw error
    }
  }

/**
 * Helper function to get the query options for fetching external wallet token balances.
 * Useful for getting the query key tagged with the data type stored in the cache.
 */
const getExternalWalletTokenBalanceOptions = (
  context: FetchExternalWalletTokenBalanceContext,
  { walletAddress, mint }: UseExternalWalletTokenBalanceParams
) => {
  return queryOptions({
    queryKey: getExternalWalletTokenBalanceQueryKey({ walletAddress, mint }),
    queryFn: getExternalWalletTokenBalanceQueryFn(context)
  })
}

/**
 * Query function for getting SOL and USDC token balances for an external wallet.
 */
export const useExternalWalletTokenBalance = (
  {
    walletAddress,
    mint
  }: { walletAddress: string | undefined; mint: string | undefined },
  options?: QueryOptions
) => {
  const context = useQueryContext()
  return useQuery({
    ...options,
    ...getExternalWalletTokenBalanceOptions(context, {
      walletAddress: walletAddress!,
      mint: mint!
    }),
    enabled: options?.enabled !== false && !!walletAddress && !!mint
  })
}
