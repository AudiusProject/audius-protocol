import {
  useUSDCBalance,
  formatUSDCWeiToNumber,
  formatCurrencyBalance,
  BNUSDC
} from '@audius/common'
import BN from 'bn.js'
import { useField } from 'formik'

import { Divider } from 'components/divider'
import LoadingSpinner from 'components/loading-spinner/LoadingSpinner'
import { Text } from 'components/typography'
import {
  ADDRESS,
  AMOUNT
} from 'components/withdraw-usdc-modal/WithdrawUSDCModal'
import { toHumanReadable } from 'utils/tokenInput'

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

  const [{ value: amountValue }] = useField(AMOUNT)
  const [{ value: addressValue }] = useField(ADDRESS)

  return (
    <div className={styles.root}>
      <Divider style={{ margin: 0 }} />
      <div>
        <TextRow
          left={messages.currentBalance}
          right={`$${balanceFormatted}`}
        />
        <TextRow
          left={messages.amountToWithdraw}
          right={`-$${toHumanReadable(amountValue)}`}
        />
      </div>
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
