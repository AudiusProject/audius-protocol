import type { RelayRequestBody } from '@audius/sdk'
import {
  PublicKey,
  TransactionMessage,
  VersionedTransaction
} from '@solana/web3.js'
import bs58 from 'bs58'
import { Request, Response, NextFunction } from 'express'

import { config } from '../../config'
import { BadRequestError } from '../../errors'
import { connections } from '../../utils/connections'
import { getRequestIpData } from '../../utils/ipData'
import {
  broadcastTransaction,
  sendTransactionWithRetries
} from '../../utils/transaction'

import { assertRelayAllowedInstructions } from './assertRelayAllowedInstructions'
import { attachLocationData, isPaymentTransaction } from './attachLocationData'

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
    const responseTime = new Date().getTime() - res.locals.requestStartTime
    logger.info({ responseTime, statusCode: res.statusCode }, 'response sent')
    await broadcastTransaction({ logger, signature })
    next()
  } catch (e) {
    next(e)
  }
}
