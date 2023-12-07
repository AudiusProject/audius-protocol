import { NextFunction, Request, Response } from 'express'
import { config } from '../config'

export const feePayer = async (
  _req: Request,
  res: Response,
  next: NextFunction
) => {
  const index = Math.floor(Math.random() * config.solanaFeePayerWallets.length)
  const feePayer = config.solanaFeePayerWallets[index].publicKey.toBase58()
  res.status(200).send({
    feePayer
  })
  next()
}
