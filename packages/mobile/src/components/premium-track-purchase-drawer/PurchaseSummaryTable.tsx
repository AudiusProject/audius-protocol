import { formatPrice } from '@audius/common/utils'

import { Text } from 'app/components/core'

import { SummaryTable } from '../summary-table'
import type { SummaryTableItem } from '../summary-table/SummaryTable'

const messages = {
  summary: 'Total',
  payExtra: 'Pay Extra',
  premiumTrack: 'Premium Track',
  existingBalance: 'Existing Balance',
  total: 'Total',
  youPaid: 'You Paid',
  price: (price: string) => `$${price}`,
  subtractPrice: (price: string) => `-$${price}`
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
      title={messages.summary}
      secondaryTitle={
        <Text color='secondary' weight='bold'>
          {messages.price(formatPrice(totalPriceInCents))}
        </Text>
      }
      items={items}
    />
  )
}
