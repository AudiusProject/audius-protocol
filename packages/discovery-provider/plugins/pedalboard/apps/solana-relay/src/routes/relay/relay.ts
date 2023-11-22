import {
  Connection,
  PublicKey,
  TransactionMessage,
  VersionedTransaction
} from '@solana/web3.js'
import { Request, Response, NextFunction } from 'express'
import { config } from '../../config'
import { BadRequestError } from '../../errors'
import { logger } from '../../logger'
import { assertRelayAllowedInstructions } from './assertRelayAllowedInstructions'
import { cacheTransaction, getCachedDiscoveryNodes } from '../../redis'
import fetch from 'cross-fetch'

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

const forwardTransaction = async (signature: string, transaction: string) => {
  const endpoints = await getCachedDiscoveryNodes()
  logger.info(`Forwarding ${signature} to ${endpoints.length} endpoints...`)
  await Promise.all(
    endpoints.map((endpoint) =>
      fetch(`${endpoint}/solana/cache`, {
        method: 'POST',
        body: JSON.stringify({ transaction }),
        headers: { 'content-type': 'application/json' }
      })
        .then(() => {
          logger.info(`Forwarded ${signature} to ${endpoint}`)
        })
        .catch((e) => {
          logger.warn(
            `Failed to forward transaction ${signature} to endpoint ${endpoint}`
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
    await cacheTransaction(signature, encoded)
    await forwardTransaction(signature, encoded)
    res.status(200).send({ signature })
    next()
  } catch (e) {
    next(e)
  }
}
