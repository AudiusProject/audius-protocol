import { formatPrice } from '@audius/common/utils'

import { Text } from 'app/components/core'

import { SummaryTable } from '../summary-table'
import type { SummaryTableItem } from '../summary-table/SummaryTable'

const messages = {
  summary: 'Total',
  payExtra: 'Pay Extra',
  premiumTrack: 'Premium Track',
  downloadableFiles: 'Downloadable Files',
  existingBalance: 'Existing Balance',
  total: 'Total',
  youPaid: 'You Paid',
  price: (price: string) => `$${price}`,
  subtractPrice: (price: string) => `-$${price}`,
  included: 'included'
}

type PurchaseSummaryTableProps = {
  totalPriceInCents: number
  basePrice: number
  extraAmount?: number
  // How many "streams" are available for purchase
  // Prior to albums/bundles this should be 0 or 1.
  streamPurchaseCount?: number
  // How many "downloads" are available for purchase
  // Prior to albums/bundles this should be 0 or 1.
  downloadPurchaseCount?: number
  // How many stems are available for purchase
  stemsPurchaseCount?: number
}

export const PurchaseSummaryTable = ({
  totalPriceInCents,
  basePrice,
  extraAmount,
  streamPurchaseCount,
  downloadPurchaseCount,
  stemsPurchaseCount
}: PurchaseSummaryTableProps) => {
  const items: SummaryTableItem[] = []
  if (streamPurchaseCount) {
    items.push({
      id: 'premiumTrack',
      label: messages.premiumTrack,
      value: messages.price(formatPrice(basePrice))
    })
  }

  const downloadCount = (stemsPurchaseCount ?? 0) + (downloadPurchaseCount ?? 0)
  if (downloadCount > 0) {
    items.push({
      id: 'premiumTrackDownload',
      label: `${messages.downloadableFiles} (${downloadCount})`,
      value: streamPurchaseCount
        ? messages.included
        : messages.price(formatPrice(basePrice)),
      color: streamPurchaseCount ? 'subdued' : 'default'
    })
  }

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
