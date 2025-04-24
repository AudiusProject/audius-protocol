import { createJupiterApiClient, QuoteResponse } from '@jup-ag/api'

import { TOKEN_LISTING_MAP } from '~/store/ui/buy-audio/constants'
import { convertBigIntToAmountObject } from '~/utils'

// Define JupiterTokenSymbol type here since we can't import it directly
export type JupiterTokenSymbol = keyof typeof TOKEN_LISTING_MAP

// Jupiter API client singleton (lazy loaded)
let jupiterClient: ReturnType<typeof createJupiterApiClient> | null = null

export const getJupiterClient = () => {
  if (!jupiterClient) {
    jupiterClient = createJupiterApiClient()
  }
  return jupiterClient
}

export type JupiterQuoteParams = {
  inputTokenSymbol: JupiterTokenSymbol
  outputTokenSymbol: JupiterTokenSymbol
  inputAmount: number
  slippageBps: number
  swapMode?: 'ExactIn' | 'ExactOut'
  onlyDirectRoutes?: boolean
}

export type JupiterQuoteResult = {
  inputAmount: {
    amount: number
    amountString: string
    uiAmount: number
    uiAmountString: string
  }
  outputAmount: {
    amount: number
    amountString: string
    uiAmount: number
    uiAmountString: string
  }
  otherAmountThreshold: {
    amount: number
    amountString: string
    uiAmount: number
    uiAmountString: string
  }
  quote: QuoteResponse
}

/**
 * Gets a quote from Jupiter for an exchange between tokens
 */
export const getJupiterQuote = async ({
  inputTokenSymbol,
  outputTokenSymbol,
  inputAmount,
  slippageBps,
  swapMode = 'ExactIn',
  onlyDirectRoutes = false
}: JupiterQuoteParams): Promise<JupiterQuoteResult> => {
  const inputToken = TOKEN_LISTING_MAP[inputTokenSymbol]
  const outputToken = TOKEN_LISTING_MAP[outputTokenSymbol]

  if (!inputToken || !outputToken) {
    throw new Error(
      `Tokens not found: ${inputTokenSymbol} => ${outputTokenSymbol}`
    )
  }

  // Calculate amount with proper decimal precision
  const amount =
    swapMode === 'ExactIn'
      ? Math.ceil(inputAmount * 10 ** inputToken.decimals)
      : Math.floor(inputAmount * 10 ** outputToken.decimals)

  // Get quote from Jupiter
  const jupiter = getJupiterClient()
  const quote = await jupiter.quoteGet({
    inputMint: inputToken.address,
    outputMint: outputToken.address,
    amount,
    slippageBps,
    swapMode,
    onlyDirectRoutes
  })

  if (!quote) {
    throw new Error('Failed to get Jupiter quote')
  }

  return {
    inputAmount: convertBigIntToAmountObject(
      BigInt(quote.inAmount),
      inputToken.decimals
    ),
    outputAmount: convertBigIntToAmountObject(
      BigInt(quote.outAmount),
      outputToken.decimals
    ),
    otherAmountThreshold: convertBigIntToAmountObject(
      BigInt(quote.otherAmountThreshold),
      swapMode === 'ExactIn' ? outputToken.decimals : inputToken.decimals
    ),
    quote
  }
}
