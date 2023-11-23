import {
  Connection,
  PublicKey,
  TransactionMessage,
  VersionedTransaction
} from '@solana/web3.js'
import { Request, Response, NextFunction } from 'express'
import { config } from '../../config'
import { BadRequestError } from '../../errors'
import { assertRelayAllowedInstructions } from './assertRelayAllowedInstructions'
import { cacheTransaction, getCachedDiscoveryNodes } from '../../redis'
import fetch from 'cross-fetch'
import { Logger } from 'pino'

type RequestBody = {
  transaction: string
}

const connection = new Connection(config.solanaEndpoint)

const getFeePayerKeyPair = (feePayerPublicKey?: PublicKey) => {
  if (!feePayerPublicKey) {
    return null
  }
  return (
    config.solanaFeePayerWallets.find((kp) =>
      kp.publicKey.equals(feePayerPublicKey)
    ) ?? null
  )
}

const forwardTransaction = async (
  logger: Logger,
  signature: string,
  transaction: string
) => {
  const endpoints = await getCachedDiscoveryNodes()
  logger.info(`Forwarding to ${endpoints.length} endpoints...`)
  await Promise.all(
    endpoints
      .filter((endpoint) => endpoint !== config.endpoint)
      .map((endpoint) =>
        fetch(`${endpoint}/solana/cache`, {
          method: 'POST',
          body: JSON.stringify({ signature, transaction }),
          headers: { 'content-type': 'application/json' }
        })
          .then((res) => {
            if (res.ok) {
              logger.info(
                { endpoint, status: res.status },
                `Forwarded successfully`
              )
            } else {
              throw new Error(res.statusText)
            }
          })
          .catch((e) => {
            logger.warn(
              { endpoint },
              `Failed to forward transaction to endpoint: ${e}`
            )
          })
      )
  )
}

export const relay = async (
  req: Request<unknown, unknown, RequestBody>,
  res: Response,
  next: NextFunction
) => {
  try {
    const decoded = Buffer.from(req.body.transaction, 'base64')
    const transaction = VersionedTransaction.deserialize(decoded)
    const decompiled = TransactionMessage.decompile(transaction.message)
    const feePayerKey = transaction.message.getAccountKeys().get(0)
    const feePayerKeyPair = getFeePayerKeyPair(feePayerKey)
    if (!feePayerKey || !feePayerKeyPair) {
      throw new BadRequestError(
        `No fee payer for address '${feePayerKey?.toBase58()}'`
      )
    }
    await assertRelayAllowedInstructions(decompiled.instructions, {
      user: res.locals.signer,
      feePayer: feePayerKey.toBase58()
    })

    transaction.sign([feePayerKeyPair])
    const serializedTx = transaction.serialize()
    const signature = await connection.sendRawTransaction(serializedTx)
    const encoded = Buffer.from(serializedTx).toString('base64')
    const logger = res.locals.logger.child({ signature, transaction: encoded })
    logger.info('Caching transaction...')
    await cacheTransaction(signature, encoded)
    logger.info('Forwarding transaction...')
    await forwardTransaction(logger, signature, encoded)
    res.status(200).send({ signature })
    next()
  } catch (e) {
    next(e)
  }
}
