import { FirstBuyQuoteResponse } from '@audius/sdk'
import {
  createJupiterApiClient,
  QuoteResponse,
  SwapApi as JupiterApi
} from '@jup-ag/api'
import {
  DynamicBondingCurveClient,
  PoolConfig,
  SwapMode,
  VirtualPool
} from '@meteora-ag/dynamic-bonding-curve-sdk'
import BN from 'bn.js'
import { Request, Response } from 'express'

import { logger } from '../../logger'
import { getConnection } from '../../utils/connections'

import { AUDIO_MINT, QUOTE_POOL_MINT_ADDRESS, USDC_MINT } from './constants'

/**
 * Gets a Jupiter swap quote to determine the USDC value of the given AUDIO amount
 */
const getAudioToUSDCQuote = async (
  jupiterApi: JupiterApi,
  audioAmount: string
): Promise<QuoteResponse> => {
  return await jupiterApi.quoteGet({
    inputMint: AUDIO_MINT,
    outputMint: USDC_MINT,
    amount: new BN(audioAmount).toNumber(),
    swapMode: 'ExactIn',
    onlyDirectRoutes: false,
    dynamicSlippage: true
  })
}

/**
 * Gets a quote for a buy off the bonding curve using the given pool config
 */
const getBondingCurveQuote = async ({
  dbcClient,
  audioAmount,
  tokenAmount,
  virtualPoolState,
  poolConfigState
}: {
  dbcClient: DynamicBondingCurveClient
  audioAmount?: BN
  tokenAmount?: BN
  virtualPoolState: VirtualPool
  poolConfigState: PoolConfig
}) => {
  if (audioAmount) {
    const quote = await dbcClient.pool.swapQuote({
      virtualPool: virtualPoolState,
      config: poolConfigState,
      swapBaseForQuote: false,
      amountIn: audioAmount,
      hasReferral: false,
      currentPoint: new BN(0)
    })
    return quote.outputAmount.toString()
  } else if (tokenAmount) {
    // Swap quote 2 has additional params that allows us to specify ExactOut for the swap
    const quote = await dbcClient.pool.swapQuote2({
      virtualPool: virtualPoolState,
      config: poolConfigState,
      swapBaseForQuote: false,
      swapMode: SwapMode.ExactOut,
      amountOut: tokenAmount,
      hasReferral: false,
      currentPoint: new BN(0)
    })

    return quote.maximumAmountIn?.toString()
  } else {
    throw new Error('audioAmount or tokenAmount is required')
  }
}

/**
 *  Gets a quote starting from exact AUDIO input amount
 */
const getQuoteFromAudioInput = async (
  jupiterApi: JupiterApi,
  dbcClient: DynamicBondingCurveClient,
  audioAmount: string,
  virtualPoolState: VirtualPool,
  poolConfigState: PoolConfig
) => {
  // Get AUDIO to USDC quote
  const audioToUsdcQuote = await getAudioToUSDCQuote(jupiterApi, audioAmount)

  // Use the AUDIO amount from the jupiter quote to get a quote for tokens out of the bonding curve
  const audioToTokensQuote = await getBondingCurveQuote({
    dbcClient,
    audioAmount: new BN(audioAmount),
    virtualPoolState,
    poolConfigState
  })
  return {
    usdcValue: audioToUsdcQuote.outAmount,
    audioInputAmount: audioAmount,
    tokenOutputAmount: audioToTokensQuote
  }
}

/**
 *  Gets a quote starting from exact token output amount
 */
const getQuoteFromTokenOutput = async (
  jupiterApi: JupiterApi,
  dbcClient: DynamicBondingCurveClient,
  tokenAmount: string,
  virtualPoolState: VirtualPool,
  poolConfigState: PoolConfig
) => {
  // Get AUDIO to TOKEN quote
  const audioAmount = await getBondingCurveQuote({
    dbcClient,
    tokenAmount: new BN(tokenAmount),
    virtualPoolState,
    poolConfigState
  })

  const usdcValue = await getAudioToUSDCQuote(jupiterApi, audioAmount!)

  return {
    usdcValue: usdcValue.outAmount,
    audioInputAmount: audioAmount,
    tokenOutputAmount: tokenAmount
  }
}

