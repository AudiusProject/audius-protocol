import { NextFunction, Request, Response } from 'express'
import { recoverPersonalSignature } from 'eth-sig-util'
import { Table, Users } from '@pedalboard/storage'
import { initializeDiscoveryDb } from '@pedalboard/basekit'
import { config } from '../config'
import { getCachedDiscoveryNodes } from '../redis'

const discoveryDb = initializeDiscoveryDb(config.discoveryDbConnectionString)

export const userSignerRecoveryMiddleware = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const data = JSON.stringify(req.body)
  const sig = req.get('User-Signature')
  if (!sig) {
    return next()
  }
  const walletAddress = recoverPersonalSignature({ data, sig })
  const user = await discoveryDb<Users>(Table.Users)
    .where('wallet', '=', walletAddress)
    .first()
  res.locals.signerUser = user
  if (!user) {
    res.locals.logger.warn(
      { walletAddress },
      'No user found matching signature'
    )
  }
  next()
}

export const discoveryNodeSignerRecoveryMiddleware = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const data = JSON.stringify(req.body)
  const sig = req.get('Discovery-Signature')
  if (!sig) {
    res.locals.isSignedByDiscovery = false
    return next()
  }
  const walletAddress = recoverPersonalSignature({ data, sig })
  const discoveryWallets = await getCachedDiscoveryNodes()
  const isSignedByDiscovery = discoveryWallets
    .map(({ delegateOwnerWallet }) => delegateOwnerWallet.toLowerCase())
    .includes(walletAddress)
  res.locals.isSignedByDiscovery = isSignedByDiscovery
  if (!isSignedByDiscovery) {
    res.locals.logger.warn(
      { walletAddress, discoveryWallets },
      'Bad Discovery Signature'
    )
  }
  next()
}
