import React, { useCallback } from 'react'

import { walletMessages } from '@audius/common/messages'
import {
  useWithdrawUSDCModal,
  WithdrawUSDCModalPages
} from '@audius/common/store'
import { useFormikContext } from 'formik'

import { Button, Divider, Flex, Text } from '@audius/harmony-native'
import { CashBalanceSection } from 'app/components/add-funds-drawer/CashBalanceSection'

import type { WithdrawFormValues } from '../types'

export const CoinflowConfirmTransfer = () => {
  const { submitForm, values } = useFormikContext<WithdrawFormValues>()
  const { setData } = useWithdrawUSDCModal()

  const handleConfirm = useCallback(() => {
    setData({ page: WithdrawUSDCModalPages.PREPARE_TRANSFER })
    submitForm()
  }, [submitForm, setData])

  const handleBackPress = useCallback(() => {
    setData({ page: WithdrawUSDCModalPages.ENTER_TRANSFER_DETAILS })
  }, [setData])

  return (
    <Flex gap='xl'>
      <CashBalanceSection />
      <Divider orientation='horizontal' />
      <Flex gap='s'>
        <Text variant='heading' size='s' color='subdued'>
          {walletMessages.amountToWithdraw}
        </Text>
        <Text variant='display' size='s'>
          {walletMessages.minus}
          {walletMessages.dollarSign}
          {values.amount}
        </Text>
      </Flex>
      <Text variant='body'>{walletMessages.transferDescription}</Text>

      <Flex gap='s'>
        <Button onPress={handleConfirm} fullWidth>
          {walletMessages.withdraw}
        </Button>
        <Button onPress={handleBackPress} fullWidth variant='secondary'>
          {walletMessages.back}
        </Button>
      </Flex>
    </Flex>
  )
}
