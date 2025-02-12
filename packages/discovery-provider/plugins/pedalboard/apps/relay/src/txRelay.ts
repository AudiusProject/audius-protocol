import { config, wallets, web3 } from '.'
import { coreRelay } from './coreRelay'
import { internalError } from './error'
import { getCoreIndexerHealth } from './redis'
import { retryPromise } from './utils'
import { confirm } from './web3'
import {
  TransactionReceipt,
  TransactionRequest
} from '@ethersproject/abstract-provider'
import { NextFunction, Request, Response } from 'express'

export type RelayedTransaction = {
  receipt: TransactionReceipt
  transaction: TransactionRequest
}

export const relayTransaction = async (
  _req: Request,
  res: Response,
  next: NextFunction
) => {
  // pull info from validated request
  const { validatedRelayRequest, logger, requestId } = res.locals.ctx
  const { encodedABI, gasLimit, contractAddress } = validatedRelayRequest

  const senderWallet = wallets.selectNextWallet()
  const address = await senderWallet.getAddress()
  let nonce = undefined
  let submit = undefined
  try {
    if (config.environment === "dev") {
      const coreHealth = await getCoreIndexerHealth()
      logger.info({ coreHealth }, "core health from redis")
      const receipt = await coreRelay(logger, requestId, validatedRelayRequest)
      const indexingEntityManager = coreHealth?.indexing_entity_manager
      logger.info({ indexingEntityManager }, "indexing em")
      if (indexingEntityManager) {
        logger.info({ receipt }, "sending back")
        res.send({ receipt })
        next()
        return
      }
    }

    // gather some transaction params
    nonce = await retryPromise(() => web3.getTransactionCount(address))

    const to = contractAddress
    const value = '0x00'
    const data = encodedABI

    // assemble, sign, and send transaction
    const transaction = { nonce, gasLimit, to, value, data }
    await senderWallet.signTransaction(transaction)

    logger.info({ senderWallet: address, nonce }, 'submitting transaction')

    submit = await retryPromise(() => senderWallet.sendTransaction(transaction))

    // query chain until tx is mined
    const receipt = await confirm(submit.hash)
    receipt.blockNumber += config.finalPoaBlock
    logger.info(
      {
        senderWallet: address,
        nonce,
        txHash: submit?.hash,
        blocknumber: receipt.blockNumber
      },
      'transaction confirmation successful'
    )
    res.send({ receipt })
  } catch (e) {
    logger.error(
      { senderWallet: address, nonce, txHash: submit?.hash },
      'transaction submission failed'
    )
    internalError(next, e)
    return
  }
  next()
}
