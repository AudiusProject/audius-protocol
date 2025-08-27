import { useMemo } from 'react'

import { QuoteResponse, SwapMode } from '@jup-ag/api'
import { useQuery } from '@tanstack/react-query'

import { getJupiterQuoteByMint, MAX_ALLOWED_ACCOUNTS } from '~/services/Jupiter'
import { TOKEN_LISTING_MAP } from '~/store/ui/shared/tokenConstants'

import { QUERY_KEYS } from '../queryKeys'
import { QueryOptions, type QueryKey } from '../types'

// AUDIO mint address for use as intermediary token in double swaps
const AUDIO_MINT = TOKEN_LISTING_MAP.AUDIO.address
const AUDIO_DECIMALS = TOKEN_LISTING_MAP.AUDIO.decimals

export type TokenExchangeRateParams = {
  inputMint: string
  outputMint: string
  inputDecimals: number
  outputDecimals: number
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

/**
 * Gets a direct quote between two tokens
 */
export const getDirectQuote = async (params: {
  inputMint: string
  outputMint: string
  inputDecimals: number
  outputDecimals: number
  amountUi: number
  swapMode?: SwapMode
}): Promise<TokenExchangeRateResponse> => {
  const quoteResult = await getJupiterQuoteByMint({
    inputMint: params.inputMint,
    outputMint: params.outputMint,
    inputDecimals: params.inputDecimals,
    outputDecimals: params.outputDecimals,
    amountUi: params.amountUi,
    slippageBps: SLIPPAGE_BPS,
    swapMode: params.swapMode ?? 'ExactIn',
    onlyDirectRoutes: false,
    maxAccounts: MAX_ALLOWED_ACCOUNTS
  })

  // Calculate exchange rate (how many output tokens per 1 input token)
  const rate =
    quoteResult.outputAmount.uiAmount / quoteResult.inputAmount.uiAmount

  // Calculate price impact percentage
  const priceImpactPct: number =
    quoteResult.quote.priceImpactPct !== undefined
      ? Number(quoteResult.quote.priceImpactPct)
      : 0

  return {
    rate,
    inputAmount: {
      amount: quoteResult.inputAmount.amount,
      uiAmount: quoteResult.inputAmount.uiAmount
    },
    outputAmount: {
      amount: quoteResult.outputAmount.amount,
      uiAmount: quoteResult.outputAmount.uiAmount
    },
    priceImpactPct,
    quote: quoteResult.quote
  }
}

/**
 * Gets an indirect quote via AUDIO token when direct route is not available
 */
export const getIndirectQuoteViaAudio = async (params: {
  inputMint: string
  outputMint: string
  inputDecimals: number
  outputDecimals: number
  amountUi: number
  swapMode?: SwapMode
}): Promise<TokenExchangeRateResponse> => {
  // Get first quote: InputToken -> AUDIO
  const firstQuote = await getJupiterQuoteByMint({
    inputMint: params.inputMint,
    outputMint: AUDIO_MINT,
    inputDecimals: params.inputDecimals,
    outputDecimals: AUDIO_DECIMALS,
    amountUi: params.amountUi,
    slippageBps: SLIPPAGE_BPS,
    swapMode: params.swapMode ?? 'ExactIn',
    onlyDirectRoutes: false,
    maxAccounts: MAX_ALLOWED_ACCOUNTS
  })

  // Get second quote: AUDIO -> OutputToken
  const secondQuote = await getJupiterQuoteByMint({
    inputMint: AUDIO_MINT,
    outputMint: params.outputMint,
    inputDecimals: AUDIO_DECIMALS,
    outputDecimals: params.outputDecimals,
    amountUi: firstQuote.outputAmount.uiAmount,
    slippageBps: SLIPPAGE_BPS,
    swapMode: params.swapMode ?? 'ExactIn',
    onlyDirectRoutes: false,
    maxAccounts: MAX_ALLOWED_ACCOUNTS
  })

  // Calculate combined exchange rate
  const rate =
    secondQuote.outputAmount.uiAmount / firstQuote.inputAmount.uiAmount

  // Combine price impacts (additive approximation)
  const firstPriceImpact = Number(firstQuote.quote.priceImpactPct ?? 0)
  const secondPriceImpact = Number(secondQuote.quote.priceImpactPct ?? 0)
  const combinedPriceImpact: number = firstPriceImpact + secondPriceImpact

  return {
    rate,
    inputAmount: {
      amount: firstQuote.inputAmount.amount,
      uiAmount: firstQuote.inputAmount.uiAmount
    },
    outputAmount: {
      amount: secondQuote.outputAmount.amount,
      uiAmount: secondQuote.outputAmount.uiAmount
    },
    priceImpactPct: combinedPriceImpact,
    quote: secondQuote.quote // Use the final quote for transaction purposes
  }
}

// Define exchange rate query key
export const getTokenExchangeRateQueryKey = ({
  inputMint,
  outputMint,
  inputDecimals,
  outputDecimals,
  inputAmount,
  swapMode
}: TokenExchangeRateParams) =>
  [
    QUERY_KEYS.tokenExchangeRate,
    inputMint,
    outputMint,
    inputDecimals,
    outputDecimals,
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
      inputMint: params.inputMint,
      outputMint: params.outputMint,
      inputDecimals: params.inputDecimals,
      outputDecimals: params.outputDecimals,
      inputAmount: safeInputAmount,
      swapMode: params.swapMode
    }),
    queryFn: async () => {
      try {
        // Try direct route first
        return await getDirectQuote({
          inputMint: params.inputMint,
          outputMint: params.outputMint,
          inputDecimals: params.inputDecimals,
          outputDecimals: params.outputDecimals,
          amountUi: safeInputAmount,
          swapMode: params.swapMode
        })
      } catch (directError) {
        // Direct route failed, try indirect route via AUDIO
        try {
          return await getIndirectQuoteViaAudio({
            inputMint: params.inputMint,
            outputMint: params.outputMint,
            inputDecimals: params.inputDecimals,
            outputDecimals: params.outputDecimals,
            amountUi: safeInputAmount,
            swapMode: params.swapMode
          })
        } catch (indirectError) {
          console.error('Both direct and indirect routes failed:', {
            directError,
            indirectError
          })
          throw indirectError
        }
      }
    },
    ...options
  })
}
