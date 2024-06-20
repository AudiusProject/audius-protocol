import { useEffect, useState } from 'react'

import { TransactionHandler } from '@audius/sdk/dist/core'
import {
  Connection,
  PublicKey,
  Transaction,
  VersionedTransaction
} from '@solana/web3.js'
import { useSelector, useDispatch } from 'react-redux'

import { useAudiusQueryContext } from '~/audius-query'
import { useAppContext } from '~/context'
import { Name } from '~/models/Analytics'
import { FeatureFlags } from '~/services'
import {
  decorateCoinflowWithdrawalTransaction,
  relayTransaction,
  getRootSolanaAccount
} from '~/services/audius-backend'
import {
  BuyUSDCError,
  PurchaseContentError,
  PurchaseErrorCode,
  purchaseContentActions
} from '~/store'
import { BuyCryptoError } from '~/store/buy-crypto/types'
import { getFeePayer } from '~/store/solana/selectors'

import { useFeatureFlag } from './useFeatureFlag'

type CoinflowAdapter = {
  wallet: {
    publicKey: PublicKey
    sendTransaction: (
      transaction: Transaction | VersionedTransaction
    ) => Promise<string>
  }
  connection: Connection
}

/** An adapter for signing and sending Coinflow withdrawal transactions. It will decorate
 * the incoming transaction to route it through a user bank. The transcation will then be
 * signed with the current user's Solana root wallet and sent/confirmed via Relay.
 */
export const useCoinflowWithdrawalAdapter = () => {
  const {
    audiusBackend,
    analytics: { make, track }
  } = useAppContext()
  const [adapter, setAdapter] = useState<CoinflowAdapter | null>(null)
  const feePayerOverride = useSelector(getFeePayer)

  useEffect(() => {
    const initWallet = async () => {
      const libs = await audiusBackend.getAudiusLibsTyped()
      if (!libs.solanaWeb3Manager) return
      const connection = libs.solanaWeb3Manager.getConnection()
      const wallet = await getRootSolanaAccount(audiusBackend)

      setAdapter({
        connection,
        wallet: {
          publicKey: wallet.publicKey,
          sendTransaction: async (
            transaction: Transaction | VersionedTransaction
          ) => {
            if (!feePayerOverride) {
              throw new Error('Missing fee payer override')
            }
            if (transaction instanceof VersionedTransaction) {
              throw new Error(
                'VersionedTransaction not supported in withdrawal adapter'
              )
            }
            const feePayer = new PublicKey(feePayerOverride)
            const finalTransaction =
              await decorateCoinflowWithdrawalTransaction(audiusBackend, {
                transaction,
                feePayer
              })
            finalTransaction.partialSign(wallet)
            const { res, error, errorCode } = await relayTransaction(
              audiusBackend,
              {
                transaction: finalTransaction,
                skipPreflight: true
              }
            )
            if (!res) {
              console.error('Relaying Coinflow transaction failed.', {
                error,
                errorCode,
                finalTransaction
              })
              track(
                make({
                  eventName:
                    Name.WITHDRAW_USDC_COINFLOW_SEND_TRANSACTION_FAILED,
                  error: error ?? undefined,
                  errorCode: errorCode ?? undefined
                })
              )
              throw new Error(
                `Relaying Coinflow transaction failed: ${
                  error ?? 'Unknown error'
                }`
              )
            }
            track(
              make({
                eventName: Name.WITHDRAW_USDC_COINFLOW_SEND_TRANSACTION,
                signature: res
              })
            )
            return res
          }
        }
      })
    }
    initWallet()
  }, [audiusBackend, feePayerOverride, make, track])

  return adapter
}

/** An adapter for signing and sending unmodified Coinflow transactions. Will partialSign with the
 * current user's Solana root wallet and send/confirm locally (no relay).
 * @param onSuccess optional callback to invoke when the relay succeeds
 */
export const useCoinflowAdapter = ({
  onSuccess,
  onFailure
}: {
  onSuccess: () => void
  onFailure: () => void
}) => {
  const { audiusBackend } = useAppContext()
  const [adapter, setAdapter] = useState<CoinflowAdapter | null>(null)
  const { isEnabled: isUseSDKPurchaseTrackEnabled } = useFeatureFlag(
    FeatureFlags.USE_SDK_PURCHASE_TRACK
  )
  const { audiusSdk } = useAudiusQueryContext()
  const dispatch = useDispatch()

  useEffect(() => {
    const initWallet = async () => {
      const libs = await audiusBackend.getAudiusLibsTyped()
      if (!libs.solanaWeb3Manager) return
      const connection = libs.solanaWeb3Manager.getConnection()
      const wallet = await getRootSolanaAccount(audiusBackend)
      setAdapter({
        connection,
        wallet: {
          publicKey: wallet.publicKey,
          sendTransaction: async (tx: Transaction | VersionedTransaction) => {
            try {
              if (isUseSDKPurchaseTrackEnabled) {
                const transaction = tx as VersionedTransaction
                const sdk = await audiusSdk()

                // Get a more recent blockhash to prevent BlockhashNotFound errors
                transaction.message.recentBlockhash = (
                  await connection.getLatestBlockhash()
                ).blockhash

                // Use our own fee payer as signer
                transaction.message.staticAccountKeys[0] =
                  await sdk.services.solanaRelay.getFeePayer()
                transaction.signatures[0] = Buffer.alloc(64, 0)

                // Sign with user's Eth wallet derived "root" Solana wallet,
                // which is the source of the funds for the purchase
                transaction.sign([wallet])

                // Send to relay to make use of retry and caching logic
                const { signature } = await sdk.services.solanaRelay.relay({
                  transaction,
                  sendOptions: {
                    skipPreflight: true
                  }
                })
                onSuccess()
                return signature
              } else {
                const transaction = tx as Transaction
                transaction.partialSign(wallet)
                const transactionHandler = new TransactionHandler({
                  connection,
                  useRelay: false
                })
                const { res, error, errorCode } =
                  await transactionHandler.handleTransaction({
                    instructions: transaction.instructions,
                    recentBlockhash: transaction.recentBlockhash,
                    skipPreflight: true,
                    feePayerOverride: transaction.feePayer,
                    signatures: transaction.signatures.map((s) => ({
                      signature: s.signature!, // already completely signed
                      publicKey: s.publicKey.toBase58()
                    }))
                  })
                if (!res) {
                  console.error('Sending Coinflow transaction failed.', {
                    error,
                    errorCode,
                    transaction
                  })
                  throw new Error(
                    `Sending Coinflow transaction failed: ${
                      error ?? 'Unknown error'
                    }`
                  )
                }
                onSuccess()
                return res
              }
            } catch (e) {
              console.error('Caught error in sendTransaction', e)
              const error =
                e instanceof PurchaseContentError ||
                e instanceof BuyUSDCError ||
                e instanceof BuyCryptoError
                  ? e
                  : new PurchaseContentError(PurchaseErrorCode.Unknown, `${e}`)
              dispatch(
                purchaseContentActions.purchaseContentFlowFailed({ error })
              )
              onFailure()
              throw e
            }
          }
        }
      })
    }
    initWallet()
  }, [
    audiusBackend,
    isUseSDKPurchaseTrackEnabled,
    audiusSdk,
    dispatch,
    onSuccess,
    onFailure
  ])

  return adapter
}
