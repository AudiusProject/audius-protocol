import { useCallback } from 'react'

import {
  CoinflowWithdrawalState,
  useCoinflowAdapter,
  withdrawUSDCSelectors,
  withdrawUSDCActions
} from '@audius/common'
import { CoinflowWithdraw } from '@coinflowlabs/react'
import { useDispatch, useSelector } from 'react-redux'

import LoadingSpinner from 'components/loading-spinner/LoadingSpinner'
import { Flex, Text } from '@audius/harmony'

import styles from './CoinflowWithdrawPage.module.css'

const { getCoinflowState } = withdrawUSDCSelectors
const { coinflowWithdrawalSucceeded, coinflowWithdrawalCanceled } =
  withdrawUSDCActions

const messages = {
  preparing: 'Preparing transfer...'
}

/* TODO:
 - Pull coinflowStatus from the withdrawusdc slice
 - if funding wallet, show loading spinner
 - otherwise, show coinflow page
*/

const MERCHANT_ID = process.env.VITE_COINFLOW_MERCHANT_ID
const IS_PRODUCTION = process.env.VITE_ENVIRONMENT === 'production'

const RenderCoinflowWithdrawPage = () => {
  const adapter = useCoinflowAdapter()
  const dispatch = useDispatch()

  // const handleClose = useCallback(() => {
  //   dispatch(transactionCanceled({}))
  //   onClose()
  // }, [dispatch, onClose])

  const handleSuccess = useCallback(() => {
    dispatch(coinflowWithdrawalSucceeded())
  }, [dispatch])

  return adapter ? (
    <CoinflowWithdraw
      wallet={adapter.wallet}
      connection={adapter.connection}
      onSuccess={handleSuccess}
      merchantId={MERCHANT_ID || ''}
      env={IS_PRODUCTION ? 'prod' : 'sandbox'}
      blockchain='solana'
    />
  ) : null
}

export const CoinflowWithdrawPage = () => {
  const coinflowState = useSelector(getCoinflowState)
  return coinflowState === CoinflowWithdrawalState.FUNDING_ROOT_WALLET ? (
    <Flex
      direction='column'
      justifyContent='center'
      alignItems='center'
      gap='m'
      p='5xl'
    >
      <LoadingSpinner className={styles.spinner} />
      <Text variant='heading' size='m'>
        {messages.preparing}
      </Text>
    </Flex>
  ) : (
    <RenderCoinflowWithdrawPage />
  )
}
