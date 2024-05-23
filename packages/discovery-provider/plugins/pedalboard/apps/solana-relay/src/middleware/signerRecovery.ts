import { NextFunction, Request, Response } from 'express'
import { recoverPersonalSignature } from 'eth-sig-util'
import { Table, Users } from '@pedalboard/storage'
import { initializeDiscoveryDb } from '@pedalboard/basekit'
import { config } from '../config'
import { getCachedContentNodes, getCachedDiscoveryNodes } from '../redis'
import { keccak256 } from 'web3-utils'
import { hashMessage, recover } from 'web3-eth-accounts'

const basicPrefix = "Basic "
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

export const contentNodeSignerRecoveryMiddleware = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  let logger
  try {
    logger = res.locals.logger.child({"middleware": "CONTENT_NODE"})
    const sig = req.get('Authorization')
    if (!sig) {
      res.locals.isSignedByContent = false
      return next()
    }

    logger.info({ nodes: await getCachedContentNodes(), sig })
  

    const isBasicAuth = sig.startsWith(basicPrefix)
    if (!isBasicAuth) {
      res.locals.isSignedByContent = false
      return next()
    }

    // strip out "Basic " prefix
    // https://github.com/AudiusProject/audius-protocol/blob/3d750e798de9d2af1e67ec0c526cced45dfadfdc/mediorum/server/signature/basic_auth.go#L28
    const key = sig.slice(basicPrefix.length)
    // decode base64
    // https://github.com/AudiusProject/audius-protocol/blob/3d750e798de9d2af1e67ec0c526cced45dfadfdc/mediorum/server/signature/basic_auth.go#L28
    const decodedBytes = Buffer.from(key, 'base64');
    const decodedKey = decodedBytes.toString('utf-8')
  
    logger.info({ decodedKey, decodedBytes, key })
  
    // split ts and signature hex
    // https://github.com/AudiusProject/audius-protocol/blob/3d750e798de9d2af1e67ec0c526cced45dfadfdc/mediorum/server/signature/basic_auth.go#L27
    const [timestamp, signatureHex] = decodedKey.split(':')

    logger.info({ timestamp, signatureHex })
    // decode from hex
    // https://github.com/AudiusProject/audius-protocol/blob/3d750e798de9d2af1e67ec0c526cced45dfadfdc/mediorum/server/signature/basic_auth.go#L25
    const signature = Buffer.from(signatureHex.slice(2), 'hex')
  
    // recreate hashed data
    // https://github.com/AudiusProject/audius-protocol/blob/main/mediorum/server/signature/signature.go#L114
    const toSignHash = keccak256(timestamp)
    // recreate text hash
    // https://github.com/AudiusProject/audius-protocol/blob/main/mediorum/server/signature/signature.go#L117
    const messageHash = hashMessage(toSignHash)
    logger.info({ toSignHash, messageHash })
    // use recover function to get wallet
    const recoveredWallet = recover(messageHash, signature.toString('hex'))
  
    const contentWallets = await getCachedContentNodes()
  
    logger.info({ contentWallets, recoveredWallet }, "WALLETS")
  
    const isSignedByContent = contentWallets
      .map(({ delegateOwnerWallet }) => delegateOwnerWallet.toLowerCase())
      .includes(recoveredWallet)
    res.locals.isSignedByContent = isSignedByContent
    if (!isSignedByContent) {
      logger.warn(
        { recoveredWallet, discoveryWallets: contentWallets },
        'Bad Content Signature'
      )
    }
    next()
  } catch (e: unknown) {
    if (e instanceof Error) {
      logger?.error({ message: e.message, stack: e.stack, name: e.name }, "content signature recovery error");
    } else if (typeof e === 'object' && e !== null) {
        logger?.error({ error: JSON.stringify(e) }, "content signature recovery error");
    } else {
        logger?.error({ error: String(e) }, "content signature recovery error");
    }
    res.locals.isSignedByContent = false
    next()
  }
}
