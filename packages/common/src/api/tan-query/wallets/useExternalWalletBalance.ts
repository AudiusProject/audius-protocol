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

import { findTokenByAddress } from '~/api/tan-query/jupiter/utils'
import {
  useQueryContext,
  type QueryContextType
} from '~/api/tan-query/utils/QueryContext'
import { Feature } from '~/models/ErrorReporting'
import { TOKEN_LISTING_MAP } from '~/store'
import { toErrorWithMessage } from '~/utils/error'

import { QUERY_KEYS } from '../queryKeys'
import { useTokens } from '../tokens/useTokens'
import { QueryOptions } from '../types'

type UseExternalWalletBalanceParams = {
  walletAddress: string
  mint: string
}

export const getExternalWalletBalanceQueryKey = ({
  walletAddress,
  mint
}: UseExternalWalletBalanceParams) =>
  [QUERY_KEYS.externalWalletBalance, { walletAddress, mint }] as const

type FetchExternalWalletBalanceContext = Pick<
  QueryContextType,
  'audiusSdk' | 'env' | 'reportToSentry'
> & {
  tokens: Record<string, any>
}

const getExternalWalletBalanceQueryFn =
  (context: FetchExternalWalletBalanceContext) =>
  async ({
    queryKey
  }: QueryFunctionContext<
    ReturnType<typeof getExternalWalletBalanceQueryKey>
  >) => {
    const [_ignored, { walletAddress, mint }] = queryKey
    const { audiusSdk, reportToSentry, tokens } = context
    try {
      const sdk = await audiusSdk()
      const connection = sdk.services.solanaClient.connection
      const walletPublicKey = new PublicKey(walletAddress)

      // Find token info by mint address
      const tokenInfo = findTokenByAddress(tokens, mint)
      // Handle SOL as special case (since not using any token account address)
      if (mint === TOKEN_LISTING_MAP.SOL.address) {
        const solBalance = await connection.getBalance(walletPublicKey) 
        return {
          balance: new FixedDecimal(solBalance.toString()),
          name: TOKEN_LISTING_MAP.SOL.name,
          symbol: `$${TOKEN_LISTING_MAP.SOL.symbol}`,
          decimals: TOKEN_LISTING_MAP.SOL.decimals,
          address: TOKEN_LISTING_MAP.SOL.address,
          logoURI: TOKEN_LISTING_MAP.SOL.logoURI,
          isStablecoin: false
        }
      }

      // Handle SPL tokens (need token account)
      let tokenBalance = BigInt(0)
      let tokenDecimals = 6 // default
      let tokenName = 'Unknown Token'
      let tokenSymbol = 'UNKNOWN'
      let tokenLogoURI = ''
      let isStablecoin = false

      // Use token info if found
      if (tokenInfo) {
        tokenDecimals = tokenInfo.decimals
        tokenName = tokenInfo.name
        tokenSymbol = tokenInfo.symbol
        tokenLogoURI = tokenInfo.logoURI ?? ''
        isStablecoin = tokenInfo.isStablecoin ?? false
      }

      try {
        const mintPublicKey = new PublicKey(mint)
        const tokenAccountAddress = getAssociatedTokenAddressSync(
          mintPublicKey,
          walletPublicKey,
          true // allowOwnerOffCurve
        )

        const tokenAccount = await getAccount(connection, tokenAccountAddress)

        tokenBalance = tokenAccount.amount
        console.log(tokenBalance, tokenDecimals, {
          FixedDecimal: new FixedDecimal(tokenBalance.toString(), tokenDecimals)
        })
      } catch (e) {
        // If the token account doesn't exist, balance is 0
        if (e instanceof TokenAccountNotFoundError) {
          tokenBalance = BigInt(0)
        } else {
          console.error(`Error fetching token balance for ${mint}:`, e)
          tokenBalance = BigInt(0)
        }
      }

      return {
        balance: new FixedDecimal(tokenBalance, tokenDecimals),
        name: tokenName,
        symbol: tokenSymbol,
        decimals: tokenDecimals,
        address: mint,
        logoURI: tokenLogoURI,
        isStablecoin
      }
    } catch (error) {
      reportToSentry({
        error: toErrorWithMessage(error),
        name: 'ExternalWalletBalanceFetchError',
        feature: Feature.TanQuery,
        additionalInfo: { walletAddress, mint }
      })
      throw error
    }
  }

/**
 * Helper function to get the query options for fetching external wallet token balances.
 * Useful for getting the query key tagged with the data type stored in the cache.
 */
const getExternalWalletBalanceOptions = (
  context: FetchExternalWalletBalanceContext,
  { walletAddress, mint }: UseExternalWalletBalanceParams
) => {
  return queryOptions({
    queryKey: getExternalWalletBalanceQueryKey({ walletAddress, mint }),
    queryFn: getExternalWalletBalanceQueryFn(context)
  })
}

/**
 * Query function for getting token balance for an external wallet based on the provided mint address.
 */
export const useExternalWalletBalance = (
  {
    walletAddress,
    mint
  }: { walletAddress: string | undefined; mint: string | undefined },
  options?: QueryOptions
) => {
  const context = useQueryContext()
  const { tokens } = useTokens()

  return useQuery({
    ...options,
    ...getExternalWalletBalanceOptions(
      { ...context, tokens },
      {
        walletAddress: walletAddress!,
        mint: mint!
      }
    ),
    enabled: options?.enabled !== false && !!walletAddress && !!mint
  })
}
