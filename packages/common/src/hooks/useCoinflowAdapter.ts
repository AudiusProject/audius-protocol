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

export const useCoinflowWithdrawalDecorator = () => {
  const { audiusBackend } = useAppContext()
  const feePayerOverride = useSelector(getFeePayer)
  return async (transaction: Transaction) => {
    if (!feePayerOverride) throw new Error('Missing fee payer override')
    const feePayer = new PublicKey(feePayerOverride)
    await decorateCoinflowWithdrawalTransaction(audiusBackend, {
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
      setAdapter({
        connection,
        wallet: {
          publicKey: wallet.publicKey,
          sendTransaction: async (transaction: Transaction) => {
            const finalTransaction =
              onSendTransacationRef.current != null
                ? await onSendTransacationRef.current(transaction)
                : transaction

            finalTransaction.partialSign(wallet)
            const { res, error, errorCode } = await relayTransaction(
              audiusBackend,
              {
                transaction: finalTransaction,
                skipPreflight: true
              }
            )
            if (!res) {
              console.error('Sending Coinflow transaction failed.', {
                error,
                errorCode,
                finalTransaction
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
