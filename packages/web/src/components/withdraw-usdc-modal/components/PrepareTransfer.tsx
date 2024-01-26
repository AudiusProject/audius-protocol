import { useEffect } from 'react'

import {
  CoinflowWithdrawState,
  withdrawUSDCSelectors,
  WithdrawUSDCModalPages,
  useWithdrawUSDCModal,
  useCoinflowWithdrawModal
} from '@audius/common'
import { Flex, Text } from '@audius/harmony'
import { useField } from 'formik'
import { useSelector } from 'react-redux'

import LoadingSpinner from 'components/loading-spinner/LoadingSpinner'

import { WithdrawFormValues, AMOUNT } from '../types'

import styles from './PrepareTransfer.module.css'

const { getCoinflowState } = withdrawUSDCSelectors

const messages = {
  holdOn: 'Hold on!',
  preparingTransfer:
    "We're preparing your transfer. This could take a few moments. Please do not close your browser."
}

export const PrepareTransfer = () => {
  const coinflowState = useSelector(getCoinflowState)
  const { onOpen } = useCoinflowWithdrawModal()
  const { setData } = useWithdrawUSDCModal()
  const [{ value: amountCents }] =
    useField<WithdrawFormValues[typeof AMOUNT]>(AMOUNT)

  useEffect(() => {
    if (coinflowState === CoinflowWithdrawState.READY_FOR_WITHDRAWAL) {
      setData({ page: WithdrawUSDCModalPages.COINFLOW_TRANSFER })
      onOpen({ amount: amountCents / 100.0 })
    }
  }, [coinflowState, setData, onOpen, amountCents])
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
