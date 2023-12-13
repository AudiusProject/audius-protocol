import { useEffect, useState } from 'react'

import { Connection, PublicKey, Transaction } from '@solana/web3.js'

import { getRootSolanaAccount } from 'services/audius-backend'
import { useAppContext } from 'src/context'

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
            const res = await connection.sendRawTransaction(
              transaction.serialize()
            )
            return res
          }
        }
      })
    }
    initWallet()
  }, [audiusBackend])

  return adapter
}
