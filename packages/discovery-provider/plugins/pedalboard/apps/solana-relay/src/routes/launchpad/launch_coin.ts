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

import { isSolanaAddress } from '~/utils/addressUtils'

interface LaunchCoinRequestBody {
  name: string
  symbol: string
  walletPublicKey: string
  description: string
  initialBuyAmountAudio?: string
}

const AUDIO_DECIMALS = 1e8

const AUDIUS_COIN_URL = (ticker: string) => `https://audius.co/coins/${ticker}`

export const launchCoin = async (
  req: Request<unknown, unknown, LaunchCoinRequestBody> & {
    file?: Express.Multer.File
  },
  res: Response
) => {
  try {
    logger.info('Launching coin...')
    const { launchpadConfigKey: configKey, solanaFeePayerWallets } = config

    const {
      name,
      symbol,
      description,
      walletPublicKey: walletPublicKeyStr,
      initialBuyAmountAudio: initialBuyAmountAudioStr
    } = req.body
    const initialBuyAmountAudio =
      initialBuyAmountAudioStr !== undefined
        ? parseFloat(initialBuyAmountAudioStr)
        : undefined
    logger.info(req.body)

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

    if (
      initialBuyAmountAudio !== undefined &&
      (typeof initialBuyAmountAudio !== 'number' ||
        initialBuyAmountAudio <= 0 ||
        isNaN(initialBuyAmountAudio))
    ) {
      throw new Error(
        `Invalid initialBuyAmountAudio. Initial buy amount must be a number > 0. Received: ${initialBuyAmountAudio}`
      )
    }

    const walletPublicKey = new PublicKey(walletPublicKeyStr)

    // TODO: get specific addresses with AUDIO in the name
    const mintKeypair = Keypair.generate()

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

    // Create Bonding Curve
    const poolConfig = await dbcClient.pool.createPoolWithFirstBuy({
      createPoolParam: {
        config: new PublicKey(configKey),
        name,
        symbol,
        uri: metadataUri,
        poolCreator: walletPublicKey,
        baseMint: mintKeypair.publicKey,
        payer: walletPublicKey
      },
      firstBuyParam: initialBuyAmountAudio
        ? {
            buyer: walletPublicKey,
            receiver: walletPublicKey,
            buyAmount: new BN(initialBuyAmountAudio * AUDIO_DECIMALS), // Multiply by 1 $AUDIO worth
            minimumAmountOut: new BN(0), // No slippage protection for initial buy
            referralTokenAccount: null // No referral for creator's initial buy
          }
        : undefined
    })

    /*
     * Prepare the transactions to be signed by the client -
     * for the pool creation we need to sign with the mint keypair only accessible here,
     * the client does the final signing with the wallet keypair & will confirm the transactions
     */

    // Create pool transaction
    const createPoolTx = poolConfig.createPoolTx
    createPoolTx.feePayer = walletPublicKey
    createPoolTx.recentBlockhash = (
      await connection.getLatestBlockhash()
    ).blockhash
    createPoolTx.partialSign(mintKeypair)

    // First buy transaction
    const firstBuyTx = poolConfig.swapBuyTx
    if (firstBuyTx) {
      firstBuyTx.feePayer = walletPublicKey
      firstBuyTx.recentBlockhash = (
        await connection.getLatestBlockhash()
      ).blockhash
    }

    return res.status(200).send({
      mintPublicKey: mintKeypair.publicKey.toBase58(),
      createPoolTx: poolConfig.createPoolTx,
      firstBuyTx: poolConfig.swapBuyTx,
      metadataUri
    })
  } catch (e) {
    logger.error('Error creating coin for launchpad')
    logger.error(e)
    res.status(500).send()
  }
}
