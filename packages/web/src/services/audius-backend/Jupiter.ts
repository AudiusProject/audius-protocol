import {
  JupiterTokenSymbol,
  TOKEN_LISTING_MAP,
  convertBigIntToAmountObject
} from '@audius/common'
import { TransactionHandler } from '@audius/sdk/dist/core'
import { createJupiterApiClient, Instruction, QuoteResponse } from '@jup-ag/api'
import { PublicKey, Transaction, TransactionInstruction } from '@solana/web3.js'

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
    slippageBps: slippage, // make sure slippageBps = slippage
    asLegacyTransaction: true,
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
    quote,
    inputTokenSymbol,
    outputTokenSymbol
  }
}

const getSwapInstructions = async ({
  quote,
  userPublicKey
}: {
  quote: QuoteResponse
  userPublicKey: PublicKey
}) => {
  const jup = getInstance()
  const instructions = await jup.swapInstructionsPost({
    swapRequest: {
      quoteResponse: quote,
      userPublicKey: userPublicKey.toString(),
      asLegacyTransaction: true
    }
  })
  const instructionsFlattened = [
    instructions.tokenLedgerInstruction,
    ...instructions.computeBudgetInstructions,
    ...instructions.setupInstructions,
    instructions.swapInstruction,
    instructions.cleanupInstruction
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
  return instructionsFlattened
}

const getSwapTransaction = async ({
  quote,
  userPublicKey
}: {
  quote: QuoteResponse
  userPublicKey: PublicKey
}) => {
  const jup = getInstance()
  const { swapTransaction } = await jup.swapPost({
    swapRequest: {
      quoteResponse: quote,
      userPublicKey: userPublicKey.toString(),
      asLegacyTransaction: true
    }
  })
  const swapTransactionBuf = Buffer.from(swapTransaction, 'base64')
  const transaction = Transaction.from(swapTransactionBuf)
  return transaction
}

async function _sendTransaction({
  name,
  transaction,
  feePayer,
  transactionHandler
}: {
  name: string
  transaction: Transaction
  feePayer: PublicKey
  transactionHandler: TransactionHandler
}) {
  console.debug(`Exchange: starting ${name} transaction...`)
  const result = await transactionHandler.handleTransaction({
    instructions: transaction.instructions,
    feePayerOverride: feePayer,
    skipPreflight: true,
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
      `Exchange: ${name} transaction stringified:`,
      JSON.stringify(transaction)
    )
    throw new Error(`${name} transaction failed: ${result.error}`)
  }
  console.debug(`Exchange: ${name} transaction... success txid: ${result.res}`)
  return result
}

const executeExchange = async ({
  transaction,
  feePayer,
  transactionHandler
}: {
  transaction: Transaction
  feePayer: PublicKey
  transactionHandler: TransactionHandler
}) => {
  // Wrap this in try/finally to ensure cleanup transaction runs, if applicable
  const { res: txId } = await _sendTransaction({
    name: 'Swap',
    transaction,
    feePayer,
    transactionHandler
  })
  return txId
}

export const JupiterSingleton = {
  getQuote,
  getSwapInstructions,
  getSwapTransaction,
  executeExchange
}
