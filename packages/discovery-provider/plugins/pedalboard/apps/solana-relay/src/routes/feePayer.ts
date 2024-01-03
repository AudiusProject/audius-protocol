import { NextFunction, Request, Response } from 'express'
import { config } from '../config'
import { InternalServerError } from '../errors'

export const feePayer = async (
  _req: Request,
  res: Response,
  next: NextFunction
) => {
  if (
    !config.solanaFeePayerWallets ||
    config.solanaFeePayerWallets.length === 0
  ) {
    throw new InternalServerError('Relayer fee payer not configured.')
  }
  const index = Math.floor(Math.random() * config.solanaFeePayerWallets.length)
  const feePayer = config.solanaFeePayerWallets[index].publicKey.toBase58()
  res.status(200).send({
    feePayer
  })
  next()
}
