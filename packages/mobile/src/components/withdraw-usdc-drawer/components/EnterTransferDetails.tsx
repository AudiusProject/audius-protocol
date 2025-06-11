import type { RefObject } from 'react'
import { useCallback, useEffect } from 'react'

import { walletMessages } from '@audius/common/messages'
import {
  WithdrawUSDCModalPages,
  useWithdrawUSDCModal,
  WithdrawMethod
} from '@audius/common/store'
import { BottomSheetTextInput } from '@gorhom/bottom-sheet'
import type { BottomSheetScrollViewMethods } from '@gorhom/bottom-sheet/lib/typescript/components/bottomSheetScrollable/types'
import { useFormikContext } from 'formik'

import {
  Button,
  Flex,
  Text,
  Divider,
  TextInput,
  spacing
} from '@audius/harmony-native'
import { CashBalanceSection } from 'app/components/add-funds-drawer/CashBalanceSection'
import { SegmentedControl } from 'app/components/core'

import type { WithdrawFormValues } from '../types'
import { AMOUNT, METHOD, ADDRESS } from '../types'

export const EnterTransferDetails = ({
  scrollViewRef,
  balanceNumberCents
}: {
  scrollViewRef: RefObject<BottomSheetScrollViewMethods>
  balanceNumberCents: number
}) => {
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

  const handleMaxPress = useCallback(() => {
    const maxAmount = balanceNumberCents / 100
    setFieldValue(AMOUNT, maxAmount)
  }, [balanceNumberCents, setFieldValue])

  // Scroll to show the continue button when crypto option is selected
  useEffect(() => {
    if (values.method === WithdrawMethod.MANUAL_TRANSFER) {
      // Delay to ensure the destination field has rendered
      setTimeout(() => {
        scrollViewRef.current?.scrollToEnd({ animated: true })
      }, 100)
    }
  }, [values.method, scrollViewRef])

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
        <Flex gap='s'>
          <Flex row gap='s' alignItems='center'>
            <Flex style={{ flex: 1 }}>
              <TextInput
                label={walletMessages.amountToWithdrawLabel}
                placeholder={walletMessages.amountToWithdrawLabel}
                value={values.amount.toString()}
                onChangeText={handleAmountChange}
                keyboardType='numeric'
                error={!!(touched.amount && errors.amount)}
                TextInputComponent={BottomSheetTextInput as any}
              />
            </Flex>
            <Button
              variant='secondary'
              onPress={handleMaxPress}
              style={{
                height: '100%',
                paddingVertical: spacing.l,
                paddingHorizontal: spacing.xl
              }}
            >
              {walletMessages.max}
            </Button>
          </Flex>
          {touched.amount && errors.amount && (
            <Text variant='body' size='s' color='danger'>
              {errors.amount}
            </Text>
          )}
        </Flex>
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
              TextInputComponent={BottomSheetTextInput as any}
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
