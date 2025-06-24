import React from 'react'

import { walletMessages } from '@audius/common/messages'
import { useField } from 'formik'

import {
  Button,
  CompletionCheck,
  Divider,
  Flex,
  Text
} from '@audius/harmony-native'
import { CashBalanceSection } from 'app/components/add-funds-drawer/CashBalanceSection'

import type { WithdrawFormValues } from '../types'
import { ADDRESS, AMOUNT } from '../types'

type ErrorPageProps = {
  onClose: () => void
}

export const ErrorPage = ({ onClose }: ErrorPageProps) => {
  const [{ value: amountValue }] =
    useField<WithdrawFormValues[typeof AMOUNT]>(AMOUNT)
  const [{ value: addressValue }] =
    useField<WithdrawFormValues[typeof ADDRESS]>(ADDRESS)

  return (
    <Flex gap='xl'>
      <CashBalanceSection />
      <Divider orientation='horizontal' />

      <Flex gap='s'>
        <Text variant='heading' size='s' color='subdued'>
          {walletMessages.amountToWithdraw}
        </Text>
        <Text variant='heading' size='s'>
          {walletMessages.minus}
          {walletMessages.dollarSign}
          {amountValue}
        </Text>
      </Flex>

      {addressValue ? (
        <>
          <Divider orientation='horizontal' />
          <Flex alignItems='flex-start' gap='s'>
            <Text variant='heading' size='s' color='subdued'>
              {walletMessages.destination}
            </Text>
            <Text variant='body'>{addressValue}</Text>
          </Flex>
        </>
      ) : null}

      <Flex row gap='s' alignItems='center'>
        <CompletionCheck value='error' />
        <Text variant='body' size='s'>
          {walletMessages.error}
        </Text>
      </Flex>

      <Button onPress={onClose} fullWidth variant='secondary'>
        {walletMessages.close}
      </Button>
    </Flex>
  )
}
