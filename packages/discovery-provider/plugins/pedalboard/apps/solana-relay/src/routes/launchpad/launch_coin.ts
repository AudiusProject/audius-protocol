import { FixedDecimal } from '@audius/fixed-decimal'
import {
  createJupiterApiClient,
  SwapRequest,
  QuoteResponse,
  SwapApi as JupiterApi
} from '@jup-ag/api'
import {
  createGenericFile,
  signerIdentity,
  createSignerFromKeypair
} from '@metaplex-foundation/umi'
import { createUmi } from '@metaplex-foundation/umi-bundle-defaults'
import { irysUploader } from '@metaplex-foundation/umi-uploader-irys'
import { DynamicBondingCurveClient } from '@meteora-ag/dynamic-bonding-curve-sdk'
import { Keypair, PublicKey } from '@solana/web3.js'
import BN from 'bn.js'
import { Request, Response } from 'express'

import { config } from '../../config'
import { logger } from '../../logger'
import { getConnection } from '../../utils/connections'

interface LaunchCoinRequestBody {
  name: string
  symbol: string
  walletPublicKey: string
  description: string
  initialBuyAmountSol?: string
}

const SOL_MINT = 'So11111111111111111111111111111111111111112'
const SOL_DECIMALS = 9
const AUDIO_MINT = '9LzCMqDgTKYz9Drzqnpgee3SGa89up3a247ypMj2xrqM'

const AUDIUS_COIN_URL = (ticker: string) => `https://audius.co/coins/${ticker}`

const createSolToAudioTx = async (
  jupiterApi: JupiterApi,
  quote: QuoteResponse,
  userPublicKey: PublicKey
): Promise<string> => {
  try {
    const swapRequest: SwapRequest = {
      quoteResponse: quote,
      userPublicKey: userPublicKey.toBase58(),
      wrapAndUnwrapSol: true,
      dynamicSlippage: true, // Uses the slippage from the quote
      useSharedAccounts: true
    }

    const swapResponse = await jupiterApi.swapPost({ swapRequest })

    return swapResponse.swapTransaction
  } catch (error) {
    logger.error('Error creating Jupiter swap transaction:', error)
    throw new Error(`Failed to create Jupiter swap transaction: ${error}`)
  }
}

const getJupiterSwapQuote = async (
  jupiterApi: JupiterApi,
  initialBuyAmountSol: bigint
) => {
  return await jupiterApi.quoteGet({
    inputMint: SOL_MINT,
    outputMint: AUDIO_MINT,
    amount: Number(initialBuyAmountSol),
    swapMode: 'ExactIn',
    onlyDirectRoutes: false,
    dynamicSlippage: true
  })
}

