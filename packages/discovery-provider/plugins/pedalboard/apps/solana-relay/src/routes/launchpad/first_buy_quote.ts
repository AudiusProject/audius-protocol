import { FirstBuyQuoteResponse } from '@audius/sdk'
import {
  createJupiterApiClient,
  QuoteResponse,
  SwapApi as JupiterApi
} from '@jup-ag/api'
import {
  ActivationType,
  BaseFeeMode,
  CollectFeeMode,
  DammV2DynamicFeeMode,
  DynamicBondingCurveClient,
  FeeMode,
  MigrationFeeOption,
  MigrationOption,
  SwapMode,
  TokenDecimal,
  TokenType,
  TokenUpdateAuthorityOption,
  buildCurve
} from '@meteora-ag/dynamic-bonding-curve-sdk'
import { PublicKey } from '@solana/web3.js'
import BN from 'bn.js'
import { Request, Response } from 'express'

import { logger } from '../../logger'
import { getConnection } from '../../utils/connections'

import { AUDIO_MINT, QUOTE_POOL_MINT_ADDRESS, USDC_MINT } from './constants'

const STARTING_SQRT_PRICE = new BN('18446744073709552')

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
 * Gets a quote for a buy off the bonding curve.
 * It uses an existing test pool to get the bonding curve config.
 * It doesnt matter what pool we use since they all have the same bonding curve config & we're specifying point 0 for our quote
 * @param dbcClient
 * @param audioAmount
 * @returns
 */
const getBondingCurveQuote = async ({
  dbcClient,
  audioAmount,
  tokenAmount
}: {
  dbcClient: DynamicBondingCurveClient
  audioAmount?: BN
  tokenAmount?: BN
}) => {
  const existingPool = await dbcClient.state.getPool(QUOTE_POOL_MINT_ADDRESS)
  const poolConfigState = await dbcClient.state.getPoolConfig(
    existingPool.config
  )

  const virtualPoolState = {
    ...existingPool,
    sqrtPrice: STARTING_SQRT_PRICE // in order to set our curve back to absolute 0 we reset the sqrt to the initial sqrt price
  }

  if (audioAmount) {
    const quote = await dbcClient.pool.swapQuote({
      virtualPool: virtualPoolState as any,
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
      virtualPool: virtualPoolState as any,
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

const getQuoteFromAudioInput = async (
  jupiterApi: JupiterApi,
  dbcClient: DynamicBondingCurveClient,
  audioAmount: string
) => {
  // Get SOL to AUDIO quote
  const audioToUsdcQuote = await getAudioToUSDCQuote(jupiterApi, audioAmount)

  // Use the AUDIO amount from the jupiter quote to get a quote for tokens out of the bonding curve
  const audioToTokensQuote = await getBondingCurveQuote({
    dbcClient,
    audioAmount: new BN(audioAmount)
  })
  return {
    usdcValue: audioToUsdcQuote.outAmount,
    audioInputAmount: audioAmount,
    tokenOutputAmount: audioToTokensQuote
  }
}

const getQuoteFromTokenOutput = async (
  jupiterApi: JupiterApi,
  dbcClient: DynamicBondingCurveClient,
  tokenAmount: string
) => {
  // Get AUDIO to TOKEN quote
  const audioAmount = await getBondingCurveQuote({
    dbcClient,
    tokenAmount: new BN(tokenAmount)
  })

  const usdcValue = await getAudioToUSDCQuote(jupiterApi, audioAmount!)

  return {
    usdcValue: usdcValue.outAmount,
    audioInputAmount: audioAmount,
    tokenOutputAmount: tokenAmount
  }
}

export const firstBuyQuote = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { audioInputAmount, tokenOutputAmount } = req.query

    if (!audioInputAmount && !tokenOutputAmount) {
      res.status(400).json({
        error: 'solAmount or tokenAmount is required'
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

    // Handle SOL -> token quote
    if (audioInputAmount && audioInputAmount) {
      const quoteFromAudioData = await getQuoteFromAudioInput(
        jupiterApi,
        dbcClient,
        audioInputAmount
      )
      res.status(200).send(quoteFromAudioData as FirstBuyQuoteResponse)
    }

    // Handle token -> SOL quote
    if (tokenOutputAmount && tokenOutputAmount) {
      const quoteFromTokenData = await getQuoteFromTokenOutput(
        jupiterApi,
        dbcClient,
        tokenOutputAmount
      )
      res.status(200).send(quoteFromTokenData as FirstBuyQuoteResponse)
    }
  } catch (error) {
    logger.error(error)
    res.status(500).json({
      error: 'Failed to get first buy quote',
      details: error instanceof Error ? error.message : 'Unknown error'
    })
  }
}
