import { formatPrice, isNullOrUndefined } from '@audius/common'

import { SummaryTable, SummaryTableItem } from 'components/summary-table'
import { Text } from 'components/typography'

const messages = {
  summary: 'Transaction Summary',
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
  const items: SummaryTableItem[] = [
    {
      id: 'premiumTrack',
      label: messages.premiumTrack,
      value: messages.price(formatPrice(basePrice))
    }
  ]
  if (extraAmount != null) {
    items.push({
      id: 'payExtra',
      label: messages.payExtra,
      value: messages.price(formatPrice(extraAmount))
    })
  }
  if (!isNullOrUndefined(existingBalance) && existingBalance > 0) {
    items.push({
      id: 'existingBalance',
      label: messages.existingBalance,
      value: `-${messages.price(formatPrice(existingBalance))}`
    })
  }

  return (
    <SummaryTable
      collapsible
      items={items}
      title={isPurchased ? messages.youPaid : messages.total}
      secondaryTitle={
        <Text as='span' variant='inherit' color='secondary'>
          {messages.price(formatPrice(amountDue))}
        </Text>
      }
    />
  )
}
