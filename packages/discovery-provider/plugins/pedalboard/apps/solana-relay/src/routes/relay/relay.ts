import {
  Commitment,
  Connection,
  PublicKey,
  SendOptions,
  TransactionConfirmationStrategy,
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

const RETRY_DELAY_MS = 2 * 1000
const RETRY_TIMEOUT_MS = 60 * 1000

const connections = config.solanaEndpoints.map(
  (endpoint) => new Connection(endpoint)
)

const delay = async (ms: number) => {
  return await new Promise((resolve) => setTimeout(() => resolve, ms))
}

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

const sendTransactionWithRetries = async ({
  transaction,
  commitment,
  confirmationStrategy,
  sendOptions,
  logger
}: {
  transaction: VersionedTransaction
  commitment: Commitment
  confirmationStrategy: TransactionConfirmationStrategy
  sendOptions?: SendOptions
  logger: Logger
}) => {
  const serializedTx = transaction.serialize()
  const connection = connections[0]

  const start = Date.now()

  // Try to send once w/ await before retrying
  try {
    logger.info(
      { rpcEndpoints: connections.map((c) => c.rpcEndpoint) },
      'Initial send...'
    )
    await Promise.any(
      connections.map(async (connection) => {
        await connection.sendRawTransaction(serializedTx, sendOptions)
      })
    )
  } catch (error) {
    logger.warn({ error }, 'Initial send failed')
  }

  const createRetryPromise = async (): Promise<void> => {
    let retryCount = 0
    while (true) {
      await delay(RETRY_DELAY_MS)
      // Explicitly not awaited, sent in the background
      logger.info({ retryCount }, 'Retry send...')
      try {
        Promise.any(
          connections.map((connection) =>
            connection.sendRawTransaction(serializedTx, sendOptions)
          )
        )
      } catch (error) {
        logger.warn(
          { error, retryCount, rpcEndpoint: connection.rpcEndpoint },
          `Failed retry...`
        )
      }
    }
  }

  const createTimeoutPromise = async () => {
    await delay(RETRY_TIMEOUT_MS)
    logger.error('Timed out sending transaction')
  }

  const res = await Promise.race([
    connection.confirmTransaction(confirmationStrategy, commitment),
    createRetryPromise(),
    createTimeoutPromise()
  ])
  const end = Date.now()
  const elapsedMs = end - start

  if (!res || res.value.err) {
    logger.info(
      { error: res?.value.err ?? 'timeout', commitment, elapsedMs },
      'Transaction failed to send'
    )
    throw new Error('Transaction failed to send')
  }
  logger.info({ commitment, elapsedMs }, 'Transaction sent successfully')
  return confirmationStrategy.signature
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
    const connection = connections[0]
    const confirmationStrategyArgs =
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
    const signature = base58.encode(transaction.signatures[0])

    const logger = res.locals.logger.child({ signature })
    logger.info('Sending transaction...')
    const confirmationStrategy = { ...confirmationStrategyArgs, signature }
    await sendTransactionWithRetries({
      transaction,
      sendOptions,
      commitment: commitment ?? 'processed',
      confirmationStrategy,
      logger
    })
    res.status(200).send({ signature })
    next()
    // Confirm, fetch, cache and forward after success response
    // Only wait for confirmation if we haven't already
    if (
      !commitment ||
      (commitment !== 'confirmed' && commitment !== 'finalized')
    ) {
      logger.info(
        { commitment: 'confirmed' },
        `Confirming transaction before fetching...`
      )
      await connection.confirmTransaction(confirmationStrategy, 'confirmed')
    }
    logger.info('Fetching transaction for caching...')
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
    logger.info('Forwarding transaction to other nodes to cache...')
    await forwardTransaction(logger, formattedResponse)
    logger.info('Request finished.')
  } catch (e) {
    next(e)
  }
}
