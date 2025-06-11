import React, { useCallback } from 'react'

import { walletMessages } from '@audius/common/messages'
import {
  WithdrawUSDCModalPages,
  useWithdrawUSDCModal,
  WithdrawMethod
} from '@audius/common/store'
import { useFormikContext } from 'formik'

import { Button, Flex, Text, Divider, TextInput } from '@audius/harmony-native'
import { SegmentedControl } from 'app/components/core'

import { CashBalanceSection } from '../../add-funds-drawer/CashBalanceSection'
import type { WithdrawFormValues } from '../types'
import { AMOUNT, METHOD, ADDRESS } from '../types'

export const EnterTransferDetails = () => {
  const { values, setFieldValue, errors, touched, validateForm, setTouched } =
    useFormikContext<WithdrawFormValues>()
  const { setData } = useWithdrawUSDCModal()

  const onContinuePress = useCallback(async () => {
    const validationErrors = await validateForm()
    setTouched({
      [AMOUNT]: true,
      [METHOD]: true,
      [ADDRESS]: true
    })

    if (Object.keys(validationErrors).length === 0) {
      // Both methods should go to confirmation step first
      setData({ page: WithdrawUSDCModalPages.CONFIRM_TRANSFER_DETAILS })
    }
  }, [validateForm, setTouched, setData])

  const handleAmountChange = useCallback(
    (text: string) => {
      const numericValue = parseFloat(text) || 0
      setFieldValue(AMOUNT, numericValue)
    },
    [setFieldValue]
  )

  const handleDestinationChange = useCallback(
    (text: string) => {
      setFieldValue(ADDRESS, text)
    },
    [setFieldValue]
  )

  return (
    <Flex gap='xl'>
      <CashBalanceSection />
      <Divider orientation='horizontal' />
      <Flex gap='m'>
        <Flex gap='s'>
          <Text variant='heading' size='s' color='subdued'>
            {walletMessages.amountToWithdraw}
          </Text>
          <Text variant='body'>{walletMessages.howMuch}</Text>
        </Flex>
        <TextInput
          label={walletMessages.amountToWithdrawLabel}
          placeholder={walletMessages.amountToWithdrawLabel}
          value={values.amount.toString()}
          onChangeText={handleAmountChange}
          keyboardType='numeric'
          error={!!(touched.amount && errors.amount)}
        />
        {touched.amount && errors.amount && (
          <Text variant='body' size='s' color='danger'>
            {errors.amount}
          </Text>
        )}
      </Flex>
      <Divider orientation='horizontal' />
      <SegmentedControl
        options={[
          {
            key: WithdrawMethod.COINFLOW,
            text: walletMessages.bankAccount
          },
          {
            key: WithdrawMethod.MANUAL_TRANSFER,
            text: walletMessages.crypto
          }
        ]}
        selected={values.method}
        onSelectOption={(method) => setFieldValue(METHOD, method)}
        fullWidth
        equalWidth
      />
      {values.method === WithdrawMethod.COINFLOW && (
        <Text variant='body'>{walletMessages.transferDescription}</Text>
      )}
      {values.method === WithdrawMethod.MANUAL_TRANSFER && (
        <Flex gap='m'>
          <Flex gap='s'>
            <Text variant='heading' size='s' color='subdued'>
              {walletMessages.destination}
            </Text>
            <Text variant='body'>{walletMessages.destinationDescription}</Text>
          </Flex>
          <Flex gap='s'>
            <TextInput
              label={walletMessages.destination}
              placeholder={walletMessages.destination}
              value={values.address}
              onChangeText={handleDestinationChange}
              error={!!(touched.address && errors.address)}
            />
            {touched.address && errors.address && (
              <Text variant='body' size='s' color='danger'>
                {errors.address}
              </Text>
            )}
          </Flex>
        </Flex>
      )}

      <Button onPress={onContinuePress} fullWidth>
        {walletMessages.continue}
      </Button>
    </Flex>
  )
}
