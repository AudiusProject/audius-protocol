import React, { useEffect } from 'react'

import { walletMessages } from '@audius/common/messages'
import {
  withdrawUSDCSelectors,
  useCoinflowWithdrawModal,
  WithdrawUSDCModalPages,
  useWithdrawUSDCModal,
  CoinflowWithdrawState
} from '@audius/common/store'
import { useField } from 'formik'
import { useSelector } from 'react-redux'

import { Flex, Text } from '@audius/harmony-native'

import type { WithdrawFormValues } from '../types'
import { AMOUNT } from '../types'

const { getCoinflowState } = withdrawUSDCSelectors

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
    <Flex gap='xl' alignItems='center' justifyContent='center' p='xl'>
      <Flex gap='m' alignItems='center' justifyContent='center'>
        <Text variant='heading' size='xl' textAlign='center'>
          {walletMessages.holdOn}
        </Text>
        <Text variant='body' textAlign='center' color='subdued'>
          {walletMessages.preparingTransfer}
        </Text>
        <Text variant='body' size='s' textAlign='center' color='subdued'>
          {walletMessages.pleaseWait}
        </Text>
        <Text variant='body' size='s' textAlign='center' color='accent'>
          {walletMessages.transferringFunds}
        </Text>
      </Flex>
    </Flex>
  )
}
