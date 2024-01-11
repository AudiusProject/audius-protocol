import { useCallback } from 'react'

import {
  useUSDCBalance,
  formatCurrencyBalance,
  BNUSDC,
  formatUSDCWeiToFloorDollarNumber,
  useWithdrawUSDCModal,
  WithdrawUSDCModalPages,
  decimalIntegerToHumanReadable
} from '@audius/common'
import BN from 'bn.js'
import { useField } from 'formik'

import { Divider } from 'components/divider'
import { Text } from 'components/typography'
import { ADDRESS, AMOUNT } from '../types'

import styles from './ErrorPage.module.css'
import { TextRow } from './TextRow'

const messages = {
  currentBalance: 'Current Balance',
  amountToWithdraw: 'Amount to Withdraw',
  destinationAddress: 'Destination Address',
  error: 'An error occurred during your transfer.',
  tryAgain: 'Try Again?'
}

export const ErrorPage = () => {
  const { setData } = useWithdrawUSDCModal()
  const { data: balance } = useUSDCBalance()
  const balanceNumber = formatUSDCWeiToFloorDollarNumber(
    (balance ?? new BN(0)) as BNUSDC
  )
  const balanceFormatted = formatCurrencyBalance(balanceNumber)

  const [{ value: amountValue }] = useField(AMOUNT)
  const [{ value: addressValue }] = useField(ADDRESS)

  const handleTryAgain = useCallback(() => {
    setData({
      page: WithdrawUSDCModalPages.CONFIRM_TRANSFER_DETAILS
    })
  }, [setData])

  return (
    <div className={styles.root}>
      <TextRow left={messages.currentBalance} right={`$${balanceFormatted}`} />
      <Divider style={{ margin: 0 }} />
      <TextRow
        left={messages.amountToWithdraw}
        right={`-$${decimalIntegerToHumanReadable(amountValue)}`}
      />
      <Divider style={{ margin: 0 }} />
      <div className={styles.destination}>
        <TextRow left={messages.destinationAddress} />
        <Text variant='body' size='medium' strength='default'>
          {addressValue}
        </Text>
      </div>
      <div className={styles.error}>
        <Text size='xSmall' strength='default' color='accentRed'>
          {messages.error}
        </Text>
        <Text
          as='a'
          className={styles.tryAgain}
          size='xSmall'
          strength='default'
          color='secondary'
          onClick={handleTryAgain}
        >
          {messages.tryAgain}
        </Text>
      </div>
    </div>
  )
}
