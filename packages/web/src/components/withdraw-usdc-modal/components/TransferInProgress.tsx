import {
  useUSDCBalance,
  formatUSDCWeiToNumber,
  formatCurrencyBalance,
  BNUSDC
} from '@audius/common'
import BN from 'bn.js'

import { Divider } from 'components/divider'
import LoadingSpinner from 'components/loading-spinner/LoadingSpinner'
import { Text } from 'components/typography'

import { TextRow } from './TextRow'
import styles from './TransferInProgress.module.css'

const messages = {
  currentBalance: 'Current Balance',
  amountToWithdraw: 'Amount to Withdraw',
  destinationAddress: 'Destination Address'
}

export const TransferInProgress = () => {
  const { data: balance } = useUSDCBalance()
  const balanceNumber = formatUSDCWeiToNumber((balance ?? new BN(0)) as BNUSDC)
  const balanceFormatted = formatCurrencyBalance(balanceNumber)
  const wallet = '72pepj'
  const amount = '200'

  return (
    <div className={styles.root}>
      <Divider style={{ margin: 0 }} />
      <div>
        <TextRow
          left={messages.currentBalance}
          right={`$${balanceFormatted}`}
        />
        <TextRow left={messages.amountToWithdraw} right={`-$${amount}`} />
      </div>
      <Divider style={{ margin: 0 }} />
      <div className={styles.destination}>
        <TextRow left={messages.destinationAddress} />
        <Text variant='body' size='medium' strength='default'>
          {wallet}
        </Text>
      </div>
      <LoadingSpinner className={styles.spinner} />
    </div>
  )
}
