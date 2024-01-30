import { formatPrice } from '@audius/common/utils'

import { SummaryTable, SummaryTableItem } from 'components/summary-table'
import { Text } from 'components/typography'

const messages = {
  summary: 'Transaction Summary',
  premiumTrack: 'Premium Track',
  payExtra: 'Pay Extra',
  total: 'Total',
  youPaid: 'You Paid',
  zero: '$0.00',
  price: (val: string) => `$${val}`
}

type PurchaseSummaryTableProps = {
  totalPriceInCents: number
  basePrice: number
  extraAmount?: number
}

export const PurchaseSummaryTable = ({
  totalPriceInCents,
  basePrice,
  extraAmount
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

  return (
    <SummaryTable
      collapsible
      items={items}
      title={messages.total}
      secondaryTitle={
        <Text as='span' variant='inherit' color='secondary'>
          {messages.price(formatPrice(totalPriceInCents))}
        </Text>
      }
    />
  )
}
