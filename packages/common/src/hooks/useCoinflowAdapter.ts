import { useEffect, useState } from 'react'

import { TransactionHandler } from '@audius/sdk/dist/core'
import { Connection, PublicKey, Transaction } from '@solana/web3.js'

import { getRootSolanaAccount } from '~/services/audius-backend'
import { useAppContext } from '~/context'

type CoinflowAdapter = {
  wallet: {
    publicKey: PublicKey
    sendTransaction: (transaction: Transaction) => Promise<string>
  }
  connection: Connection
}

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
