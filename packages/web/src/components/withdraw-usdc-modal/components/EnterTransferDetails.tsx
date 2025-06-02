import {
  ChangeEventHandler,
  FocusEventHandler,
  useCallback,
  useState
} from 'react'

import { useUSDCBalance } from '@audius/common/api'
import { useFeatureFlag } from '@audius/common/hooks'
import { Name, BNUSDC } from '@audius/common/models'
import { FeatureFlags } from '@audius/common/services'
import {
  WithdrawUSDCModalPages,
  useWithdrawUSDCModal,
  WithdrawMethod
} from '@audius/common/store'
import {
  filterDecimalString,
  padDecimalValue,
  decimalIntegerToHumanReadable,
  formatUSDCWeiToFloorCentsNumber
} from '@audius/common/utils'
import { Button, Flex, SegmentedControl, Text } from '@audius/harmony'
import BN from 'bn.js'
import { useField, useFormikContext } from 'formik'

import { CashBalanceSection } from 'components/add-cash/CashBalanceSection'
import { Divider } from 'components/divider'
import { TextField } from 'components/form-fields'
import { make, track } from 'services/analytics'

import { ADDRESS, AMOUNT, METHOD, WithdrawFormValues } from '../types'

const messages = {
  currentBalance: 'Current Balance',
  amountToWithdraw: 'Amount to Withdraw',
  amountToWithdrawLabel: 'Amount (USDC)',
  destinationAddress: 'Destination Address',
  howMuch: 'How much do you want to withdraw?',
  destinationDetails: 'Solana USDC wallet address to receive funds.',
  solanaWallet: 'USDC Wallet (Solana)',
  continue: 'Continue',
  dollars: '$',
  transferMethod: 'Transfer Method',
  bankAccount: 'Bank Account',
  crypto: 'Crypto',
  cashTransferDescription:
    'Transfer your USDC earnings to your bank account or debit card. $5 minimum for cash withdrawals.'
}

const WithdrawMethodOptions = [
  { key: WithdrawMethod.COINFLOW, text: messages.bankAccount },
  { key: WithdrawMethod.MANUAL_TRANSFER, text: messages.crypto }
]

export const EnterTransferDetails = () => {
  const { validateForm } = useFormikContext<WithdrawFormValues>()
  const { data: balance } = useUSDCBalance()
  const { setData } = useWithdrawUSDCModal()

  const { isEnabled: isCoinflowEnabled } = useFeatureFlag(
    FeatureFlags.COINFLOW_OFFRAMP_ENABLED
  )

  const balanceNumber = formatUSDCWeiToFloorCentsNumber(
    (balance ?? new BN(0)) as BNUSDC
  )
  const analyticsBalance = balanceNumber / 100

  const [
    { value },
    { error: amountError },
    { setValue: setAmount, setTouched: setAmountTouched }
  ] = useField(AMOUNT)
  const [{ value: methodValue }, _ignoredMethodMeta, { setValue: setMethod }] =
    useField<WithdrawMethod>(METHOD)
  const [humanizedValue, setHumanizedValue] = useState(
    decimalIntegerToHumanReadable(value || balanceNumber)
  )
  const handleAmountChange: ChangeEventHandler<HTMLInputElement> = useCallback(
    (e) => {
      const { human, value } = filterDecimalString(e.target.value)
      setHumanizedValue(human)
      setAmount(value)
    },
    [setAmount, setHumanizedValue]
  )
  const handleAmountBlur: FocusEventHandler<HTMLInputElement> = useCallback(
    (e) => {
      setHumanizedValue(padDecimalValue(e.target.value))
    },
    [setHumanizedValue]
  )

  const [
    { value: address },
    { error: addressError },
    { setTouched: setAddressTouched }
  ] = useField(ADDRESS)

  const isBalanceLessThanMinimum = balance ? balance.lt(new BN(5)) : false
  const disableContinue =
    methodValue === WithdrawMethod.COINFLOW
      ? !!balance?.isZero()
      : !address || !!addressError || !!amountError || isBalanceLessThanMinimum

  const handlePasteAddress = useCallback(
    (event: React.ClipboardEvent) => {
      const pastedAddress = event.clipboardData.getData('text/plain')
      track(
        make({
          eventName: Name.WITHDRAW_USDC_ADDRESS_PASTED,
          destinationAddress: pastedAddress,
          currentBalance: analyticsBalance
        })
      )
    },
    [analyticsBalance]
  )

  const handleContinue = useCallback(async () => {
    try {
      setAmountTouched(true)
      if (methodValue === WithdrawMethod.MANUAL_TRANSFER) {
        setAddressTouched(true)
      }
      const errors = await validateForm()
      if (errors[AMOUNT] || errors[ADDRESS]) return
      setData({ page: WithdrawUSDCModalPages.CONFIRM_TRANSFER_DETAILS })
    } catch {}
  }, [setData, methodValue, validateForm, setAmountTouched, setAddressTouched])

  return (
    <Flex column gap='xl'>
      <CashBalanceSection balance={balance} />
      <Divider style={{ margin: 0 }} />
      <Flex column gap='l'>
        <Flex column gap='s'>
          <Text variant='heading' size='s' color='subdued'>
            {messages.amountToWithdraw}
          </Text>
          <Text variant='body'>{messages.howMuch}</Text>
        </Flex>
        <TextField
          title={messages.amountToWithdrawLabel}
          label={messages.amountToWithdrawLabel}
          aria-label={messages.amountToWithdrawLabel}
          name={AMOUNT}
          value={humanizedValue}
          onChange={handleAmountChange}
          onBlur={handleAmountBlur}
          startAdornmentText={messages.dollars}
        />
      </Flex>
      <Divider style={{ margin: 0 }} />
      {isCoinflowEnabled ? (
        <SegmentedControl
          fullWidth
          label={messages.transferMethod}
          options={WithdrawMethodOptions}
          onSelectOption={setMethod}
          selected={methodValue}
        />
      ) : null}
      {methodValue === WithdrawMethod.COINFLOW ? (
        <Text variant='body' size='m'>
          {messages.cashTransferDescription}
        </Text>
      ) : (
        <Flex column gap='l'>
          <Flex column gap='s'>
            <Text variant='heading' size='s' color='subdued'>
              {messages.destinationAddress}
            </Text>
            <Text variant='body'>{messages.destinationDetails}</Text>
          </Flex>
          <TextField
            title={messages.destinationAddress}
            onPaste={handlePasteAddress}
            label={messages.solanaWallet}
            aria-label={messages.destinationAddress}
            name={ADDRESS}
            placeholder=''
          />
        </Flex>
      )}
      <Button
        variant='primary'
        fullWidth
        disabled={disableContinue}
        onClick={handleContinue}
      >
        {messages.continue}
      </Button>
    </Flex>
  )
}
