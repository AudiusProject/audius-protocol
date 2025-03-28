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

const txRelay = async (res: Response): Promise<TransactionReceipt | null> => {
  let nonce = undefined
  let submit = undefined
  const { validatedRelayRequest, logger } = res.locals.ctx
  try {
    const { encodedABI, gasLimit, contractAddress } = validatedRelayRequest

    const senderWallet = wallets.selectNextWallet()
    const address = await senderWallet.getAddress()

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
    const receipt: TransactionReceipt = await confirm(submit.hash)
    receipt.blockNumber += config.finalPoaBlock
    logger.info(
      {
        nonce,
        txHash: submit?.hash,
        blocknumber: receipt.blockNumber
      },
      'transaction confirmation successful'
    )
    return receipt
  } catch (e) {
    logger.error(
      { nonce, txHash: submit?.hash },
      'transaction submission failed'
    )
    return null
  }

}

export const relayTransaction = async (
  _req: Request,
  res: Response,
  next: NextFunction
) => {
  // pull info from validated request
  const { validatedRelayRequest, logger, requestId } = res.locals.ctx
  try {
    const coreHealth = await getCoreIndexerHealth()
    const indexingEntityManager = coreHealth?.indexing_entity_manager
    if (indexingEntityManager) {
      const receipt = await coreRelay(logger, requestId, validatedRelayRequest)
      logger.info({ receipt }, "sending back")
      res.send({ receipt })
      // fire and forget acdc relay if using core
      txRelay(res)
    } else {
      const receipt = await txRelay(res)
      res.send({ receipt })
      // fire and forget but still send
      coreRelay(logger, requestId, validatedRelayRequest)
    }
  } catch (e) {
    internalError(next, e)
    return
  }
}
