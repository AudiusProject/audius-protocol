import {
  JupiterTokenSymbol,
  TOKEN_LISTING_MAP,
  convertJSBIToAmountObject
} from '@audius/common'
import { TransactionHandler } from '@audius/sdk/dist/core'
import type { Jupiter as JupiterInstance, SwapMode } from '@jup-ag/core'
import { Cluster, Connection, PublicKey, Transaction } from '@solana/web3.js'
import JSBI from 'jsbi'

let _jup: JupiterInstance

const SOLANA_CLUSTER_ENDPOINT = process.env.REACT_APP_SOLANA_CLUSTER_ENDPOINT
const SOLANA_CLUSTER = process.env.REACT_APP_SOLANA_WEB3_CLUSTER
const ERROR_CODE_INSUFFICIENT_FUNDS = 1 // Error code for when the swap fails due to insufficient funds in the wallet
const ERROR_CODE_SLIPPAGE = 6000 // Error code for when the swap fails due to specified slippage being exceeded

const getInstance = async () => {
  if (!_jup) {
    _jup = await initJupiter()
  }
  return _jup
}

const initJupiter = async () => {
  if (!SOLANA_CLUSTER_ENDPOINT) {
    throw new Error('Solana Cluster Endpoint is not configured')
  }
  const connection = new Connection(SOLANA_CLUSTER_ENDPOINT, 'confirmed')
  const cluster = (SOLANA_CLUSTER ?? 'mainnet-beta') as Cluster
  try {
    const { Jupiter } = await import('@jup-ag/core')
    return Jupiter.load({
      connection,
      cluster,
      restrictIntermediateTokens: true,
      wrapUnwrapSOL: true,
      routeCacheDuration: 5_000 // 5 seconds
    })
  } catch (e) {
    console.error(
      'Jupiter failed to initialize with RPC',
      connection.rpcEndpoint,
      e
    )
    throw e
  }
}

/**
 * Gets a quote from Jupiter for an exchange from inputTokenSymbol => outputTokenSymbol
 * @returns the best quote including the RouteInfo
 */
const getQuote = async ({
  inputTokenSymbol,
  outputTokenSymbol,
  inputAmount,
  forceFetch,
  slippage,
  swapMode = 'ExactIn' as SwapMode,
  onlyDirectRoutes = false
}: {
  inputTokenSymbol: JupiterTokenSymbol
  outputTokenSymbol: JupiterTokenSymbol
  inputAmount: number
  forceFetch?: boolean
  slippage: number
  swapMode?: SwapMode
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
      ? JSBI.BigInt(Math.ceil(inputAmount * 10 ** inputToken.decimals))
      : JSBI.BigInt(Math.floor(inputAmount * 10 ** outputToken.decimals))
  const jup = await getInstance()
  const routes = await jup.computeRoutes({
    inputMint: new PublicKey(inputToken.address),
    outputMint: new PublicKey(outputToken.address),
    amount,
    slippage,
    swapMode,
    forceFetch,
    onlyDirectRoutes
  })
  const bestRoute = routes.routesInfos[0]

  const resultQuote = {
    inputAmount: convertJSBIToAmountObject(
      bestRoute.inAmount,
      inputToken.decimals
    ),
    outputAmount: convertJSBIToAmountObject(
      bestRoute.outAmount,
      outputToken.decimals
    ),
    route: bestRoute,
    inputTokenSymbol,
    outputTokenSymbol
  }
  return resultQuote
}

const exchange: JupiterInstance['exchange'] = async (exchangeArgs) => {
  const jup = await getInstance()
  return await jup.exchange(exchangeArgs)
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
  setupTransaction,
  swapTransaction,
  cleanupTransaction,
  feePayer,
  transactionHandler
}: {
  setupTransaction?: Transaction
  swapTransaction: Transaction
  cleanupTransaction?: Transaction
  feePayer: PublicKey
  transactionHandler: TransactionHandler
}) => {
  let setupTransactionId: string | null | undefined
  let swapTransactionId: string | null | undefined
  let cleanupTransactionId: string | null | undefined
  if (setupTransaction) {
    const { res } = await _sendTransaction({
      name: 'Setup',
      transaction: setupTransaction,
      feePayer,
      transactionHandler
    })
    setupTransactionId = res
  }
  // Wrap this in try/finally to ensure cleanup transaction runs, if applicable
  try {
    const { res } = await _sendTransaction({
      name: 'Swap',
      transaction: swapTransaction,
      feePayer,
      transactionHandler
    })
    swapTransactionId = res
  } finally {
    if (cleanupTransaction) {
      const { res } = await _sendTransaction({
        name: 'Cleanup',
        transaction: cleanupTransaction,
        feePayer,
        transactionHandler
      })
      cleanupTransactionId = res
    }
  }
  return { setupTransactionId, swapTransactionId, cleanupTransactionId }
}

export const JupiterSingleton = {
  getQuote,
  exchange,
  executeExchange
}
