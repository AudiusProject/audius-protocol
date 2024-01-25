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
import { cacheTransaction, getCachedDiscoveryNodeEndpoints } from '../../redis'
import fetch from 'cross-fetch'
import { Logger } from 'pino'
import base58 from 'bs58'
import { personalSign } from 'eth-sig-util'
import type { RelayRequestBody } from '@audius/sdk'

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

const forwardTransaction = async (logger: Logger, transaction: string) => {
  const endpoints = await getCachedDiscoveryNodeEndpoints()
  logger.info(`Forwarding to ${endpoints.length} endpoints...`)
  const body = JSON.stringify({ transaction })
  await Promise.all(
    endpoints
      .filter((endpoint) => endpoint !== config.endpoint)
      .map((endpoint) =>
        fetch(`${endpoint}/solana/cache`, {
          method: 'POST',
          body,
          headers: {
            'content-type': 'application/json',
            'Discovery-Signature': personalSign(config.delegatePrivateKey, {
              data: body
            })
          }
        })
          .then((res) => {
            if (res.ok) {
              logger.info(
                { endpoint, status: res.status },
                `Forwarded successfully`
              )
            } else {
              logger.warn(
                { endpoint },
                `Failed to forward transaction to endpoint: ${res.statusText}`
              )
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
  req: Request<unknown, unknown, RelayRequestBody>,
  res: Response,
  next: NextFunction
) => {
  try {
    const {
      transaction: encodedTransaction,
      confirmationOptions,
      sendOptions
    } = req.body
    const { strategy, commitment } = confirmationOptions ?? {}
    const confirmationStrategy =
      strategy ?? (await connection.getLatestBlockhash())
    const decoded = Buffer.from(encodedTransaction, 'base64')
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
      user: res.locals.signerUser,
      feePayer: feePayerKey.toBase58()
    })

    transaction.sign([feePayerKeyPair])

    const logger = res.locals.logger.child({
      signature: base58.encode(transaction.signatures[0])
    })
    logger.info('Sending transaction...')
    const serializedTx = transaction.serialize()
    logger.info(`Serialized: ${Buffer.from(serializedTx).toString('base64')}`)

    const signature = await connection.sendRawTransaction(
      serializedTx,
      sendOptions
    )
    if (commitment) {
      logger.info(`Waiting for transaction to be ${commitment}...`)
      await connection.confirmTransaction(
        {
          ...confirmationStrategy,
          signature
        },
        commitment
      )
    }
    res.status(200).send({ signature })
    next()
    // Confirm, fetch, cache and forward after success response
    // Only wait for confirmation if we haven't already
    if (
      !commitment ||
      (commitment !== 'confirmed' && commitment !== 'finalized')
    ) {
      logger.info(`Confirming transaction...`)
      await connection.confirmTransaction(
        {
          ...confirmationStrategy,
          signature
        },
        'confirmed'
      )
    }
    logger.info('Fetching transaction...')
    const rpcResponse = await connection.getTransaction(signature, {
      maxSupportedTransactionVersion: 0,
      commitment: 'confirmed'
    })
    // Need to rewrap so that Solders knows how to parse it
    const formattedResponse = JSON.stringify({
      jsonrpc: '2.0',
      result: rpcResponse
    })
    logger.info('Caching transaction...')
    await cacheTransaction(signature, formattedResponse)
    logger.info('Forwarding transaction...')
    await forwardTransaction(logger, formattedResponse)
  } catch (e) {
    next(e)
  }
}
