import { useCallback } from 'react'

import { useCoinflowWithdrawalAdapter } from '@audius/common/hooks'
import { ErrorLevel } from '@audius/common/src/models/ErrorReporting'
import {
  useCoinflowWithdrawModal,
  withdrawUSDCActions,
  withdrawUSDCSelectors
} from '@audius/common/store'
import { CoinflowWithdraw } from '@coinflowlabs/react'
import { useDispatch, useSelector } from 'react-redux'

import ModalDrawer from 'pages/audio-rewards-page/components/modals/ModalDrawer'
import { authService } from 'services/audius-sdk'
import { env } from 'services/env'
import { reportToSentry } from 'store/errors/reportToSentry'
import zIndex from 'utils/zIndex'

import styles from './CoinflowWithdrawModal.module.css'

const { getWithdrawAmount } = withdrawUSDCSelectors
const { coinflowWithdrawalCanceled, coinflowWithdrawalSucceeded } =
  withdrawUSDCActions

const parseTransactionFromSuccessParams = (params: string) => {
  try {
    const parsed = JSON.parse(params)
    return parsed.data as string
  } catch (e) {
    console.error(
      `Failed to parse transaction from params: ${params}, received error: ${e}`
    )
    return ''
  }
}

const MERCHANT_ID = env.COINFLOW_MERCHANT_ID
const IS_PRODUCTION = env.ENVIRONMENT === 'production'

export const CoinflowWithdrawModal = () => {
  const { isOpen, onClose, onClosed } = useCoinflowWithdrawModal()
  const amount = useSelector(getWithdrawAmount)

  const privateKey = authService.getWallet()?.getPrivateKey()
  if (!privateKey) {
    reportToSentry({
      level: ErrorLevel.Error,
      error: new Error('No private key found in coinflow withdrawal modal')
    })
  }
  const adapter = useCoinflowWithdrawalAdapter({
    privateKey: privateKey ?? Buffer.from('')
  })
  const dispatch = useDispatch()

  const handleClose = useCallback(() => {
    dispatch(coinflowWithdrawalCanceled())
    onClose()
  }, [dispatch, onClose])

  const handleSuccess = useCallback(
    (params: string) => {
      const transaction = parseTransactionFromSuccessParams(params)
      dispatch(coinflowWithdrawalSucceeded({ transaction }))
      onClose()
    },
    [dispatch, onClose]
  )

  const showContent = isOpen && adapter && amount !== undefined

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
        <CoinflowWithdraw
          amount={amount / 100}
          lockAmount={true}
          wallet={adapter.wallet}
          connection={adapter.connection}
          onSuccess={handleSuccess}
          merchantId={MERCHANT_ID || ''}
          env={IS_PRODUCTION ? 'prod' : 'sandbox'}
          blockchain='solana'
        />
      ) : null}
    </ModalDrawer>
  )
}
