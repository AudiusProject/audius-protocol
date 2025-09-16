import { FirstBuyQuoteResponse } from '@audius/sdk'
import {
  createJupiterApiClient,
  QuoteResponse,
  SwapApi as JupiterApi
} from '@jup-ag/api'
import {
  DynamicBondingCurveClient,
  SwapMode
} from '@meteora-ag/dynamic-bonding-curve-sdk'
import { NATIVE_MINT as SOL_MINT } from '@solana/spl-token'
import BN from 'bn.js'
import { Request, Response } from 'express'

import { logger } from '../../logger'
import { getConnection } from '../../utils/connections'

import { AUDIO_MINT, QUOTE_POOL_MINT_ADDRESS, USDC_MINT } from './constants'

const getSolToAudioQuote = async (
  jupiterApi: JupiterApi,
  solAmountLamports: string
): Promise<QuoteResponse> => {
  return await jupiterApi.quoteGet({
    inputMint: SOL_MINT.toBase58(),
    outputMint: AUDIO_MINT,
    amount: new BN(solAmountLamports).toNumber(),
    swapMode: 'ExactIn',
    onlyDirectRoutes: false,
    dynamicSlippage: true
  })
}

const getSolToUsdcQuote = async (
  jupiterApi: JupiterApi,
  solAmountLamports: string
): Promise<QuoteResponse> => {
  return await jupiterApi.quoteGet({
    inputMint: SOL_MINT.toBase58(),
    outputMint: USDC_MINT,
    amount: new BN(solAmountLamports).toNumber(),
    swapMode: 'ExactIn',
    onlyDirectRoutes: false,
    dynamicSlippage: true
  })
}

const getAudioToSolQuote = async (
  jupiterApi: JupiterApi,
  audioAmount: string
): Promise<QuoteResponse> => {
  return await jupiterApi.quoteGet({
    inputMint: AUDIO_MINT,
    outputMint: SOL_MINT.toBase58(),
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
  const virtualPoolState = await dbcClient.state.getPool(
    QUOTE_POOL_MINT_ADDRESS
  )
  const poolConfigState = await dbcClient.state.getPoolConfig(
    virtualPoolState.config
  )
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

const getQuoteFromSolInput = async (
  jupiterApi: JupiterApi,
  dbcClient: DynamicBondingCurveClient,
  solAmountLamports: string
) => {
  // Get SOL to AUDIO quote
  const solToAudioQuote = await getSolToAudioQuote(
    jupiterApi,
    solAmountLamports
  )

  // Get SOL to USDC quote
  const solToUsdcQuote = await getSolToUsdcQuote(jupiterApi, solAmountLamports)

  // Use the AUDIO amount from the jupiter quote to get a quote for tokens out of the bonding curve
  const audioAmount = new BN(solToAudioQuote.outAmount)
  const audioToTokensQuote = await getBondingCurveQuote({
    dbcClient,
    audioAmount
  })
  return {
    solInputAmount: solAmountLamports,
    usdcInputAmount: solToUsdcQuote.outAmount,
    tokenOutputAmount: audioToTokensQuote,
    audioSwapAmount: solToAudioQuote.outAmount
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

  const solAmount = await getAudioToSolQuote(jupiterApi, audioAmount!)
  const usdcAmount = await getSolToUsdcQuote(jupiterApi, solAmount.outAmount)

  return {
    solInputAmount: solAmount.outAmount,
    usdcInputAmount: usdcAmount.outAmount,
    tokenOutputAmount: tokenAmount,
    audioSwapAmount: audioAmount
  }
}

export const firstBuyQuote = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { solInputAmount, tokenOutputAmount } = req.query

    if (!solInputAmount && !tokenOutputAmount) {
      res.status(400).json({
        error: 'solAmount or tokenAmount is required'
      })
      return
    }

    if (solInputAmount && typeof solInputAmount !== 'string') {
      res.status(400).json({
        error:
          'solAmount is required and must be a string representing the amount in lamports'
      })
      return
    }

    if (tokenOutputAmount && typeof tokenOutputAmount !== 'string') {
      res.status(400).json({
        error:
          'tokenAmount is required and must be a string representing the amount in standard 9 decimal format'
      })
      return
    }

    // Solana connections
    const connection = getConnection()
    const dbcClient = new DynamicBondingCurveClient(connection, 'confirmed')
    const jupiterApi = createJupiterApiClient()

    // Handle SOL -> token quote
    if (solInputAmount && solInputAmount) {
      const quoteFromSolData = await getQuoteFromSolInput(
        jupiterApi,
        dbcClient,
        solInputAmount
      )
      res.status(200).send(quoteFromSolData as FirstBuyQuoteResponse)
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
