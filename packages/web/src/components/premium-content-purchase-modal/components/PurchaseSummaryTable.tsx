import { formatPrice } from '@audius/common'

import { Text } from 'components/typography'

import styles from './PurchaseSummaryTable.module.css'

const messages = {
  summary: 'Summary',
  premiumTrack: 'Premium Track',
  existingBalance: 'Existing USDC Balance',
  payExtra: 'Pay Extra',
  total: 'Total',
  youPaid: 'You Paid',
  zero: '$0.00',
  price: (val: string) => `$${val}`
}

type PurchaseSummaryTableProps = {
  amountDue: number
  basePrice: number
  extraAmount?: number
  existingBalance?: number
  isPurchased?: boolean
}

export const PurchaseSummaryTable = ({
  amountDue,
  extraAmount,
  basePrice,
  existingBalance,
  isPurchased
}: PurchaseSummaryTableProps) => {
  return (
    <Text className={styles.container}>
      <Text className={styles.row} variant='label' size='large'>
        {messages.summary}
      </Text>
      <div className={styles.row}>
        <span>{messages.premiumTrack}</span>
        <span>{messages.price(formatPrice(basePrice))}</span>
      </div>
      {extraAmount != null ? (
        <div className={styles.row}>
          <span>{messages.payExtra}</span>
          <span>{messages.price(formatPrice(extraAmount))}</span>
        </div>
      ) : null}
      {existingBalance ? (
        <div className={styles.row}>
          <span>{messages.existingBalance}</span>
          <span>{`-${messages.price(formatPrice(existingBalance))}`}</span>
        </div>
      ) : null}
      <Text className={styles.row} variant='title'>
        <span>{isPurchased ? messages.youPaid : messages.total}</span>
        <span className={styles.finalPrice}>
          {messages.price(formatPrice(amountDue))}
        </span>
      </Text>
    </Text>
  )
}
