import { useCallback, useState } from 'react'

import {
  WithdrawUSDCModalPages,
  decimalIntegerToHumanReadable,
  useWithdrawUSDCModal,
  formatUSDCWeiToFloorCentsNumber,
  BNUSDC,
  WithdrawMethod
} from '@audius/common'
import { useUSDCBalance } from '@audius/common/hooks'
import { Button, IconQuestionCircle } from '@audius/harmony'
import { Switch } from '@audius/stems'
import BN from 'bn.js'
import { useField, useFormikContext } from 'formik'

import IconCaretLeft from 'assets/img/iconCaretLeft.svg'
import { HelperText } from 'components/data-entry/HelperText'
import { Divider } from 'components/divider'
import { Text } from 'components/typography'

import { ADDRESS, AMOUNT, CONFIRM, METHOD } from '../types'

import styles from './ConfirmTransferDetails.module.css'
import { Hint } from './Hint'
import { TextRow } from './TextRow'

const LEARN_MORE_LINK =
  'https://support.audius.co/help/Understanding-USDC-on-Audius'

const messages = {
  currentBalance: 'Current Balance',
  amountToWithdraw: 'Amount to Withdraw',
  destinationAddress: 'Destination Address',
  review: 'Review Details Carefully',
  byProceeding:
    'By proceeding, you accept full responsibility for any errors, understanding that mistakes may lead to irreversible loss of funds. Transfers are final and cannot be reversed.',
  haveCarefully:
    'I have carefully reviewed the accuracy of this information and I understand transfers are final and cannot be reversed.',
  goBack: 'Go Back',
  confirm: 'Confirm Transfer',
  continue: 'Continue Transfer',
  notSure: `Not sure what you’re doing? Visit the help center for guides & more info.`,
  cashTransferDescription:
    'Transfer your USDC earnings to your bank account or debit card. $5 minimum for cash withdrawals.',
  guide: 'Guide to USDC Transfers on Audius'
}

export const ConfirmTransferDetails = () => {
  const { submitForm } = useFormikContext()
  const { setData } = useWithdrawUSDCModal()
  const [{ value: amountValue }] = useField(AMOUNT)
  const [{ value: addressValue }] = useField(ADDRESS)
  const [{ value: methodValue }] = useField(METHOD)
  const [confirmField, { error: confirmError }] = useField(CONFIRM)

  const { data: balance } = useUSDCBalance()
  const balanceNumber = formatUSDCWeiToFloorCentsNumber(
    (balance ?? new BN(0)) as BNUSDC
  )
  const balanceFormatted = decimalIntegerToHumanReadable(balanceNumber)

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
    <div className={styles.root}>
      {methodValue === WithdrawMethod.MANUAL_TRANSFER ? (
        <Hint
          text={messages.notSure}
          link={LEARN_MORE_LINK}
          icon={IconQuestionCircle}
          linkText={messages.guide}
        />
      ) : null}
      <TextRow left={messages.currentBalance} right={`$${balanceFormatted}`} />
      <Divider style={{ margin: 0 }} />
      <div className={styles.amount}>
        <TextRow
          left={messages.amountToWithdraw}
          right={`-$${decimalIntegerToHumanReadable(amountValue)}`}
        />
      </div>
      <Divider style={{ margin: 0 }} />
      {methodValue === WithdrawMethod.COINFLOW ? (
        <Text variant='body' size='medium'>
          {messages.cashTransferDescription}
        </Text>
      ) : (
        <>
          <div className={styles.destination}>
            <TextRow left={messages.destinationAddress} />
            <Text variant='body' size='medium' strength='default'>
              {addressValue}
            </Text>
          </div>
          <div className={styles.details}>
            <Text variant='title' size='medium' strength='default'>
              {messages.review}
            </Text>
            <Text variant='body' size='small' strength='default'>
              {messages.byProceeding}
            </Text>
            <div className={styles.acknowledge}>
              <Switch {...confirmField} />
              <Text variant='body' size='small' strength='default'>
                {messages.haveCarefully}
              </Text>
            </div>
            {touchedContinue && confirmError ? (
              <HelperText error>{confirmError}</HelperText>
            ) : null}
          </div>
        </>
      )}
      <div className={styles.buttons}>
        <Button
          iconLeft={IconCaretLeft}
          variant='secondary'
          onClick={handleGoBack}
        >
          {messages.goBack}
        </Button>
        <Button variant='secondary' onClick={handleContinue}>
          {methodValue === WithdrawMethod.COINFLOW
            ? messages.continue
            : messages.confirm}
        </Button>
      </div>
    </div>
  )
}
