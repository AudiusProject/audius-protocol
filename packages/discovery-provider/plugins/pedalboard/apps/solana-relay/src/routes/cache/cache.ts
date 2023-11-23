import { NextFunction, Request, Response } from 'express'
import { BadRequestError, UnauthorizedError } from '../../errors'
import { cacheTransaction } from '../../redis'
import { TransactionResponse } from '@solana/web3.js'
import { config } from '../../config'

type RequestBody = {
  transaction: string
}

export const cache = async (
  req: Request<unknown, unknown, RequestBody>,
  res: Response,
  next: NextFunction
) => {
  try {
    if (!res.locals.isSignedByDiscovery) {
      throw new UnauthorizedError()
    }
    const { transaction } = req.body
    if (!transaction) {
      throw new BadRequestError()
    }
    const transactionResponse = JSON.parse(transaction) as {
      result: TransactionResponse
    }
    const signature = transactionResponse.result.transaction.signatures[0]
    res.locals.logger.info({ signature }, 'Caching transaction...')
    await cacheTransaction(signature, transaction)
    res.status(200).send({ signature })
    next()
  } catch (e) {
    next(e)
  }
}
