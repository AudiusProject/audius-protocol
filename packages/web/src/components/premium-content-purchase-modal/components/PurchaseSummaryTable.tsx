import { formatPrice } from '@audius/common/utils'

import { SummaryTable, SummaryTableItem } from 'components/summary-table'
import { Text } from 'components/typography'

const messages = {
  summary: 'Transaction Summary',
  premiumTrack: 'Premium Track',
  downloadableFiles: 'Downloadable Files',
  allStemFiles: 'All Stem Files',
  payExtra: 'Pay Extra',
  total: 'Total',
  youPaid: 'You Paid',
  zero: '$0.00',
  price: (val: string) => `$${val}`,
  included: 'Included'
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
  if (stemsPurchaseCount && downloadPurchaseCount) {
    items.push({
      id: 'premiumTrackDownload',
      label: `${messages.downloadableFiles} (${
        downloadPurchaseCount + stemsPurchaseCount
      })`,
      value: streamPurchaseCount
        ? messages.included
        : messages.price(formatPrice(basePrice)),
      color: streamPurchaseCount ? 'subdued' : 'default'
    })
  } else if (downloadPurchaseCount) {
    items.push({
      id: 'premiumTrackDownload',
      label: `${messages.downloadableFiles} (${downloadPurchaseCount})`,
      value: streamPurchaseCount
        ? messages.included
        : messages.price(formatPrice(basePrice)),
      color: streamPurchaseCount ? 'subdued' : 'default'
    })
  } else if (stemsPurchaseCount) {
    items.push({
      id: 'premiumTrackStems',
      label: `${messages.allStemFiles} (${stemsPurchaseCount})`,
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
