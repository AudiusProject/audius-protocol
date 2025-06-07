import {
  ChangeEventHandler,
  FocusEventHandler,
  useCallback,
  useState
} from 'react'

import { useUSDCBalance } from '@audius/common/api'
import { useFeatureFlag } from '@audius/common/hooks'
import { walletMessages } from '@audius/common/messages'
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
  solanaWallet: 'USDC Wallet (Solana)',
  dollars: '$'
}

const WithdrawMethodOptions = [
  { key: WithdrawMethod.COINFLOW, text: walletMessages.bankAccount },
  { key: WithdrawMethod.MANUAL_TRANSFER, text: walletMessages.crypto }
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
    setAmountTouched(true)
    if (methodValue === WithdrawMethod.MANUAL_TRANSFER) {
      setAddressTouched(true)
    }
    const errors = await validateForm()
    if (errors[AMOUNT] || errors[ADDRESS]) return
    setData({ page: WithdrawUSDCModalPages.CONFIRM_TRANSFER_DETAILS })
  }, [setData, methodValue, validateForm, setAmountTouched, setAddressTouched])

  return (
    <Flex column gap='xl'>
      <CashBalanceSection balance={balance} />
      <Divider style={{ margin: 0 }} />
      <Flex column gap='l'>
        <Flex column gap='s'>
          <Text variant='heading' size='s' color='subdued'>
            {walletMessages.amountToWithdraw}
          </Text>
          <Text variant='body'>{walletMessages.destinationDescription}</Text>
        </Flex>
        <TextField
          title={walletMessages.amountToWithdrawLabel}
          label={walletMessages.amountToWithdrawLabel}
          aria-label={walletMessages.amountToWithdrawLabel}
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
          label={walletMessages.transferMethod}
          options={WithdrawMethodOptions}
          onSelectOption={setMethod}
          selected={methodValue}
        />
      ) : null}
      {methodValue === WithdrawMethod.COINFLOW ? (
        <Text variant='body' size='m'>
          {walletMessages.cashTransferDescription}
        </Text>
      ) : (
        <Flex column gap='l'>
          <Flex column gap='s'>
            <Text variant='heading' size='s' color='subdued'>
              {walletMessages.destination}
            </Text>
            <Text variant='body'>{walletMessages.destinationDescription}</Text>
          </Flex>
          <TextField
            title={walletMessages.destination}
            onPaste={handlePasteAddress}
            label={messages.solanaWallet}
            aria-label={walletMessages.destination}
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
        {walletMessages.continue}
      </Button>
    </Flex>
  )
}
