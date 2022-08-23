import {
  JupiterTokenSymbol,
  TOKEN_LISTING_MAP,
  convertJSBIToAmountObject
} from '@audius/common'
import type { Jupiter as JupiterInstance } from '@jup-ag/core'
import { Cluster, Connection, PublicKey } from '@solana/web3.js'
import JSBI from 'jsbi'

let _jup: JupiterInstance

const SOLANA_CLUSTER_ENDPOINT = process.env.REACT_APP_SOLANA_CLUSTER_ENDPOINT
const SOLANA_CLUSTER = process.env.REACT_APP_SOLANA_WEB3_CLUSTER

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
  slippage
}: {
  inputTokenSymbol: JupiterTokenSymbol
  outputTokenSymbol: JupiterTokenSymbol
  inputAmount: number
  forceFetch?: boolean
  slippage: number
}) => {
  const inputToken = TOKEN_LISTING_MAP[inputTokenSymbol]
  const outputToken = TOKEN_LISTING_MAP[outputTokenSymbol]
  const amount = JSBI.BigInt(Math.ceil(inputAmount * 10 ** inputToken.decimals))
  if (!inputToken || !outputToken) {
    throw new Error(
      `Tokens not found: ${inputTokenSymbol} => ${outputTokenSymbol}`
    )
  }
  const jup = await getInstance()
  const { SwapMode } = await import('@jup-ag/core')
  const routes = await jup.computeRoutes({
    inputMint: new PublicKey(inputToken.address),
    outputMint: new PublicKey(outputToken.address),
    amount,
    slippage,
    swapMode: SwapMode.ExactIn,
    forceFetch
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

export const JupiterSingleton = {
  getQuote,
  exchange
}
