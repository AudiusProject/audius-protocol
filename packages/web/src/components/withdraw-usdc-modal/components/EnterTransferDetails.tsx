import {
  ChangeEventHandler,
  FocusEventHandler,
  useCallback,
  useState
} from 'react'

import {
  useUSDCBalance,
  BNUSDC,
  useWithdrawUSDCModal,
  WithdrawUSDCModalPages,
  formatUSDCWeiToFloorCentsNumber,
  filterDecimalString,
  padDecimalValue,
  decimalIntegerToHumanReadable,
  Name,
  WithdrawalMethod,
  FeatureFlags,
  useFeatureFlag
} from '@audius/common'
import { Button, ButtonType } from '@audius/harmony'
import BN from 'bn.js'
import { useField, useFormikContext } from 'formik'

import { Divider } from 'components/divider'
import { TextField } from 'components/form-fields'
import { Text } from 'components/typography'
import { ADDRESS, AMOUNT, METHOD, WithdrawFormValues } from '../types'
import { make, track } from 'services/analytics'

import styles from './EnterTransferDetails.module.css'
import { TextRow } from './TextRow'
import { SegmentedControl } from '@audius/stems'

const messages = {
  currentBalance: 'Current Balance',
  amountToWithdraw: 'Amount to Withdraw',
  destinationAddress: 'Destination Address',
  specify: `Specify how much USDC you’d like to withdraw from your Audius Account.`,
  destinationDetails: 'Provide a Solana Wallet address to transfer funds to.',
  solanaWallet: 'USDC Wallet (Solana)',
  amountInputLabel: 'Amount of USDC to withdraw',
  continue: 'Continue',
  dollars: '$',
  transferMethod: 'Transfer Method',
  cash: 'Cash',
  crypto: 'Crypto',
  cashTransferDescription:
    'Transfer your USDC earnings to your bank account or debit card. $5 minimum for cash withdrawals.',
  usdc: '(USDC)'
}

const withdrawalMethodOptions = [
  { key: WithdrawalMethod.COINFLOW, text: messages.cash },
  { key: WithdrawalMethod.MANUAL_TRANSFER, text: messages.crypto }
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
  const balanceFormatted = decimalIntegerToHumanReadable(balanceNumber)

  const [
    { value },
    _amountMeta,
    { setValue: setAmount, setTouched: setAmountTouched }
  ] = useField(AMOUNT)
  const [{ value: methodValue }, _methodMeta, { setValue: setMethod }] =
    useField<WithdrawalMethod>(METHOD)
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

  const [{ value: address }, _addressMeta, { setTouched: setAddressTouched }] =
    useField(ADDRESS)

  const disableContinue =
    methodValue === WithdrawalMethod.COINFLOW
      ? !!balance?.isZero()
      : !!(!address || balance?.isZero())

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
      if (methodValue === WithdrawalMethod.MANUAL_TRANSFER) {
        setAddressTouched(true)
      }
      const errors = await validateForm()
      if (errors[AMOUNT] || errors[ADDRESS]) return
      setData({ page: WithdrawUSDCModalPages.CONFIRM_TRANSFER_DETAILS })
    } catch {}
  }, [setData, methodValue, validateForm, setAmountTouched, setAddressTouched])

  return (
    <div className={styles.root}>
      <TextRow left={messages.currentBalance} right={`$${balanceFormatted}`} />
      <Divider style={{ margin: 0 }} />
      <div className={styles.amount}>
        <div className={styles.amountText}>
          <TextRow left={messages.amountToWithdraw} />
          <Text variant='body' size='medium' strength='default'>
            {messages.specify}
          </Text>
        </div>
        <TextField
          title={messages.amountToWithdraw}
          label={messages.amountToWithdraw}
          aria-label={messages.amountToWithdraw}
          name={AMOUNT}
          value={humanizedValue}
          onChange={handleAmountChange}
          onBlur={handleAmountBlur}
          startAdornment={messages.dollars}
          endAdornment={messages.usdc}
        />
      </div>
      <Divider style={{ margin: 0 }} />
      {isCoinflowEnabled ? (
        <SegmentedControl
          fullWidth
          label={messages.transferMethod}
          options={withdrawalMethodOptions}
          onSelectOption={setMethod}
          selected={methodValue}
        />
      ) : null}
      {methodValue === WithdrawalMethod.COINFLOW ? (
        <Text variant='body' size='medium'>
          {messages.cashTransferDescription}
        </Text>
      ) : (
        <div className={styles.destination}>
          <div className={styles.destinationText}>
            <TextRow left={messages.destinationAddress} />
            <Text variant='body' size='medium' strength='default'>
              {messages.destinationDetails}
            </Text>
          </div>
          <TextField
            title={messages.destinationAddress}
            onPaste={handlePasteAddress}
            label={messages.solanaWallet}
            aria-label={messages.destinationAddress}
            name={ADDRESS}
            placeholder=''
          />
        </div>
      )}

      <Button
        variant={ButtonType.SECONDARY}
        fullWidth
        disabled={disableContinue}
        onClick={handleContinue}
      >
        {messages.continue}
      </Button>
    </div>
  )
}
