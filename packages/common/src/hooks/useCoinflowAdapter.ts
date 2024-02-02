import { useEffect, useState } from 'react'

import { TransactionHandler } from '@audius/sdk/dist/core'
import { Connection, PublicKey, Transaction } from '@solana/web3.js'
import { useSelector } from 'react-redux'

import {
  getRootSolanaAccount,
  decorateCoinflowWithdrawalTransaction,
  relayTransaction
} from 'services/audius-backend'
import { useAppContext } from 'src/context'
import { getFeePayer } from 'store/solana/selectors'

type CoinflowAdapter = {
  wallet: {
    publicKey: PublicKey
    sendTransaction: (transaction: Transaction) => Promise<string>
  }
  connection: Connection
}

/** An adapter for signing and sending Coinflow withdrawal transactions. It will decorate
 * the incoming transaction to route it through a user bank. The transcation will then be
 * signed with the current user's Solana root wallet and sent/confirmed via Relay.
 */
export const useCoinflowWithdrawalAdapter = () => {
  const { audiusBackend } = useAppContext()
  const [adapter, setAdapter] = useState<CoinflowAdapter | null>(null)
  const feePayerOverride = useSelector(getFeePayer)

  useEffect(() => {
    const initWallet = async () => {
      const libs = await audiusBackend.getAudiusLibsTyped()
      if (!libs.solanaWeb3Manager) return
      const { connection } = libs.solanaWeb3Manager
      const wallet = await getRootSolanaAccount(audiusBackend)

      setAdapter({
        connection,
        wallet: {
          publicKey: wallet.publicKey,
          sendTransaction: async (transaction: Transaction) => {
            if (!feePayerOverride) throw new Error('Missing fee payer override')
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
              throw new Error(
                `Relaying Coinflow transaction failed: ${
                  error ?? 'Unknown error'
                }`
              )
            }
            return res
          }
        }
      })
    }
    initWallet()
  }, [audiusBackend])

  return adapter
}

/** An adapter for signing and sending unmodified Coinflow transactions. Will partialSign with the
 * current user's Solana root wallet and send/confirm locally (no relay).
 */
export const useCoinflowAdapter = () => {
  const { audiusBackend } = useAppContext()
  const [adapter, setAdapter] = useState<CoinflowAdapter | null>(null)

  useEffect(() => {
    const initWallet = async () => {
      const libs = await audiusBackend.getAudiusLibsTyped()
      if (!libs.solanaWeb3Manager) return
      const { connection } = libs.solanaWeb3Manager
      const wallet = await getRootSolanaAccount(audiusBackend)
      setAdapter({
        connection,
        wallet: {
          publicKey: wallet.publicKey,
          sendTransaction: async (transaction: Transaction) => {
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
            return res
          }
        }
      })
    }
    initWallet()
  }, [audiusBackend])

  return adapter
}
