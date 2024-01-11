import { useEffect } from 'react'

import {
  CoinflowWithdrawalState,
  withdrawUSDCSelectors,
  WithdrawUSDCModalPages,
  useWithdrawUSDCModal
} from '@audius/common'
import { useSelector } from 'react-redux'

import LoadingSpinner from 'components/loading-spinner/LoadingSpinner'
import { Flex, Text } from '@audius/harmony'

import styles from './PrepareTransfer.module.css'

const { getCoinflowState } = withdrawUSDCSelectors

const messages = {
  preparing: 'Preparing Transfer',
  subtext: 'This will take a few moments...'
}

export const PrepareTransfer = () => {
  const coinflowState = useSelector(getCoinflowState)
  const { setData } = useWithdrawUSDCModal()

  useEffect(() => {
    if (coinflowState === CoinflowWithdrawalState.READY_FOR_WITHDRAWAL) {
      setData({ page: WithdrawUSDCModalPages.COINFLOW_TRANSFER })
    }
  }, [coinflowState])
  return (
    <Flex justifyContent='center' alignItems='center' gap='m' p='4xl'>
      <Flex alignItems='center' justifyContent='center'>
        <LoadingSpinner className={styles.spinner} />
      </Flex>
      <Flex alignItems='start' justifyContent='center' direction='column'>
        <Text variant='heading' size='m'>
          {messages.preparing}
        </Text>
        <Text variant='body' size='m'>
          {messages.subtext}
        </Text>
      </Flex>
    </Flex>
  )
}
