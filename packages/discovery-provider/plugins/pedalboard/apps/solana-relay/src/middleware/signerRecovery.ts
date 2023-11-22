import { NextFunction, Request, Response } from 'express'
import { recoverPersonalSignature } from 'eth-sig-util'
import { Table, Users } from '@pedalboard/storage'
import { initializeDiscoveryDb } from '@pedalboard/basekit'
import { config } from '../config'

const discoveryDb = initializeDiscoveryDb(config.discoveryDbConnectionString)

export const signerRecoveryMiddleware = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const data = JSON.stringify(req.body)
  const sig = req.get('Signature')
  if (!sig) {
    return next()
  }
  const walletAddress = recoverPersonalSignature({ data, sig })
  const user = await discoveryDb<Users>(Table.Users)
    .where('wallet', '=', walletAddress)
    .andWhere('is_current', '=', true)
    .first()
  res.locals.signer = user
  next()
}
