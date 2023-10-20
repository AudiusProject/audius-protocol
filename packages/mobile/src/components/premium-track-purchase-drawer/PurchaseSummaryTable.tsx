import { formatPrice, isNullOrUndefined } from '@audius/common'

import { SummaryTable } from '../summary-table'
import type { SummaryTableItem } from '../summary-table/SummaryTable'

const messages = {
  summary: 'Summary',
  payExtra: 'Pay Extra',
  premiumTrack: 'Premium Track',
  existingBalance: 'Existing Balance',
  total: 'Total',
  youPaid: 'You Paid',
  price: (price: string) => `$${price}`,
  subtractPrice: (price: string) => `-$${price}`
}

type PurchaseSummaryTableProps = {
  amountDue: number
  extraAmount?: number
  basePrice: number
  existingBalance?: number
  isPurchaseSuccessful: boolean
}

export const PurchaseSummaryTable = ({
  amountDue,
  extraAmount,
  basePrice,
  existingBalance,
  isPurchaseSuccessful
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
      title={messages.summary}
      items={items}
      summaryItem={{
        id: 'total',
        label: isPurchaseSuccessful ? messages.youPaid : messages.total,
        value: messages.price(formatPrice(amountDue))
      }}
    />
  )
}
