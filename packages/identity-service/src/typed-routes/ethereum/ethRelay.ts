import {
  errorResponseBadRequest,
  errorResponseServerError,
  handleResponse,
  successResponse
} from '../../apiHelpers'
import { parameterizedAuthMiddleware } from '../../authMiddleware'
import express, { type RequestHandler } from 'express'

import { createWalletClient, http, type Hex, parseTransaction } from 'viem'
import { mainnet } from 'viem/chains'
import { privateKeyToAccount } from 'viem/accounts'
import config from '../../config'
import { generateETHWalletLockKey } from '../../relay/ethTxRelay'
import { Lock } from '../../redis'

import crypto from 'crypto'

type RelayRequestBody = {
  transaction: Hex
}

const ethRelayerWallets = config.get('ethRelayerWallets')

const getRandomRelayerWallet = () => {
  const i = Math.floor(Math.random() * ethRelayerWallets.length)
  return ethRelayerWallets[i]
}

async function delay(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

const lock = async (key: string) => {
  while ((await Lock.setLock(key)) !== true) {
    await delay(200)
  }
}

const unlock = async (key: string) => {
  await Lock.clearLock(key)
}

const createRouter = () => {
  const router = express.Router()
  router.post(
    '/relay',
    parameterizedAuthMiddleware({ shouldRespondBadRequest: true }),
    handleResponse(<RequestHandler<any, any, RelayRequestBody>>(async (req) => {
      const logger = req.logger.child({
        requestId: crypto
          .createHash('sha256')
          .update(JSON.stringify(req.body))
          .digest('hex')
      })
      const relayer = getRandomRelayerWallet()
      const lockKey = generateETHWalletLockKey(relayer.publicKey)
      try {
        if (!req.body.transaction) {
          return errorResponseBadRequest('Missing transaction to relay')
        }
        logger.info({ lockKey }, 'Waiting for wallet lock...')
        await lock(lockKey)
        logger.info({ lockKey }, 'Acquired wallet lock.')
        const walletClient = createWalletClient({
          chain: mainnet,
          transport: http(config.get('ethProviderUrl'))
        })

        const account = privateKeyToAccount(('0x' + relayer.privateKey) as Hex)
        const transaction = parseTransaction(req.body.transaction)
        logger.info({ transaction }, 'Sending transaction...')
        logger.info(walletClient, 'walletClient')
        const hash = await walletClient.sendTransaction({
          account,
          to: transaction.to,
          data: transaction.data,
          gas: transaction.gas,
          nonce: transaction.nonce,
          value: transaction.value
        })
        logger.info({ hash }, 'Transaction sent.')
        return successResponse({ hash })
      } catch (e) {
        logger.error(e, 'Error relaying transaction')
        return errorResponseServerError('Something went wrong')
      } finally {
        logger.info({ lockKey }, 'Unlocking wallet lock...')
        await unlock(lockKey)
        logger.info({ lockKey }, 'Wallet lock released.')
      }
    }))
  )
  return router
}

export const ethereumRouter = createRouter()
