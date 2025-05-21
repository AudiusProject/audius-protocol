import { useCallback, useState } from 'react'

import { useUSDCBalance } from '@audius/common/hooks'
import {
  WithdrawUSDCModalPages,
  useWithdrawUSDCModal,
  WithdrawMethod
} from '@audius/common/store'
import { decimalIntegerToHumanReadable } from '@audius/common/utils'
import { Button, Text, Flex, Checkbox } from '@audius/harmony'
import { useField, useFormikContext } from 'formik'

import { CashBalanceSection } from 'components/add-cash/CashBalanceSection'
import { HelperText } from 'components/data-entry/HelperText'
import { Divider } from 'components/divider'

import { ADDRESS, AMOUNT, CONFIRM, METHOD } from '../types'

const messages = {
  currentBalance: 'Current Balance',
  amountToWithdraw: 'Amount to Withdraw',
  destinationAddress: 'Destination Address',
  review: 'Review Details Carefully',
  byProceeding:
    'By proceeding, you accept full responsibility for any errors, including the risk of irreversible loss of funds. Transfers are final and cannot be reversed.',
  haveCarefully:
    'I have reviewed the information and understand that transfers are final.',
  goBack: 'Go Back',
  confirm: 'Confirm',
  cashTransferDescription:
    'Transfer your USDC earnings to your bank account or debit card. $5 minimum for cash withdrawals.'
}

export const ConfirmTransferDetails = () => {
  const { submitForm } = useFormikContext()
  const { setData } = useWithdrawUSDCModal()
  const [{ value: amountValue }] = useField(AMOUNT)
  const [{ value: addressValue }] = useField(ADDRESS)
  const [{ value: methodValue }] = useField(METHOD)
  const [confirmField, { error: confirmError }] = useField({
    name: CONFIRM,
    type: 'checkbox'
  })

  const { data: balance } = useUSDCBalance()

  const handleGoBack = useCallback(() => {
    setData({ page: WithdrawUSDCModalPages.ENTER_TRANSFER_DETAILS })
  }, [setData])

  const [touchedContinue, setTouchedContinue] = useState(false)
  const handleContinue = useCallback(() => {
    setTouchedContinue(true)
    if (!confirmError) {
      setData({
        page:
          methodValue === WithdrawMethod.COINFLOW
            ? WithdrawUSDCModalPages.PREPARE_TRANSFER
            : WithdrawUSDCModalPages.TRANSFER_IN_PROGRESS
      })
      submitForm()
    }
  }, [methodValue, setData, submitForm, confirmError])

  return (
    <Flex column gap='xl'>
      <CashBalanceSection balance={balance} />
      <Divider style={{ margin: 0 }} />
      <Flex justifyContent='space-between'>
        <Text variant='heading' size='s' color='subdued'>
          {messages.amountToWithdraw}
        </Text>
        <Text variant='heading' size='s'>
          -${decimalIntegerToHumanReadable(amountValue)}
        </Text>
      </Flex>
      <Divider style={{ margin: 0 }} />
      {methodValue === WithdrawMethod.COINFLOW ? (
        <Text variant='body' size='m'>
          {messages.cashTransferDescription}
        </Text>
      ) : (
        <>
          <Flex column gap='s'>
            <Text variant='heading' size='s' color='subdued'>
              {messages.destinationAddress}
            </Text>
            <Text variant='body'>{addressValue}</Text>
          </Flex>
          <Flex
            column
            p='l'
            gap='s'
            backgroundColor='surface1'
            border='default'
            borderRadius='m'
          >
            <Text variant='title' size='m'>
              {messages.review}
            </Text>
            <Text variant='body' size='s'>
              {messages.byProceeding}
            </Text>
            <Flex alignItems='center' gap='xl'>
              <Checkbox {...confirmField} />
              <Text variant='body' size='s' color='subdued'>
                {messages.haveCarefully}
              </Text>
            </Flex>
            {touchedContinue && confirmError ? (
              <HelperText error>{confirmError}</HelperText>
            ) : null}
          </Flex>
        </>
      )}
      <Flex gap='s' w='100%'>
        <Button variant='secondary' onClick={handleGoBack} fullWidth>
          {messages.goBack}
        </Button>
        <Button variant='primary' onClick={handleContinue} fullWidth>
          {messages.confirm}
        </Button>
      </Flex>
    </Flex>
  )
}
