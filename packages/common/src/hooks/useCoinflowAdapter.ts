import { useEffect, useRef, useState } from 'react'

import { Connection, PublicKey, Transaction } from '@solana/web3.js'

import {
  decorateCoinflowWithdrawalTransaction,
  getRootSolanaAccount,
  relayTransaction
} from 'services/audius-backend'
import { useAppContext } from 'src/context'
import { useSelector } from 'react-redux'
import { getFeePayer } from 'store/solana/selectors'
import { TransactionHandler } from '@audius/sdk/dist/core'

type CoinflowAdapter = {
  wallet: {
    publicKey: PublicKey
    sendTransaction: (transaction: Transaction) => Promise<string>
  }
  connection: Connection
}

type UseCoinflowAdapterArgs = {
  onSendTransaction?: (transaction: Transaction) => Promise<Transaction>
}

type TransactionDecorator = (transaction: Transaction) => Promise<Transaction>

export const useCoinflowWithdrawalDecorator = () => {
  const { audiusBackend } = useAppContext()
  const feePayerOverride = useSelector(getFeePayer)
  return async (transaction: Transaction) => {
    if (!feePayerOverride) throw new Error('Missing fee payer override')
    const feePayer = new PublicKey(feePayerOverride)
    return await decorateCoinflowWithdrawalTransaction(audiusBackend, {
      transaction,
      feePayer
    })
  }
}

export const useCoinflowAdapter = ({
  onSendTransaction
}: UseCoinflowAdapterArgs = {}) => {
  const { audiusBackend } = useAppContext()
  const [adapter, setAdapter] = useState<CoinflowAdapter | null>(null)
  const onSendTransacationRef =
    useRef<UseCoinflowAdapterArgs['onSendTransaction']>(onSendTransaction)
  onSendTransacationRef.current = onSendTransaction

  useEffect(() => {
    const initWallet = async () => {
      const libs = await audiusBackend.getAudiusLibsTyped()
      if (!libs.solanaWeb3Manager) return
      const { connection } = libs.solanaWeb3Manager
      const wallet = await getRootSolanaAccount(audiusBackend)

      // Decorators will modify the transaction and use a fee payer override, so
      // they need to be relayed
      const decorateAndRelayTransaction = async (
        transaction: Transaction,
        decorator: TransactionDecorator
      ) => {
        const finalTransaction = await decorator(transaction)
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
            `Relaying Coinflow transaction failed: ${error ?? 'Unknown error'}`
          )
        }
        return res
      }

      // Unmodified transactions are sent directly
      const sendAndConfirmTransaction = async (transaction: Transaction) => {
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
            `Sending Coinflow transaction failed: ${error ?? 'Unknown error'}`
          )
        }
        return res
      }
      setAdapter({
        connection,
        wallet: {
          publicKey: wallet.publicKey,
          sendTransaction: async (transaction: Transaction) => {
            return onSendTransacationRef.current != null
              ? await decorateAndRelayTransaction(
                  transaction,
                  onSendTransacationRef.current
                )
              : await sendAndConfirmTransaction(transaction)
          }
        }
      })
    }
    initWallet()
  }, [audiusBackend])

  return adapter
}
