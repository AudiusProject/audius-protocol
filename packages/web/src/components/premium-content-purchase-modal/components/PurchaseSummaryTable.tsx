import { formatPrice } from '@audius/common/utils'
import { Text } from '@audius/harmony'

import { SummaryTable, SummaryTableItem } from 'components/summary-table'

const messages = {
  summary: 'Transaction Summary',
  premiumAlbum: 'Premium Album',
  premiumTrack: 'Premium Track',
  downloadableFiles: 'Downloadable Files',
  payExtra: 'Pay Extra',
  total: 'Total',
  youPaid: 'You Paid',
  zero: '$0.00',
  price: (val: string) => `$${val}`,
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
  // Whether this is an album purchase
  isAlbumPurchase?: boolean
}

export const PurchaseSummaryTable = ({
  totalPriceInCents,
  basePrice,
  extraAmount,
  streamPurchaseCount,
  downloadPurchaseCount,
  stemsPurchaseCount,
  isAlbumPurchase
}: PurchaseSummaryTableProps) => {
  const items: SummaryTableItem[] = []
  if (streamPurchaseCount) {
    if (isAlbumPurchase) {
      items.push({
        id: 'premiumAlbum',
        label: messages.premiumAlbum,
        value: messages.price(formatPrice(basePrice))
      })
    } else {
      items.push({
        id: 'premiumTrack',
        label: messages.premiumTrack,
        value: messages.price(formatPrice(basePrice))
      })
    }
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
      items={items}
      title={messages.total}
      collapsible
      secondaryTitle={
        <Text tag='span' color='accent'>
          {messages.price(formatPrice(totalPriceInCents))}
        </Text>
      }
    />
  )
}
