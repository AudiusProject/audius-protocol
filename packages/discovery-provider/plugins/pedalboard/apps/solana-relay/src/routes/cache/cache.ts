import { NextFunction, Request, Response } from 'express'
import { BadRequestError } from '../../errors'
import { cacheTransaction } from '../../redis'
import { logger } from '../../logger'

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
    if (!signature || !transaction) {
      throw new BadRequestError()
    }
    await cacheTransaction(signature, transaction)
    res.status(200).send({ signature, transaction })
    logger.info(`cached transaction: ${signature}`)
  } catch (e) {
    next(e)
  }
}
