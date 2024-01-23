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
import { env } from 'services/env'
import { isElectron } from 'utils/clientUtil'
import zIndex from 'utils/zIndex'

import styles from './CoinflowOnrampModal.module.css'

const { transactionSucceeded, transactionCanceled } = coinflowModalUIActions

const MERCHANT_ID = env.COINFLOW_MERCHANT_ID
const IS_PRODUCTION = env.ENVIRONMENT === 'production'

export const CoinflowOnrampModal = () => {
  const {
    data: { amount, serializedTransaction, purchaseMetadata },
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

  const handleClose = useCallback(() => {
    dispatch(transactionCanceled({}))
    onClose()
  }, [dispatch, onClose])

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
      onClose={handleClose}
      onClosed={onClosed}
    >
      {showContent ? (
        <CoinflowPurchase
          transaction={transaction}
          wallet={adapter.wallet}
          chargebackProtectionData={purchaseMetadata ? [purchaseMetadata] : []}
          connection={adapter.connection}
          onSuccess={handleSuccess}
          merchantId={MERCHANT_ID || ''}
          env={IS_PRODUCTION ? 'prod' : 'sandbox'}
          disableGooglePay={isElectron()}
          disableApplePay={isElectron()}
          blockchain='solana'
          amount={amount}
        />
      ) : null}
    </ModalDrawer>
  )
}
