import { PurchaseAccess, USDCPurchaseDetails } from '@audius/common/models'
import { formatUSDCWeiToUSDString } from '@audius/common/utils'
import { cacheTracksSelectors, trackPageActions } from '@audius/common/store'
import BN from 'bn.js'

import { SummaryTable, SummaryTableItem } from 'components/summary-table'
import { useCurrentStems } from '@audius/common/hooks'
import { shallowEqual, useDispatch, useSelector } from 'react-redux'
import { CommonState } from '@audius/common/store'
import { useEffect } from 'react'

const { getTrack } = cacheTracksSelectors
const { fetchTrack } = trackPageActions

const messages = {
  cost: 'Cost of Track',
  payExtra: 'Pay Extra',
  downloadable: (count: number) => `Downloadable Files (${count})`,
  title: 'Transaction Summary',
  total: 'Total'
}

export const TransactionSummary = ({
  transaction
}: {
  transaction: USDCPurchaseDetails
}) => {
  const dispatch = useDispatch()
  const amountBN = new BN(transaction.amount)
  const trackId = transaction.contentId
  const track = useSelector(
    (state: CommonState) => getTrack(state, { id: trackId }),
    shallowEqual
  )
  const { stemTracks } = useCurrentStems({ trackId: track!.track_id })
  const downloadableCount =
    stemTracks.length + (track?.is_original_available ? 1 : 0)

  useEffect(() => {
    dispatch(fetchTrack(trackId, undefined, undefined, false))
  }, [dispatch])

  const items: SummaryTableItem[] = []
  if (transaction.access === PurchaseAccess.STREAM) {
    items.push({
      id: 'cost',
      label: messages.cost,
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
