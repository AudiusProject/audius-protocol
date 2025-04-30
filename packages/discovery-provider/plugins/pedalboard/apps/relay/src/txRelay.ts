import { coreRelay } from './coreRelay'
import { internalError } from './error'
import {
  TransactionReceipt,
  TransactionRequest
} from '@ethersproject/abstract-provider'
import { NextFunction, Request, Response } from 'express'

export type RelayedTransaction = {
  receipt: TransactionReceipt
  transaction: TransactionRequest
}

export const relayTransaction = async (
  _req: Request,
  res: Response,
  next: NextFunction
) => {
  // pull info from validated request
  const { validatedRelayRequest, logger, requestId } = res.locals.ctx
  try {
    const receipt = await coreRelay(logger, requestId, validatedRelayRequest)
    logger.info({ receipt }, "sending back")
    res.send({ receipt })
  } catch (e) {
    internalError(next, e)
    return
  }
}
