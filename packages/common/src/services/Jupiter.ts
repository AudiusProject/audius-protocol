import { FixedDecimal } from '@audius/fixed-decimal'
import {
  createJupiterApiClient,
  Instruction,
  QuoteResponse,
  SwapMode
} from '@jup-ag/api'
import { PublicKey, TransactionInstruction } from '@solana/web3.js'

import { TOKEN_LISTING_MAP } from '~/store/ui/buy-audio/constants'
import { convertBigIntToAmountObject, removeNullable } from '~/utils'

/**
 * The error that gets returned if the slippage is exceeded
 * @see https://github.com/jup-ag/jupiter-cpi/blob/5eb897736d294767200302efd070b16343d8c618/idl.json#L2910-L2913
 * @see https://station.jup.ag/docs/additional-topics/troubleshooting#swap-execution
 */
export const SLIPPAGE_TOLERANCE_EXCEEDED_ERROR = 6001

// Define JupiterTokenSymbol type here since we can't import it directly
export type JupiterTokenSymbol = keyof typeof TOKEN_LISTING_MAP

let _jup: ReturnType<typeof createJupiterApiClient>

const initJupiter = () => {
  try {
    return createJupiterApiClient()
  } catch (e) {
    console.error('Jupiter failed to initialize', e)
    throw e
  }
}

const getInstance = () => {
  if (!_jup) {
    _jup = initJupiter()
  }
  return _jup
}

export const jupiterInstance = getInstance()

/**
 * Helper function to find a token by its mint address
 */
const findTokenByMint = (mintAddress: string) => {
  return Object.values(TOKEN_LISTING_MAP).find(
    (token) => token.address === mintAddress
  )
}

export type JupiterQuoteParams = {
  inputTokenSymbol: JupiterTokenSymbol
  outputTokenSymbol: JupiterTokenSymbol
  inputAmount: number
  slippageBps: number
  swapMode?: SwapMode
  onlyDirectRoutes?: boolean
}

// Add support for mint-based parameters for the useSwapTokens hook
export type JupiterMintQuoteParams = {
  inputMint: string
  outputMint: string
  amountUi: number
  slippageBps: number
  swapMode?: SwapMode
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

const DEFAULT_DECIMALS = 9

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
  const inputToken = findTokenByMint(inputMint)
  const outputToken = findTokenByMint(outputMint)

  // Default to 9 decimals if tokens aren't found (fallback for safety)
  const inputDecimals = inputToken?.decimals ?? DEFAULT_DECIMALS
  const outputDecimals = outputToken?.decimals ?? DEFAULT_DECIMALS

  const amount =
    swapMode === 'ExactIn'
      ? Number(new FixedDecimal(amountUi, inputDecimals).value.toString())
      : Number(new FixedDecimal(amountUi, outputDecimals).value.toString())

  const quote = await jupiterInstance.quoteGet({
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
 * Converts an array of Jupiter instructions to Solana TransactionInstructions
 * Filters out undefined instructions and handles the conversion
 */
export const convertJupiterInstructions = (
  instructions: (Instruction | undefined)[]
): TransactionInstruction[] => {
  // Flatten and filter out undefined instructions
  const filteredInstructions = instructions.filter(removeNullable)

  // Convert to Solana TransactionInstruction format
  return filteredInstructions.map((i) => {
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
}
