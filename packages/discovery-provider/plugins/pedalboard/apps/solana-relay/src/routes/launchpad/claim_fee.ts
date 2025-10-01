import { DynamicBondingCurveClient } from '@meteora-ag/dynamic-bonding-curve-sdk'
import { PublicKey } from '@solana/web3.js'
import { Request, Response } from 'express'

import { logger } from '../../logger'
import { getConnection } from '../../utils/connections'

interface ClaimFeeRequestBody {
  tokenMint: string
  ownerWalletAddress: string
  receiverWalletAddress: string
}

export const claimFee = async (
  req: Request<unknown, unknown, ClaimFeeRequestBody>,
  res: Response
) => {
  try {
    const { tokenMint, ownerWalletAddress, receiverWalletAddress } = req.query

    // Validate required parameters
    if (!tokenMint || !ownerWalletAddress || !receiverWalletAddress) {
      throw new Error(
        'Invalid request parameters. tokenMint, ownerWalletAddress, and receiverWalletAddress are required.'
      )
    }

    const connection = getConnection()
    const dbcClient = new DynamicBondingCurveClient(connection, 'confirmed')

    const tokenPool = await dbcClient.state.getPoolByBaseMint(
      new PublicKey(tokenMint)
    )
    if (!tokenPool) {
      throw new Error(`No DBC pool found for base mint: ${tokenMint}.`)
    }

    const poolAddress = tokenPool.publicKey
    const poolData = tokenPool.account

    const claimFeeTx = await dbcClient.creator.claimCreatorTradingFee({
      pool: poolAddress,
      payer: new PublicKey(ownerWalletAddress),
      creator: new PublicKey(ownerWalletAddress),
      maxBaseAmount: poolData.creatorBaseFee, // Match max amount to the claimable amount (effectively no limit)
      maxQuoteAmount: poolData.creatorQuoteFee, // Match max amount to the claimable amount (effectively no limit)
      receiver: new PublicKey(receiverWalletAddress)
    })

    claimFeeTx.recentBlockhash = (
      await connection.getLatestBlockhash()
    ).blockhash
    claimFeeTx.feePayer = new PublicKey(ownerWalletAddress)

    return res.status(200).send({
      claimFeeTx: claimFeeTx.serialize({ requireAllSignatures: false })
    })
  } catch (e) {
    logger.error(
      'Error in claim_fee - unable to create creator claim fee transaction'
    )
    logger.error(e)
    res.status(500).send()
  }
}
