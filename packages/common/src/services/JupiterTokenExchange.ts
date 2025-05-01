import { createJupiterApiClient, QuoteResponse, Instruction } from '@jup-ag/api'
import { PublicKey, TransactionInstruction } from '@solana/web3.js'

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

// Add support for mint-based parameters for the useSwapTokens hook
export type JupiterMintQuoteParams = {
  inputMint: string
  outputMint: string
  amountUi: number
  slippageBps: number
  swapMode?: 'ExactIn' | 'ExactOut'
  onlyDirectRoutes?: boolean
}

export const SLIPPAGE_TOLERANCE_EXCEEDED_ERROR = 'Slippage tolerance exceeded'

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

/**
 * Gets a quote from Jupiter using mint addresses directly
 * This version is used by the useSwapTokens hook
 */
export const getJupiterQuoteByMint = async ({
  inputMint,
  outputMint,
  amountUi,
  slippageBps,
  swapMode = 'ExactIn',
  onlyDirectRoutes = false
}: JupiterMintQuoteParams): Promise<JupiterQuoteResult> => {
  // Get quote from Jupiter
  const jupiter = getJupiterClient()

  // Look up token decimals from TOKEN_LISTING_MAP
  // We'll find tokens by their address to get the correct decimals
  const inputToken = Object.values(TOKEN_LISTING_MAP).find(
    (token) => token.address === inputMint
  )
  const outputToken = Object.values(TOKEN_LISTING_MAP).find(
    (token) => token.address === outputMint
  )

  // Default to 9 decimals if tokens aren't found (fallback for safety)
  const inputDecimals = inputToken?.decimals ?? 9
  const outputDecimals = outputToken?.decimals ?? 9

  const amount =
    swapMode === 'ExactIn'
      ? Math.ceil(amountUi * 10 ** inputDecimals)
      : Math.floor(amountUi * 10 ** outputDecimals)

  const quote = await jupiter.quoteGet({
    inputMint,
    outputMint,
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
      inputDecimals
    ),
    outputAmount: convertBigIntToAmountObject(
      BigInt(quote.outAmount),
      outputDecimals
    ),
    otherAmountThreshold: convertBigIntToAmountObject(
      BigInt(quote.otherAmountThreshold),
      swapMode === 'ExactIn' ? outputDecimals : inputDecimals
    ),
    quote
  }
}

/**
 * Gets swap instructions from Jupiter for executing a token swap
 * Converts raw Jupiter instructions to Solana TransactionInstructions
 */
export const getSwapInstructions = async ({
  quote,
  userPublicKey,
  wrapAndUnwrapSol = true
}: {
  quote: QuoteResponse
  userPublicKey: string
  wrapAndUnwrapSol?: boolean
}) => {
  const jupiter = getJupiterClient()
  const response = await jupiter.swapInstructionsPost({
    swapRequest: {
      quoteResponse: quote,
      userPublicKey,
      wrapAndUnwrapSol,
      computeUnitPriceMicroLamports: 100000,
      useSharedAccounts: true
    }
  })

  const {
    tokenLedgerInstruction,
    computeBudgetInstructions,
    setupInstructions,
    swapInstruction,
    cleanupInstruction,
    addressLookupTableAddresses
  } = response

  // Flatten and filter out undefined instructions
  const instructions = [
    tokenLedgerInstruction,
    ...(computeBudgetInstructions || []),
    ...(setupInstructions || []),
    swapInstruction,
    cleanupInstruction
  ].filter((i): i is Instruction => i !== undefined)

  // Convert to Solana TransactionInstruction format
  const transactionInstructions = instructions.map((i) => {
    return {
      programId: new PublicKey(i.programId),
      data: Buffer.from(i.data, 'base64'),
      keys: i.accounts.map((a) => {
        return {
          pubkey: new PublicKey(a.pubkey),
          isSigner: a.isSigner,
          isWritable: a.isWritable
        }
      })
    } as TransactionInstruction
  })

  return {
    instructions: transactionInstructions,
    lookupTableAddresses: addressLookupTableAddresses || []
  }
}

// Export a singleton for convenient access
export const JupiterTokenExchange = {
  getQuote: getJupiterQuoteByMint,
  getSwapInstructions
}
