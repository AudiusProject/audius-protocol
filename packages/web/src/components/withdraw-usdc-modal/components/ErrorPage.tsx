import { useCallback } from 'react'

import { useUSDCBalance } from '@audius/common/api'
import { BNUSDC } from '@audius/common/models'
import {
  WithdrawUSDCModalPages,
  useWithdrawUSDCModal
} from '@audius/common/store'
import {
  decimalIntegerToHumanReadable,
  formatCurrencyBalance,
  formatUSDCWeiToFloorDollarNumber
} from '@audius/common/utils'
import { Text } from '@audius/harmony'
import BN from 'bn.js'
import { useField } from 'formik'

import { Divider } from 'components/divider'

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
        <Text variant='body' size='m' strength='default'>
          {addressValue}
        </Text>
      </div>
      <div className={styles.error}>
        <Text variant='body' size='xs' strength='default' color='danger'>
          {messages.error}
        </Text>
        <Text
          tag='a'
          variant='body'
          className={styles.tryAgain}
          size='xs'
          strength='default'
          color='accent'
          onClick={handleTryAgain}
        >
          {messages.tryAgain}
        </Text>
      </div>
    </div>
  )
}
