import { useCallback, useEffect, useState } from 'react'

import {
  useCoinflowOnrampModal,
  coinflowModalUIActions,
  useCoinflowAdapter
} from '@audius/common'
import { CoinflowPurchase } from '@coinflowlabs/react'
import { Transaction } from '@solana/web3.js'
import { useDispatch } from 'react-redux'

import ModalDrawer from 'pages/audio-rewards-page/components/modals/ModalDrawer'
import zIndex from 'utils/zIndex'

import styles from './CoinflowOnrampModal.module.css'

const { transactionSucceeded } = coinflowModalUIActions

const MERCHANT_ID = process.env.VITE_COINFLOW_MERCHANT_ID
const IS_PRODUCTION = process.env.VITE_ENVIRONMENT === 'production'

export const CoinflowOnrampModal = () => {
  const {
    data: { amount, serializedTransaction },
    isOpen,
    onClose,
    onClosed
  } = useCoinflowOnrampModal()
  const dispatch = useDispatch()
  const [transaction, setTransaction] = useState<Transaction | undefined>(
    undefined
  )

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
    }
  }, [serializedTransaction])

  const handleSuccess = useCallback(() => {
    dispatch(transactionSucceeded({}))
    onClose()
  }, [dispatch, onClose])

  const showContent = isOpen && adapter

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
          onSuccess={handleSuccess}
          merchantId={MERCHANT_ID || ''}
          env={IS_PRODUCTION ? 'prod' : 'sandbox'}
          blockchain='solana'
          amount={amount}
        />
      ) : null}
    </ModalDrawer>
  )
}
