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
import { cacheTransaction, getCachedDiscoveryNodes } from '../../redis'
import fetch from 'cross-fetch'
import { Logger } from 'pino'
import bs58 from 'bs58'
import { personalSign } from 'eth-sig-util'
import type { RelayRequestBody } from '@audius/sdk'
import { getRequestIpData } from '../../utils/ipData'
import { attachLocationData, isPaymentTransaction } from './attachLocationData'
import { connections } from '../../utils/connections'
import { broadcastTx, forwardTransaction } from '../../utils/broadcastTx'

const RETRY_DELAY_MS = 2 * 1000
const RETRY_TIMEOUT_MS = 60 * 1000

const delay = async (ms: number, options?: { signal: AbortSignal }) => {
  const signal = options?.signal
  return new Promise<void>((resolve, reject) => {
    if (signal?.aborted) {
      reject()
    }
    const listener = () => {
      clearTimeout(timer)
      reject()
    }
    const timer = setTimeout(() => {
      signal?.removeEventListener('abort', listener)
      resolve()
    }, ms)
    signal?.addEventListener('abort', listener)
  })
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

/**
 * Sends the transaction repeatedly to all configured RPCs until
 * it's been confirmed with the given commitment level, expires,
 * or times out.
 */
export const sendTransactionWithRetries = async ({
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

  let retryCount = 0
  const createRetryPromise = async (signal: AbortSignal): Promise<void> => {
    while (!signal.aborted) {
      Promise.any(
        connections.map((connection) =>
          connection.sendRawTransaction(serializedTx, {
            skipPreflight: true,
            maxRetries: 0,
            ...sendOptions
          })
        )
      ).catch((error) => {
        logger.warn({ error, retryCount }, `Failed retry...`)
      })
      await delay(RETRY_DELAY_MS)
      retryCount++
    }
  }

  const createTimeoutPromise = async (signal: AbortSignal) => {
    await delay(RETRY_TIMEOUT_MS)
    if (!signal.aborted) {
      logger.error('Timed out sending transaction')
    }
  }

  const start = Date.now()
  const connection = connections[0]
  const abortController = new AbortController()
  try {
    if (!sendOptions?.skipPreflight) {
      const simulatedRes = await connection.simulateTransaction(transaction)
      if (simulatedRes.value.err) {
        logger.error(
          { error: simulatedRes.value.err },
          'Transaction simulation failed'
        )
        throw simulatedRes.value.err
      }
    }

    const res = await Promise.race([
      createRetryPromise(abortController.signal),
      connection.confirmTransaction(
        { ...confirmationStrategy, abortSignal: abortController.signal },
        commitment
      ),
      createTimeoutPromise(abortController.signal)
    ])

    if (!res || res.value.err) {
      throw res?.value.err ?? 'Transaction polling timed out.'
    }
    logger.info({ commitment }, 'Transaction sent successfully')
    return confirmationStrategy.signature
  } catch (error) {
    logger.error({ error }, 'Transaction failed to send')
    throw error
  } finally {
    // Stop the other operations
    abortController.abort()
    const end = Date.now()
    const elapsedMs = end - start
    logger.info(
      { elapsedMs, retryCount },
      'sendTransactionWithRetries completed.'
    )
  }
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
    const commitment = confirmationOptions?.commitment ?? 'processed'
    const connection = connections[0]
    const strategy =
      confirmationOptions?.strategy ?? (await connection.getLatestBlockhash())
    const decoded = Buffer.from(encodedTransaction, 'base64')
    let transaction = VersionedTransaction.deserialize(decoded)

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

    if (isPaymentTransaction(decompiled.instructions)) {
      const location = await getRequestIpData(res.locals.logger, req)
      if (location) {
        transaction = new VersionedTransaction(
          attachLocationData({
            transactionMessage: decompiled,
            location
          }).compileToV0Message()
        )
      }
    }

    transaction.sign([feePayerKeyPair])
    const signature = bs58.encode(transaction.signatures[0])

    const logger = res.locals.logger.child({ signature })
    logger.info(
      { rpcEndpoints: connections.map((c) => c.rpcEndpoint) },
      'Sending transaction...'
    )
    const confirmationStrategy = { ...strategy, signature }
    await sendTransactionWithRetries({
      transaction,
      sendOptions,
      commitment,
      confirmationStrategy,
      logger
    })
    res.status(200).send({ signature })
    next()
    await broadcastTx({ logger, confirm: true, signature })
  } catch (e) {
    if (!res.writableEnded && e) {
      res.status(500).send({ error: e })
      next()
    } else {
      next(e)
    }
  }
}
