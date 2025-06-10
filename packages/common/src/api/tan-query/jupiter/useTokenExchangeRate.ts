import { useMemo } from 'react'

import { QuoteResponse, SwapMode } from '@jup-ag/api'
import { useQuery } from '@tanstack/react-query'

import { JupiterTokenSymbol, getJupiterQuoteByMint } from '~/services/Jupiter'
import { TOKEN_LISTING_MAP } from '~/store/ui/buy-audio/constants'

import { QueryOptions, type QueryKey } from '../types'

export type TokenExchangeRateParams = {
  inputTokenSymbol: JupiterTokenSymbol
  outputTokenSymbol: JupiterTokenSymbol
  inputAmount?: number
  swapMode?: SwapMode
}

export type TokenExchangeRateResponse = {
  rate: number
  inputAmount: {
    amount: number
    uiAmount: number
  }
  outputAmount: {
    amount: number
    uiAmount: number
  }
  priceImpactPct: number
  quote: QuoteResponse
}

// Default slippage is 50 basis points (0.5%)
export const SLIPPAGE_BPS = 50

// Maximum safe amount for exchange rate queries to prevent API errors
// This corresponds to 1 trillion tokens, which is well above any realistic amount
const MAX_SAFE_EXCHANGE_RATE_AMOUNT = 1000000000000

// Define exchange rate query key
export const getTokenExchangeRateQueryKey = ({
  inputTokenSymbol,
  outputTokenSymbol,
  inputAmount,
  swapMode
}: TokenExchangeRateParams) =>
  [
    'tokenExchangeRate',
    inputTokenSymbol,
    outputTokenSymbol,
    inputAmount ?? 1,
    swapMode ?? 'ExactIn'
  ] as unknown as QueryKey<TokenExchangeRateResponse>

/**
 * Hook to get the exchange rate between two tokens using Jupiter
 *
 * @param params Parameters for the token exchange rate query
 * @param options Optional query configuration
 * @returns The exchange rate data
 */
export const useTokenExchangeRate = (
  params: TokenExchangeRateParams,
  options?: QueryOptions
) => {
  // Default to 1 unit of input token if no amount specified
  const inputAmount = params.inputAmount ?? 1

  // Validate input amount to prevent API errors with extremely large numbers
  const safeInputAmount = useMemo(() => {
    if (inputAmount > MAX_SAFE_EXCHANGE_RATE_AMOUNT) {
      console.warn(
        'Exchange rate input amount too large, capping at safe limit:',
        inputAmount
      )
      return MAX_SAFE_EXCHANGE_RATE_AMOUNT
    }
    return inputAmount
  }, [inputAmount])

  return useQuery({
    queryKey: getTokenExchangeRateQueryKey({
      inputTokenSymbol: params.inputTokenSymbol,
      outputTokenSymbol: params.outputTokenSymbol,
      inputAmount: safeInputAmount,
      swapMode: params.swapMode
    }),
    queryFn: async () => {
      try {
        // Get token mint addresses
        const inputToken = TOKEN_LISTING_MAP[params.inputTokenSymbol]
        const outputToken = TOKEN_LISTING_MAP[params.outputTokenSymbol]

        if (!inputToken || !outputToken) {
          throw new Error(
            `Token not found: ${params.inputTokenSymbol} or ${params.outputTokenSymbol}`
          )
        }

        // Get quote from Jupiter using the mint addresses
        const quoteResult = await getJupiterQuoteByMint({
          inputMint: inputToken.address,
          outputMint: outputToken.address,
          amountUi: safeInputAmount,
          slippageBps: SLIPPAGE_BPS,
          swapMode: params.swapMode ?? 'ExactIn',
          onlyDirectRoutes: false
        })

        // Calculate exchange rate (how many output tokens per 1 input token)
        const rate =
          quoteResult.outputAmount.uiAmount / quoteResult.inputAmount.uiAmount

        // Calculate price impact percentage
        const priceImpactPct =
          quoteResult.quote.priceImpactPct !== undefined
            ? quoteResult.quote.priceImpactPct
            : 0

        return {
          rate,
          inputAmount: quoteResult.inputAmount,
          outputAmount: quoteResult.outputAmount,
          priceImpactPct,
          quote: quoteResult.quote
        }
      } catch (error) {
        console.error('Failed to fetch token exchange rate:', error)
        throw error
      }
    },
    ...options
  })
}
