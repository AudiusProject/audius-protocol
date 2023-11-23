import { NextFunction, Request, Response } from 'express'
import { BadRequestError } from '../../errors'
import { cacheTransaction } from '../../redis'
import { logger } from '../../logger'
import { VersionedTransaction } from '@solana/web3.js'
import base58 from 'bs58'

type RequestBody = {
  signature: string
  transaction: string
}

export const cache = async (
  req: Request<unknown, unknown, RequestBody>,
  res: Response,
  next: NextFunction
) => {
  try {
    const { signature, transaction } = req.body
    const logger = res.locals.logger.child({ signature, transaction })
    logger.info('Received cache request')
    if (!signature || !transaction) {
      throw new BadRequestError()
    }
    const decoded = Buffer.from(transaction, 'base64')
    const tx = VersionedTransaction.deserialize(decoded)
    const sig = tx.signatures[0]
    if (!sig) {
      throw new BadRequestError('No signature on transaction')
    }
    const txSignature = base58.encode(sig)
    if (txSignature !== signature) {
      throw new BadRequestError('Invalid signature')
    }
    await cacheTransaction(signature, transaction)
    res.status(200).send({ signature, transaction })
    next()
  } catch (e) {
    next(e)
  }
}
