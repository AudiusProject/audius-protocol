import { useGetTrackById } from '@audius/common/api'
import { useCurrentStems } from '@audius/common/hooks'
import {
  PurchaseAccess,
  USDCContentPurchaseType,
  USDCPurchaseDetails
} from '@audius/common/models'
import { formatUSDCWeiToUSDString } from '@audius/common/utils'
import BN from 'bn.js'

import { SummaryTable, SummaryTableItem } from 'components/summary-table'

const messages = {
  payExtra: 'Pay Extra',
  downloadable: (count: number) => `Downloadable Files (${count})`,
  title: 'Transaction Summary',
  total: 'Total',
  albumCost: 'Album Cost',
  trackCost: 'Track Cost'
}

export const TransactionSummary = ({
  transaction
}: {
  transaction: USDCPurchaseDetails
}) => {
  const amountBN = new BN(transaction.amount)
  const { contentId, contentType } = transaction
  const isTrack = contentType === USDCContentPurchaseType.TRACK
  const { data: track } = useGetTrackById({ id: contentId })
  const { stemTracks } = useCurrentStems({
    trackId: isTrack && track ? track.track_id : 0
  })
  const downloadableCount =
    stemTracks.length + (track?.is_original_available ? 1 : 0)

  const items: SummaryTableItem[] = []
  if (transaction.access === PurchaseAccess.STREAM) {
    items.push({
      id: 'cost',
      label: isTrack ? messages.trackCost : messages.albumCost,
      value: `$${formatUSDCWeiToUSDString(amountBN)}`
    })
  } else if (transaction.access === PurchaseAccess.DOWNLOAD) {
    items.push({
      id: 'download',
      label: messages.downloadable(downloadableCount),
      value: `$${formatUSDCWeiToUSDString(amountBN)}`
    })
  }

  const extraAmountBN = new BN(transaction.extraAmount)
  if (!extraAmountBN.isZero()) {
    items.push({
      id: 'payExtra',
      label: messages.payExtra,
      value: `$${formatUSDCWeiToUSDString(extraAmountBN)}`
    })
  }

  return (
    <SummaryTable
      title={messages.title}
      items={items}
      summaryItem={{
        id: 'total',
        label: messages.total,
        value: `$${formatUSDCWeiToUSDString(amountBN.add(extraAmountBN))}`
      }}
    />
  )
}
