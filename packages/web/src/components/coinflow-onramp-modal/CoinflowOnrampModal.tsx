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
import zIndex from 'utils/zIndex'

import styles from './CoinflowOnrampModal.module.css'

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
  TODO(coinflow):
  - Create Transaction
  - Implement sendTransaction()
  */

  return (
    <ModalDrawer
      bodyClassName={styles.modalBody}
      wrapperClassName={styles.modalWrapper}
      zIndex={zIndex.COINFLOW_ONRAMP_MODAL}
      isFullscreen
      isOpen={isOpen}
      onClose={onClose}
      onClosed={onClosed}
    >
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
    </ModalDrawer>
  )
}
