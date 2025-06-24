import type { RefObject } from 'react'
import React, { useCallback, useState } from 'react'

import { walletMessages } from '@audius/common/messages'
import {
  WithdrawUSDCModalPages,
  useWithdrawUSDCModal,
  WithdrawMethod
} from '@audius/common/store'
import {
  filterDecimalString,
  decimalIntegerToHumanReadable,
  padDecimalValue
} from '@audius/common/utils'
import { BottomSheetTextInput } from '@gorhom/bottom-sheet'
import type { BottomSheetScrollViewMethods } from '@gorhom/bottom-sheet/lib/typescript/components/bottomSheetScrollable/types'
import { useField, useFormikContext } from 'formik'

import {
  Button,
  Flex,
  Text,
  Divider,
  spacing,
  useTheme
} from '@audius/harmony-native'
import { CashBalanceSection } from 'app/components/add-funds-drawer/CashBalanceSection'
import { SegmentedControl } from 'app/components/core'
import { TextField } from 'app/components/fields'

import type { WithdrawFormValues } from '../types'
import { AMOUNT, METHOD, ADDRESS } from '../types'

export const EnterTransferDetails = ({
  scrollViewRef,
  balanceNumberCents,
  scrollPendingRef
}: {
  scrollViewRef: RefObject<BottomSheetScrollViewMethods>
  balanceNumberCents: number
  scrollPendingRef?: React.MutableRefObject<boolean>
}) => {
  const { validateForm } = useFormikContext<WithdrawFormValues>()
  const { color } = useTheme()
  const [
    { value: amountValue },
    { error: amountError, touched: amountTouched },
    { setValue: setAmount, setTouched: setAmountTouched }
  ] = useField(AMOUNT)
  const [, { error: addressError }, { setTouched: setAddressTouched }] =
    useField(ADDRESS)
  const { setData } = useWithdrawUSDCModal()
  const [{ value: methodValue }, _ignoredMethodMeta, { setValue: setMethod }] =
    useField<WithdrawMethod>(METHOD)
  const [humanizedValue, setHumanizedValue] = useState(
    decimalIntegerToHumanReadable(amountValue)
  )

  const ThemedBottomSheetTextInput = useCallback(
    React.forwardRef<any, any>((props, ref) => {
      return (
        <BottomSheetTextInput
          {...props}
          ref={ref}
          style={[
            props.style,
            {
              color: color.text.default,
              backgroundColor: color.background.surface1
            }
          ]}
          placeholderTextColor={color.text.subdued}
        />
      )
    }),
    [color]
  )

  const onContinuePress = useCallback(async () => {
    setAmountTouched(true)
    if (methodValue === WithdrawMethod.MANUAL_TRANSFER) {
      setAddressTouched(true)
    }
    const errors = await validateForm()
    if (errors[AMOUNT] || errors[ADDRESS]) return
    setData({ page: WithdrawUSDCModalPages.CONFIRM_TRANSFER_DETAILS })
  }, [validateForm, setData, setAmountTouched, setAddressTouched, methodValue])

  const handleAmountChange = useCallback(
    (text: string) => {
      const { human, value } = filterDecimalString(text)
      setHumanizedValue(human)
      setAmount(value)
      setAmountTouched(true)
    },
    [setAmount, setAmountTouched]
  )

  const handleAmountBlur = useCallback(
    (text: string) => {
      setHumanizedValue(padDecimalValue(text))
      setAmountTouched(true)
    },
    [setHumanizedValue, setAmountTouched]
  )

  const handleMaxPress = useCallback(() => {
    setHumanizedValue(decimalIntegerToHumanReadable(balanceNumberCents))
    setAmount(balanceNumberCents)
  }, [balanceNumberCents, setAmount])

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
              <TextField
                label={walletMessages.amountToWithdrawLabel}
                placeholder={walletMessages.amountToWithdrawLabel}
                keyboardType='numeric'
                name={AMOUNT}
                onChangeText={handleAmountChange}
                value={humanizedValue}
                onBlur={() => handleAmountBlur(humanizedValue)}
                startAdornmentText={walletMessages.dollarSign}
                TextInputComponent={ThemedBottomSheetTextInput as any}
                noGutter
                errorBeforeSubmit
                required
                shouldShowError={false}
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
          {amountTouched && amountError && (
            <Text variant='body' size='s' color='danger'>
              {amountError}
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
        selected={methodValue}
        onSelectOption={(method) => setMethod(method)}
        fullWidth
        equalWidth
      />
      {methodValue === WithdrawMethod.COINFLOW && (
        <Text variant='body'>{walletMessages.transferDescription}</Text>
      )}
      {methodValue === WithdrawMethod.MANUAL_TRANSFER && (
        <Flex gap='m'>
          <Flex gap='s'>
            <Text variant='heading' size='s' color='subdued'>
              {walletMessages.destination}
            </Text>
            <Text variant='body'>{walletMessages.destinationDescription}</Text>
          </Flex>
          <TextField
            label={walletMessages.destination}
            placeholder={walletMessages.destination}
            name={ADDRESS}
            TextInputComponent={ThemedBottomSheetTextInput as any}
            keyboardType='default'
            autoCapitalize='none'
            autoCorrect={false}
            onFocus={() => {
              if (scrollPendingRef) {
                scrollPendingRef.current = true
              }
            }}
            noGutter
            errorBeforeSubmit
            required
          />
        </Flex>
      )}

      <Button
        onPress={onContinuePress}
        fullWidth
        disabled={!!addressError || !!amountError}
      >
        {walletMessages.continue}
      </Button>
    </Flex>
  )
}
