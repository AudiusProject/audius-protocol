import { useEffect, useState } from 'react'

import {
  deriveUserBankPubkey,
  useAppContext,
  useCoinflowOnrampModal
} from '@audius/common'
import type { CoinflowSolanaPurchaseProps } from '@coinflowlabs/react'
import { CoinflowPurchase } from '@coinflowlabs/react-native'
import type { Connection } from '@solana/web3.js'
import { Transaction } from '@solana/web3.js'

import Drawer from 'app/components/drawer'

const MERCHANT_ID = process.env.VITE_COINFLOW_MERCHANT_ID
const IS_PRODUCTION = process.env.VITE_ENVIRONMENT === 'production'

type CoinflowAdapter = {
  wallet: CoinflowSolanaPurchaseProps['wallet']
  connection: Connection
}

const useCoinflowAdapter = () => {
  const { audiusBackend } = useAppContext()
  const [adapter, setAdapter] = useState<CoinflowAdapter | null>(null)

  useEffect(() => {
    const initWallet = async () => {
      const libs = await audiusBackend.getAudiusLibsTyped()
      if (!libs.solanaWeb3Manager) return
      const { connection } = libs.solanaWeb3Manager
      const publicKey = await deriveUserBankPubkey(audiusBackend, {
        mint: 'usdc'
      })
      setAdapter({
        connection,
        wallet: {
          publicKey,
          sendTransaction: async (
            transaction: any,
            connection: any,
            options: any
          ) => {
            console.debug('Sending transaction', transaction)
            return ''
          }
        }
      })
    }
    initWallet()
  }, [audiusBackend])

  return adapter
}

export const CoinflowOnrampDrawer = () => {
  const {
    data: { amount, serializedTransaction },
    isOpen,
    onClose,
    onClosed
  } = useCoinflowOnrampModal()
  const [transaction, setTransaction] = useState<Transaction | null>(null)

  const adapter = useCoinflowAdapter()

  useEffect(() => {
    if (serializedTransaction) {
      try {
        const deserialized = Transaction.from(
          Buffer.from(serializedTransaction, 'base64')
        )
        setTransaction(deserialized)
      } catch (e) {
        console.error(e)
      }
    } else {
      setTransaction(null)
    }
  }, [serializedTransaction])

  const showContent = isOpen && adapter && transaction

  /*
  TODO(coinflow):
  - Create Transaction
  - Implement sendTransaction()
  */

  return (
    <Drawer isOpen={isOpen} onClose={onClose} onClosed={onClosed}>
      {showContent ? (
        <CoinflowPurchase
          transaction={transaction}
          wallet={adapter.wallet}
          connection={adapter.connection}
          merchantId={MERCHANT_ID || ''}
          env={IS_PRODUCTION ? 'prod' : 'sandbox'}
          blockchain='solana'
          amount={amount}
        />
      ) : null}
    </Drawer>
  )
}
