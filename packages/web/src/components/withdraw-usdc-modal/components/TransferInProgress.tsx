import {
  BNUSDC,
  formatUSDCWeiToFloorCentsNumber,
  decimalIntegerToHumanReadable
} from '@audius/common'
import { useUSDCBalance } from '@audius/common/hooks'
import BN from 'bn.js'
import { useField } from 'formik'

import { Divider } from 'components/divider'
import LoadingSpinner from 'components/loading-spinner/LoadingSpinner'
import { Text } from 'components/typography'

import { ADDRESS, AMOUNT } from '../types'

import { TextRow } from './TextRow'
import styles from './TransferInProgress.module.css'

const messages = {
  currentBalance: 'Current Balance',
  amountToWithdraw: 'Amount to Withdraw',
  destinationAddress: 'Destination Address'
}

export const TransferInProgress = () => {
  const { data: balance } = useUSDCBalance()
  const balanceNumber = formatUSDCWeiToFloorCentsNumber(
    (balance ?? new BN(0)) as BNUSDC
  )
  const balanceFormatted = decimalIntegerToHumanReadable(balanceNumber)

  const [{ value: amountValue }] = useField(AMOUNT)
  const [{ value: addressValue }] = useField(ADDRESS)

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
      <LoadingSpinner className={styles.spinner} />
    </div>
  )
}