export const launchCoin = async (
  req: Request<unknown, unknown, LaunchCoinRequestBody> & {
    file?: Express.Multer.File
  },
  res: Response
) => {
  try {
    const { launchpadConfigKey: configKey, solanaFeePayerWallets } = config

    const {
      name,
      symbol,
      description,
      walletPublicKey: walletPublicKeyStr,
      initialBuyAmountSol: initialBuyAmountSolStr
    } = req.body
    const initialBuyAmountSol = initialBuyAmountSolStr
      ? new FixedDecimal(initialBuyAmountSolStr, 9).trunc(SOL_DECIMALS).value
      : undefined

    // file is the image attached via multer middleware (sent from client as a multipart/form-data request)
    const file = req.file
    if (!file) {
      throw new Error('Image file is required.')
    }

    if (!name || !symbol || !file || !description) {
      throw new Error(
        'Invalid metadata arguments. Name, symbol, image, and description are all required.'
      )
    }

    if (!walletPublicKeyStr) {
      throw new Error(
        'Invalid wallet public key. Wallet public key is required.'
      )
    }

    if (initialBuyAmountSol !== undefined && initialBuyAmountSol <= 0) {
      throw new Error(
        `Invalid initialBuyAmountSol. Initial buy amount must be a number > 0. Received: ${initialBuyAmountSol}`
      )
    }

    const walletPublicKey = new PublicKey(walletPublicKeyStr)

    // Initialize Jupiter API client
    const jupiterApi = createJupiterApiClient()

    // TODO: get specific addresses with AUDIO in the name
    const mintKeypair = Keypair.generate()
    const mintPublicKey = mintKeypair.publicKey

    const connection = getConnection()
    const dbcClient = new DynamicBondingCurveClient(connection, 'confirmed')

    // Create Coin Metadata
    const umi = createUmi(connection.rpcEndpoint).use(irysUploader() as any) // note: something is off with the types with the different umi package versions
    // Pick a random fee payer to "own" our new coin metadata and pay for the TX
    const index = Math.floor(Math.random() * solanaFeePayerWallets.length)
    const feePayer = solanaFeePayerWallets[index]
    const umiKeypair = umi.eddsa.createKeypairFromSecretKey(feePayer.secretKey)
    const signer = createSignerFromKeypair(umi, umiKeypair)
    umi.use(signerIdentity(signer))

    const umiImageFile = createGenericFile(file.buffer, '', {
      tags: [{ name: 'Content-Type', value: 'image/jpeg' }]
    })
    const imageUris = await umi.uploader.upload([umiImageFile])
    const imageUri = imageUris[0]
    const metadata = {
      name,
      symbol,
      description,
      image: imageUri,
      external_url: AUDIUS_COIN_URL(symbol),
      attributes: [],
      isMutable: false
    }
    const metadataUri = await umi.uploader.uploadJson(metadata)

    // If using initial buy, get a quote for the swap from SOL -> AUDIO
    let jupiterSwapQuote: QuoteResponse | undefined
    if (initialBuyAmountSol) {
      jupiterSwapQuote = await getJupiterSwapQuote(
        jupiterApi,
        initialBuyAmountSol
      )
    }

    const poolConfig = await dbcClient.pool.createPoolWithFirstBuy({
      createPoolParam: {
        config: new PublicKey(configKey),
        name,
        symbol,
        uri: metadataUri,
        poolCreator: walletPublicKey,
        baseMint: mintPublicKey,
        payer: walletPublicKey
      },
      firstBuyParam:
        initialBuyAmountSol && jupiterSwapQuote
          ? {
              buyer: walletPublicKey,
              receiver: walletPublicKey,
              buyAmount: new BN(jupiterSwapQuote.outAmount), // Should already be formatted with correct decimals
              minimumAmountOut: new BN(0), // No slippage protection for initial buy
              referralTokenAccount: null // No referral for creator's initial buy
            }
          : undefined
    })

    /*
     * Prepare the transactions to be signed by the client
     */

    // Create pool transaction
    const createPoolTx = poolConfig.createPoolTx
    createPoolTx.feePayer = walletPublicKey
    createPoolTx.recentBlockhash = (
      await connection.getLatestBlockhash()
    ).blockhash
    // We need to partial sign with the mint keypair that's only accessible here
    // The client does the final signing with the wallet keypair & will send/confirm the transactions
    createPoolTx.partialSign(mintKeypair)

    // First buy transaction
    const firstBuyTx = poolConfig.swapBuyTx
    let solToAudioTxSerialized: string | undefined
    if (firstBuyTx) {
      firstBuyTx.feePayer = walletPublicKey
      firstBuyTx.recentBlockhash = (
        await connection.getLatestBlockhash()
      ).blockhash

      // Create a transaction for the sol-audio swap
      if (jupiterSwapQuote && initialBuyAmountSol) {
        solToAudioTxSerialized = await createSolToAudioTx(
          jupiterApi,
          jupiterSwapQuote,
          walletPublicKey
        )
      }
    }

    return res.status(200).send({
      mintPublicKey: mintPublicKey.toBase58(),
      imageUri,
      jupiterSwapQuote,
      createPoolTx: createPoolTx.serialize({ requireAllSignatures: false }),
      firstBuyTx: firstBuyTx?.serialize({ requireAllSignatures: false }),
      solToAudioTx: solToAudioTxSerialized,
      metadataUri
    })
  } catch (e) {
    logger.error('Error creating coin for launchpad')
    logger.error(e)
    res.status(500).send()
  }
}
