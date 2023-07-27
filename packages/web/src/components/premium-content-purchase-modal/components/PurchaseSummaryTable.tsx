import { formatUSDCWeiToUSDString, StringUSDC } from '@audius/common'

import { Text } from 'components/typography'

import styles from './PurchaseSummaryTable.module.css'

const messages = {
  summary: 'Summary',
  artistCut: 'Artist Cut',
  audiusCut: 'Audius Cut',
  alwaysZero: 'Always $0',
  existingBalance: 'Existing Balance',
  youPay: 'You Pay',
  zero: '$0',
  price: (val: string) => `$${val}`
}

export type PurchaseSummaryTableProps = {
  amountDue: StringUSDC
  artistCut: StringUSDC
  basePrice: StringUSDC
  existingBalance?: StringUSDC
}

export const PurchaseSummaryTable = ({
  amountDue,
  artistCut,
  basePrice,
  existingBalance
}: PurchaseSummaryTableProps) => {
  return (
    <Text className={styles.container} variant='body'>
      <Text className={styles.row} variant='label' size='Large'>
        {messages.summary}
      </Text>
      <div className={styles.row}>
        <span>{messages.artistCut}</span>
        <span>{messages.price(formatUSDCWeiToUSDString(artistCut))}</span>
      </div>
      <div className={styles.row}>
        <span>{messages.audiusCut}</span>
        <span>{messages.alwaysZero}</span>
      </div>
      {existingBalance ? (
        <div className={styles.row}>
          <span>{messages.existingBalance}</span>
          <span>{`-${messages.price(
            formatUSDCWeiToUSDString(existingBalance)
          )}`}</span>
        </div>
      ) : null}
      <Text className={styles.row} variant='title'>
        <span>{messages.youPay}</span>
        <span className={styles.finalPrice}>
          {existingBalance ? (
            <>
              <s>{messages.price(formatUSDCWeiToUSDString(basePrice))}</s>
              {messages.price(formatUSDCWeiToUSDString(amountDue))}
            </>
          ) : (
            messages.price(formatUSDCWeiToUSDString(amountDue))
          )}
        </span>
      </Text>
    </Text>
  )
}
