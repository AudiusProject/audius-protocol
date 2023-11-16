import { useEffect, useState } from 'react'

import {
  deriveUserBankPubkey,
  useAppContext,
  useCoinflowOnrampModal
} from '@audius/common'
import {
  CoinflowPurchase,
  CoinflowSolanaPurchaseProps
} from '@coinflowlabs/react'
import { Connection, Transaction } from '@solana/web3.js'

import ModalDrawer from 'pages/audio-rewards-page/components/modals/ModalDrawer'

import styles from './CoinflowOnrampModal.module.css'

const MERCHANT_ID = 'audius'

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
          sendTransaction: async (transaction, connection, options) => {
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

export const CoinflowOnrampModal = () => {
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
  TODO:
  - Create Transaction
  - Implement sendTransaction()
  */

  return (
    <ModalDrawer
      bodyClassName={styles.modalWrapper}
      zIndex={1000000}
      isOpen={isOpen}
      onClose={onClose}
      onClosed={onClosed}
    >
      {showContent ? (
        <CoinflowPurchase
          transaction={transaction}
          wallet={adapter.wallet}
          connection={adapter.connection}
          merchantId={MERCHANT_ID}
          env='sandbox'
          blockchain='solana'
          amount={amount}
        />
      ) : null}
    </ModalDrawer>
  )
}
