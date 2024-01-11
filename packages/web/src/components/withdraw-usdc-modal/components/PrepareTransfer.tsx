import { useEffect } from 'react'

import {
  CoinflowWithdrawalState,
  withdrawUSDCSelectors,
  WithdrawUSDCModalPages,
  useWithdrawUSDCModal
} from '@audius/common'
import { Flex, Text } from '@audius/harmony'
import { useSelector } from 'react-redux'

import LoadingSpinner from 'components/loading-spinner/LoadingSpinner'

import styles from './PrepareTransfer.module.css'

const { getCoinflowState } = withdrawUSDCSelectors

const messages = {
  holdOn: 'Hold on!',
  preparingTransfer:
    "We're preparing your transfer. This could take a few moments."
}

export const PrepareTransfer = () => {
  const coinflowState = useSelector(getCoinflowState)
  const { setData } = useWithdrawUSDCModal()

  useEffect(() => {
    if (coinflowState === CoinflowWithdrawalState.READY_FOR_WITHDRAWAL) {
      setData({ page: WithdrawUSDCModalPages.COINFLOW_TRANSFER })
    }
  }, [coinflowState, setData])
  return (
    <Flex
      direction='column'
      justifyContent='center'
      alignItems='center'
      gap='m'
      p='m'
    >
      <Flex alignItems='center' justifyContent='center'>
        <LoadingSpinner className={styles.spinner} />
      </Flex>
      <Flex alignItems='center' justifyContent='center' gap='m'>
        <i className='emoji xl raised-hand' />
        <Text variant='heading' size='xl'>
          {messages.holdOn}
        </Text>
      </Flex>
      <Text variant='body' size='m'>
        {messages.preparingTransfer}
      </Text>
    </Flex>
  )
}