// Endpoint logic
export const firstBuyQuote = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { audioInputAmount, tokenOutputAmount } = req.query

    if (!audioInputAmount && !tokenOutputAmount) {
      res.status(400).json({
        error: 'audioInputAmount or tokenOutputAmount is required'
      })
      return
    }

    if (audioInputAmount && typeof audioInputAmount !== 'string') {
      res.status(400).json({
        error:
          'audioInputAmount is required and must be a string representing the amount in 8 digit waudio decimals'
      })
      return
    }

    if (tokenOutputAmount && typeof tokenOutputAmount !== 'string') {
      res.status(400).json({
        error:
          'tokenOutputAmount is required and must be a string representing the amount in standard 9 decimal format'
      })
      return
    }

    // Solana connections
    const connection = getConnection()
    const dbcClient = new DynamicBondingCurveClient(connection, 'confirmed')
    const jupiterApi = createJupiterApiClient()
    const {
      virtualPoolState,
      poolConfigState,
      maxAudioInputAmount,
      maxTokenOutputAmount
    } = await getLaunchpadConfig(dbcClient)

    // Handle AUDIO -> token quote
    if (audioInputAmount && audioInputAmount) {
      const audioInputOrMax = new BN(audioInputAmount).gt(
        new BN(maxAudioInputAmount)
      )
        ? maxAudioInputAmount
        : audioInputAmount
      const quoteFromAudioData = await getQuoteFromAudioInput(
        jupiterApi,
        dbcClient,
        audioInputOrMax,
        virtualPoolState,
        poolConfigState
      )
      res.status(200).send({
        ...quoteFromAudioData,
        maxAudioInputAmount,
        maxTokenOutputAmount
      } as FirstBuyQuoteResponse)
    }

    // Handle token -> AUDIO quote
    if (tokenOutputAmount && tokenOutputAmount) {
      const quoteFromTokenData = await getQuoteFromTokenOutput(
        jupiterApi,
        dbcClient,
        tokenOutputAmount,
        virtualPoolState,
        poolConfigState
      )
      res.status(200).send({
        ...quoteFromTokenData,
        maxAudioInputAmount,
        maxTokenOutputAmount
      } as FirstBuyQuoteResponse)
    }
  } catch (error) {
    logger.error(error)
    res.status(500).json({
      error: 'Failed to get first buy quote',
      details: error instanceof Error ? error.message : 'Unknown error'
    })
  }
}

const getLaunchpadConfig = async (dbcClient: DynamicBondingCurveClient) => {
  // TODO: make a true mock virtual pool instead of building off a live pool
  const existingPool = await dbcClient.state.getPool(QUOTE_POOL_MINT_ADDRESS)
  const poolConfigState = await dbcClient.state.getPoolConfig(
    existingPool.config
  )

  const virtualPoolState = {
    ...existingPool,
    sqrtPrice: poolConfigState.sqrtStartPrice // in order to set our curve back to absolute 0 we reset the sqrt to the initial sqrt price
  }
  const maxAudioInputAmount = poolConfigState.migrationQuoteThreshold
    .muln(100)
    .divn(99)
    .toString()
  const maxTokenOutputAmount = poolConfigState.swapBaseAmount.toString()
  return {
    virtualPoolState,
    poolConfigState,
    maxAudioInputAmount,
    maxTokenOutputAmount,
    sqrtStartPrice: poolConfigState.sqrtStartPrice
  }
}

export const getLaunchpadConfigRoute = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    // Solana connections
    const connection = getConnection()
    const dbcClient = new DynamicBondingCurveClient(connection, 'confirmed')
    const { maxAudioInputAmount, maxTokenOutputAmount } =
      await getLaunchpadConfig(dbcClient)

    res.status(200).send({
      maxAudioInputAmount,
      maxTokenOutputAmount
    })
  } catch (e) {
    res.status(500).send()
  }
}
