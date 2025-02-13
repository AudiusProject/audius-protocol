import {
  Transaction,
  TransactionMessage,
  VersionedTransaction
} from '@solana/web3.js'
import bs58 from 'bs58'
import { NextFunction, Request, Response } from 'express'
import { Logger } from 'pino'
import { recover } from 'web3-eth-accounts'
import { keccak256 } from 'web3-utils'
import { z } from 'zod'

import {
  LISTENS_RATE_LIMIT_IP_PREFIX,
  LISTENS_RATE_LIMIT_TRACK_PREFIX,
  config
} from '../../config'
import { RateLimiter } from '../../middleware/rateLimiter'
import { getCachedContentNodes } from '../../redis'
import { getConnection } from '../../utils/connections'
import { getIP, getIpData } from '../../utils/ipData'
import { sortKeys } from '../../utils/sortKeys'
import { sendTransactionWithRetries } from '../../utils/transaction'

import {
  createTrackListenInstructions,
  getFeePayerKeyPair
} from './trackListenInstructions'

export type LocationData = {
  city: string
  region: string
  country: string
} | null

export const recordListenBodySchema = z.object({
  userId: z.string(),
  timestamp: z.string(),
  signature: z.string()
})

export const recordListenParamsSchema = z.object({
  // validate that it can parse as an int
  trackId: z
    .string()
    .transform((s) => parseInt(s))
    .refine((val) => !isNaN(val), {
      message: 'trackId must be a numeric string'
    })
    .transform((val) => val.toString())
})

export interface RecordListenRequest extends Request {
  body: z.infer<typeof recordListenBodySchema>
  params: z.infer<typeof recordListenParamsSchema>
}

export type RecordListenParams = {
  logger: Logger
  trackId: string
  userId: string
  ip: string
}

export type RecordListenResponse = {
  solTxSignature: string | null
}

export const listensIpRateLimiter = new RateLimiter({
  prefix: LISTENS_RATE_LIMIT_IP_PREFIX,
  hourlyLimit: config.listensIpHourlyRateLimit,
  dailyLimit: config.listensIpDailyRateLimit,
  weeklyLimit: config.listensIpWeeklyRateLimit
})
export const listensIpTrackRateLimiter = new RateLimiter({
  prefix: LISTENS_RATE_LIMIT_TRACK_PREFIX,
  hourlyLimit: config.listensTrackHourlyRateLimit,
  dailyLimit: config.listensTrackDailyRateLimit,
  weeklyLimit: config.listensTrackWeeklyRateLimit
})

export const recordListen = async (
  params: RecordListenParams
): Promise<RecordListenResponse> => {
  const { logger: parentLogger, userId, trackId, ip } = params
  const logger = parentLogger.child({
    id: `${userId}-${trackId}-${new Date().getUTCSeconds()}`
  })

  logger.info({ ip }, 'record listen')

  const location = await getIpData(logger, ip)

  logger.info({ location }, 'location')

  const [secpInstruction, listenInstruction] =
    await createTrackListenInstructions({
      logger,
      userId,
      trackId,
      location
    })

  logger.info({ secpInstruction, listenInstruction }, 'instructions')
  const latestBlockHash = await getConnection().getLatestBlockhash()

  const feePayer = getFeePayerKeyPair()
  const tx = new Transaction({
    blockhash: latestBlockHash.blockhash,
    lastValidBlockHeight: latestBlockHash.lastValidBlockHeight
  })
    .add(secpInstruction)
    .add(listenInstruction)
  tx.feePayer = feePayer.publicKey
  tx.sign(feePayer)

  logger.info({ tx }, 'tx')

  const message = new TransactionMessage({
    payerKey: feePayer.publicKey,
    recentBlockhash: latestBlockHash.blockhash,
    instructions: tx.instructions
  })

  const versionedMessage = message.compileToV0Message()

  const transaction = new VersionedTransaction(versionedMessage)
  transaction.sign([feePayer])

  const signature = bs58.encode(transaction.signatures[0])
  const confirmationStrategy = { ...latestBlockHash, signature }

  logger.info(
    { latestBlockHash, versionedMessage, transaction, signature },
    'pre send'
  )

  const solTxSignature = await sendTransactionWithRetries({
    transaction,
    commitment: 'confirmed',
    confirmationStrategy,
    logger
  })

  logger.info({ solTxSignature }, 'transaction sig')

  return { solTxSignature }
}

export const validateListenSignature = async (
  timestamp: string,
  signature: string
): Promise<boolean> => {
  const data = JSON.stringify(sortKeys({ data: 'listen', timestamp }))
  const hashedData = keccak256(data)
  const recoveredWallet = recover(hashedData, signature)
  const contentNodes = await getCachedContentNodes()

  // if from identity service
  if (recoveredWallet === config.identityRelayerPublicKey) {
    return true
  }

  // if from registered content node
  for (const { delegateOwnerWallet } of contentNodes) {
    if (recoveredWallet === delegateOwnerWallet) return true
  }
  return false
}

// rate limiter for after request validation
export const listenRouteRateLimiter = async (params: {
  ip: string
  trackId: string
  logger?: Logger
}): Promise<{ allowed: boolean }> => {
  const { ip, trackId, logger } = params
  const ipTrackConcatKey = `${ip}:${trackId}`

  // consume and check rate limits
  const ipLimit = await listensIpRateLimiter.checkLimit(ip)
  const ipTrackLimit =
    await listensIpTrackRateLimiter.checkLimit(ipTrackConcatKey)

  // merge limits and check if both allow passage
  const allowed = ipLimit.allowed && ipTrackLimit.allowed

  if (!allowed) {
    logger?.info({ ipLimit, ipTrackLimit, ip }, 'rate limit hit')
  }

  return { allowed }
}

export const listen = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const logger = res.locals.logger
  logger.info('not prod, skipping listen')
  res.status(200).json({
    solTxSignature: null
  })
  next()
}
