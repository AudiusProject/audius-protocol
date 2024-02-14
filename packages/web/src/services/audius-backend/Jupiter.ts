import { TOKEN_LISTING_MAP, JupiterTokenSymbol } from '@audius/common/store'
import { convertBigIntToAmountObject } from '@audius/common/utils'
import { TransactionHandler } from '@audius/sdk/dist/core'
import { createJupiterApiClient, Instruction, QuoteResponse } from '@jup-ag/api'
import { PublicKey, TransactionInstruction } from '@solana/web3.js'

let _jup: ReturnType<typeof createJupiterApiClient>

const ERROR_CODE_INSUFFICIENT_FUNDS = 1 // Error code for when the swap fails due to insufficient funds in the wallet
const ERROR_CODE_SLIPPAGE = 6000 // Error code for when the swap fails due to specified slippage being exceeded

const getInstance = () => {
  if (!_jup) {
    _jup = initJupiter()
  }
  return _jup
}

const initJupiter = () => {
  try {
    return createJupiterApiClient()
  } catch (e) {
    console.error('Jupiter failed to initialize', e)
    throw e
  }
}

export type JupiterSwapMode = 'ExactIn' | 'ExactOut'

/**
 * Gets a quote from Jupiter for an exchange from inputTokenSymbol => outputTokenSymbol
 * @returns the best quote including the RouteInfo
 */
const getQuote = async ({
  inputTokenSymbol,
  outputTokenSymbol,
  inputAmount,
  slippage,
  swapMode = 'ExactIn',
  onlyDirectRoutes = false
}: {
  inputTokenSymbol: JupiterTokenSymbol
  outputTokenSymbol: JupiterTokenSymbol
  inputAmount: number
  slippage: number
  swapMode?: JupiterSwapMode
  onlyDirectRoutes?: boolean
}) => {
  const inputToken = TOKEN_LISTING_MAP[inputTokenSymbol]
  const outputToken = TOKEN_LISTING_MAP[outputTokenSymbol]
  if (!inputToken || !outputToken) {
    throw new Error(
      `Tokens not found: ${inputTokenSymbol} => ${outputTokenSymbol}`
    )
  }
  const amount =
    swapMode === 'ExactIn'
      ? Math.ceil(inputAmount * 10 ** inputToken.decimals)
      : Math.floor(inputAmount * 10 ** outputToken.decimals)
  const jup = getInstance()
  const quote = await jup.quoteGet({
    inputMint: inputToken.address,
    outputMint: outputToken.address,
    amount,
    slippageBps: slippage,
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
    quote,
    inputTokenSymbol,
    outputTokenSymbol
  }
}

const getSwapInstructions = async ({
  quote,
  userPublicKey,
  destinationTokenAccount,
  wrapAndUnwrapSol = true,
  useSharedAccounts = true
}: {
  quote: QuoteResponse
  userPublicKey: PublicKey
  destinationTokenAccount?: PublicKey
  wrapAndUnwrapSol?: boolean
  useSharedAccounts?: boolean
}) => {
  const jup = getInstance()
  const response = await jup.swapInstructionsPost({
    swapRequest: {
      quoteResponse: quote,
      userPublicKey: userPublicKey.toString(),
      destinationTokenAccount: destinationTokenAccount?.toString(),
      wrapAndUnwrapSol,
      useSharedAccounts
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
  const instructionsFlattened = [
    tokenLedgerInstruction,
    ...computeBudgetInstructions,
    ...setupInstructions,
    swapInstruction,
    cleanupInstruction
  ]
    .filter((i): i is Instruction => i !== undefined)
    .map((i) => {
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
    instructions: instructionsFlattened,
    response,
    lookupTableAddresses: addressLookupTableAddresses
  }
}

export const parseInstruction = (instruction: Instruction) => {
  return new TransactionInstruction({
    programId: new PublicKey(instruction.programId),
    keys: instruction.accounts.map((a) => ({
      pubkey: new PublicKey(a.pubkey),
      isSigner: a.isSigner,
      isWritable: a.isWritable
    })),
    data: Buffer.from(instruction.data, 'base64')
  })
}

async function _sendTransaction({
  name,
  instructions,
  feePayer,
  transactionHandler,
  lookupTableAddresses,
  signatures,
  recentBlockhash
}: {
  name: string
  instructions: TransactionInstruction[]
  feePayer: PublicKey
  transactionHandler: TransactionHandler
  lookupTableAddresses: string[]
  signatures?: { publicKey: string; signature: Buffer }[]
  recentBlockhash?: string
}) {
  console.debug(`Exchange: starting ${name} transaction...`)
  const result = await transactionHandler.handleTransaction({
    instructions,
    feePayerOverride: feePayer,
    skipPreflight: true,
    lookupTableAddresses,
    signatures,
    recentBlockhash,
    errorMapping: {
      fromErrorCode: (errorCode) => {
        if (errorCode === ERROR_CODE_SLIPPAGE) {
          return 'Slippage threshold exceeded'
        } else if (errorCode === ERROR_CODE_INSUFFICIENT_FUNDS) {
          return 'Insufficient funds'
        }
        return `Error Code: ${errorCode}`
      }
    }
  })
  if (result.error) {
    console.debug(
      `Exchange: ${name} instructions stringified:`,
      JSON.stringify(instructions)
    )
    throw new Error(`${name} transaction failed: ${result.error}`)
  }
  console.debug(`Exchange: ${name} transaction... success txid: ${result.res}`)
  return result
}

const executeExchange = async ({
  instructions,
  feePayer,
  transactionHandler,
  lookupTableAddresses = [],
  signatures
}: {
  instructions: TransactionInstruction[]
  feePayer: PublicKey
  transactionHandler: TransactionHandler
  lookupTableAddresses?: string[]
  signatures?: { publicKey: string; signature: Buffer }[]
}) => {
  const { res: txId } = await _sendTransaction({
    name: 'Swap',
    instructions,
    feePayer,
    transactionHandler,
    lookupTableAddresses,
    signatures
  })
  return txId
}

export const JupiterSingleton = {
  getQuote,
  getSwapInstructions,
  executeExchange
}
