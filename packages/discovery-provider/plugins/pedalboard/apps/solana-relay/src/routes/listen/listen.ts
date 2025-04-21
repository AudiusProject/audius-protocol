import {
  Connection,
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
import { normalizeEp, getConnection } from '../../utils/connections'
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

let conn: Connection | null = null

export const getListensConnection = (): Connection => {
  if (conn) {
    return conn
  }
  conn = new Connection(normalizeEp(config.listenRpcUrl))
  return conn
}

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
  const latestBlockHash = await getListensConnection().getLatestBlockhash()

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

  const solTxSignature = await getListensConnection().sendRawTransaction(
    transaction.serialize(),
    {
      skipPreflight: true
    }
  )

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
  res.status(200).json({
    solTxSignature: null
  })
  next()

  // Add back to enable solana plays

  // let logger
  // try {
  //   logger = res.locals.logger

  //   // if not prod, just return 200
  //   if (config.environment !== 'prod') {
  //     logger.info('not prod, skipping listen')
  //     res.status(200).json({
  //       solTxSignature: null
  //     })
  //     next()
  //     return
  //   }

  //   // validation
  //   const { userId, timestamp, signature } = recordListenBodySchema.parse(
  //     req.body
  //   )
  //   const { trackId } = recordListenParamsSchema.parse(req.params)
  //   const host = req.hostname
  //   logger = res.locals.logger.child({ userId, trackId, host })
  //   const ip = getIP(req)

  //   // require request came from content
  //   if (!(await validateListenSignature(timestamp, signature))) {
  //     logger.info(
  //       { userId, trackId, ip, timestamp, signature },
  //       'unauthorized request'
  //     )
  //     res.status(401).json({ message: 'Unauthorized Error' })
  //     next()
  //     return
  //   }

  //   // check rate limit on forwarded IP and track
  //   const allowed = await listenRouteRateLimiter({ ip, trackId, logger })
  //   if (!allowed) {
  //     res.send(429).json({ message: 'Too Many Requests' })
  //     next()
  //     return
  //   }

  //   // record listen after validation
  //   const record = await recordListen({ userId, trackId, logger, ip })
  //   return res.status(200).json(record)
  // } catch (e: unknown) {
  //   if (e instanceof z.ZodError) {
  //     logger?.error({ error: String(e) }, 'validation error')
  //     return res
  //       .status(400)
  //       .json({ message: 'Validation Error', errors: e.errors })
  //   }
  //   if (e instanceof Error) {
  //     logger?.error(
  //       { message: e.message, stack: e.stack, name: e.name },
  //       'listen error'
  //     )
  //   } else if (typeof e === 'object' && e !== null) {
  //     logger?.error({ error: JSON.stringify(e) }, 'listen error')
  //   } else {
  //     logger?.error({ error: String(e) }, 'listen error')
  //   }
  //   res.status(500).json({ message: 'Internal Server Error' })
  //   next(e)
  // }
}
