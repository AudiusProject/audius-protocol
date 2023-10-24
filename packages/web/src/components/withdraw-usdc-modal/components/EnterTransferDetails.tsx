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
  decimalIntegerToHumanReadable
} from '@audius/common'
import { Button, ButtonType, IconQuestionCircle } from '@audius/harmony'
import BN from 'bn.js'
import { useField } from 'formik'

import { Divider } from 'components/divider'
import { TextField } from 'components/form-fields'
import { Text } from 'components/typography'
import {
  ADDRESS,
  AMOUNT
} from 'components/withdraw-usdc-modal/WithdrawUSDCModal'

import styles from './EnterTransferDetails.module.css'
import { Hint } from './Hint'
import { TextRow } from './TextRow'

const messages = {
  currentBalance: 'Current Balance',
  amountToWithdraw: 'Amount to Withdraw',
  destinationAddress: 'Destination Address',
  specify: `Specify how much USDC you’d like to withdraw from your Audius Account.`,
  destinationDetails: 'Provide a Solana Wallet address to transfer funds to.',
  solanaWallet: 'USDC Wallet (Solana)',
  amountInputLabel: 'Amount of USDC to withdraw',
  continue: 'Continue',
  notSure: `Not sure what you’re doing? Visit the help center for guides & more info.`,
  guide: 'Guide to USDC Transfers on Audius',
  dollars: '$',
  usdc: '(USDC)'
}

export const EnterTransferDetails = () => {
  const { data: balance } = useUSDCBalance()
  const { setData } = useWithdrawUSDCModal()

  const balanceNumber = formatUSDCWeiToFloorCentsNumber(
    (balance ?? new BN(0)) as BNUSDC
  )
  const balanceFormatted = decimalIntegerToHumanReadable(balanceNumber)

  const [
    { value },
    { error: amountError },
    { setValue: setAmount, setTouched: setAmountTouched }
  ] = useField(AMOUNT)
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
      setAmountTouched(true)
    },
    [setHumanizedValue, setAmountTouched]
  )

  const [{ value: address }, { error: addressError }] = useField(ADDRESS)

  const handleContinue = useCallback(() => {
    setData({ page: WithdrawUSDCModalPages.CONFIRM_TRANSFER_DETAILS })
  }, [setData])

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
      <div className={styles.destination}>
        <div className={styles.destinationText}>
          <TextRow left={messages.destinationAddress} />
          <Text variant='body' size='medium' strength='default'>
            {messages.destinationDetails}
          </Text>
        </div>
        <TextField
          title={messages.destinationAddress}
          label={messages.solanaWallet}
          aria-label={messages.destinationAddress}
          name={ADDRESS}
          placeholder=''
        />
      </div>
      <Button
        variant={ButtonType.SECONDARY}
        fullWidth
        disabled={
          !!(amountError || addressError || !address || balance?.isZero())
        }
        onClick={handleContinue}
      >
        {messages.continue}
      </Button>
      <Hint
        text={messages.notSure}
        link={''} // TODO(USDC): Link
        icon={IconQuestionCircle}
        linkText={messages.guide}
      />
    </div>
  )
}
