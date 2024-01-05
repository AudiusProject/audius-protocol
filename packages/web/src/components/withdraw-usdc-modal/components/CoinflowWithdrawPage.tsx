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
const { coinflowWithdrawalSucceeded } = withdrawUSDCActions

const messages = {
  preparing: 'Preparing transfer...'
}

const MERCHANT_ID = process.env.VITE_COINFLOW_MERCHANT_ID
const IS_PRODUCTION = process.env.VITE_ENVIRONMENT === 'production'

const RenderCoinflowWithdrawPage = () => {
  const adapter = useCoinflowAdapter()
  const dispatch = useDispatch()

  const handleSuccess = useCallback(
    (params: string) => {
      console.log(`Coinflow withdrawal succeeded: ${params}`)
      dispatch(coinflowWithdrawalSucceeded())
    },
    [dispatch]
  )

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
    <Flex justifyContent='center' alignItems='center' gap='m' p='4xl'>
      <LoadingSpinner className={styles.spinner} />
      <Text variant='heading' size='m'>
        {messages.preparing}
      </Text>
    </Flex>
  ) : (
    <RenderCoinflowWithdrawPage />
  )
}
