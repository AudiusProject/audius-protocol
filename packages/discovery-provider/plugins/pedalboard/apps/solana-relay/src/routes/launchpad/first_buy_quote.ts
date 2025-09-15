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
import BN from 'bn.js'
import { Request, Response } from 'express'

import { logger } from '../../logger'
import { getConnection } from '../../utils/connections'

import {
  AUDIO_MINT,
  QUOTE_POOL_MINT_ADDRESS,
  SOL_MINT,
  USDC_MINT
} from './constants'

const getSolToAudioQuote = async (
  jupiterApi: JupiterApi,
  solAmountLamports: number
): Promise<QuoteResponse> => {
  return await jupiterApi.quoteGet({
    inputMint: SOL_MINT,
    outputMint: AUDIO_MINT,
    amount: solAmountLamports,
    swapMode: 'ExactIn',
    onlyDirectRoutes: false,
    dynamicSlippage: true
  })
}

const getSolToUsdcQuote = async (
  jupiterApi: JupiterApi,
  solAmountLamports: number
): Promise<QuoteResponse> => {
  return await jupiterApi.quoteGet({
    inputMint: SOL_MINT,
    outputMint: USDC_MINT,
    amount: solAmountLamports,
    swapMode: 'ExactIn',
    onlyDirectRoutes: false,
    dynamicSlippage: true
  })
}

const getAudioToSolQuote = async (
  jupiterApi: JupiterApi,
  audioAmount: number
): Promise<QuoteResponse> => {
  return await jupiterApi.quoteGet({
    inputMint: AUDIO_MINT,
    outputMint: SOL_MINT,
    amount: audioAmount,
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
    logger.info(tokenAmount)
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

    logger.info(quote.outputAmount.toString())
    return quote.maximumAmountIn?.toString()
  } else {
    throw new Error('audioAmount or tokenAmount is required')
  }
}

const getQuoteFromSolInput = async (
  jupiterApi: JupiterApi,
  dbcClient: DynamicBondingCurveClient,
  solAmountLamports: number
) => {
  // Get SOL to AUDIO quote
  const solToAudioQuote = await getSolToAudioQuote(
    jupiterApi,
    solAmountLamports
  )

  // Get SOL to USDC quote
  const solToUsdcQuote = await getSolToUsdcQuote(jupiterApi, solAmountLamports)

  // Use the AUDIO amount from Jupiter quote to get bonding curve quote
  const audioAmount = new BN(solToAudioQuote.outAmount)

  // Get the pool quote with token output calculation
  const audioToTokensQuote = await getBondingCurveQuote({
    dbcClient,
    audioAmount
  })
  return {
    solInputAmount: Number(solAmountLamports),
    usdcInputAmount: Number(solToUsdcQuote.outAmount),
    tokenOutputAmount: Number(audioToTokensQuote),
    audioSwapAmount: Number(solToAudioQuote.outAmount)
  }
}

const getQuoteFromTokenOutput = async (
  jupiterApi: JupiterApi,
  dbcClient: DynamicBondingCurveClient,
  tokenAmount: number
) => {
  // Get AUDIO to TOKEN quote
  const audioAmount = await getBondingCurveQuote({
    dbcClient,
    tokenAmount: new BN(tokenAmount)
  })

  const solAmount = await getAudioToSolQuote(jupiterApi, Number(audioAmount))
  const usdcAmount = await getSolToUsdcQuote(
    jupiterApi,
    Number(solAmount.outAmount)
  )

  return {
    solInputAmount: Number(solAmount.outAmount),
    usdcInputAmount: Number(usdcAmount.outAmount),
    tokenOutputAmount: Number(tokenAmount),
    audioSwapAmount: Number(audioAmount)
  }
}

export const firstBuyQuote = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { solAmount: solInput, tokenAmount: tokenOutput } = req.query

    if (!solInput && !tokenOutput) {
      res.status(400).json({
        error: 'solAmount or tokenAmount is required'
      })
      return
    }

    if (solInput && typeof solInput !== 'string') {
      res.status(400).json({
        error:
          'solAmount is required and must be a string representing the amount in lamports'
      })
      return
    }

    if (tokenOutput && typeof tokenOutput !== 'string') {
      res.status(400).json({
        error:
          'tokenAmount is required and must be a string representing the amount in lamports'
      })
      return
    }

    const solAmountParsed = solInput ? parseInt(solInput) : undefined
    const tokenAmountParsed = tokenOutput ? parseInt(tokenOutput) : undefined

    // if (isNaN(solAmountLamports) || solAmountLamports <= 0) {
    //   res.status(400).json({
    //     error: 'solAmount must be a valid positive number in lamports'
    //   })
    //   return
    // }

    // Initialize connection and bonding curve client
    const connection = getConnection()
    const dbcClient = new DynamicBondingCurveClient(connection, 'confirmed')

    // Initialize Jupiter API client
    const jupiterApi = createJupiterApiClient()
    if (solInput && solAmountParsed) {
      const quoteFromSolData = await getQuoteFromSolInput(
        jupiterApi,
        dbcClient,
        solAmountParsed
      )
      res.status(200).send(quoteFromSolData as FirstBuyQuoteResponse)
    }
    if (tokenOutput && tokenAmountParsed) {
      const quoteFromTokenData = await getQuoteFromTokenOutput(
        jupiterApi,
        dbcClient,
        tokenAmountParsed
      )
      res.status(200).send(quoteFromTokenData as FirstBuyQuoteResponse)
    }
  } catch (error) {
    res.status(500).json({
      error: 'Failed to get first buy quote',
      details: error instanceof Error ? error.message : 'Unknown error'
    })
  }
}
