import { useGetTrackById } from '@audius/common/api'
import { useCurrentStems } from '@audius/common/hooks'
import {
  PurchaseAccess,
  USDCContentPurchaseType,
  USDCPurchaseDetails
} from '@audius/common/models'
import { USDC } from '@audius/fixed-decimal'
import { Flex, IconInfo, Text } from '@audius/harmony'

import { SummaryTable, SummaryTableItem } from 'components/summary-table'
import { Tooltip } from 'components/tooltip'

import styles from './styles.module.css'

const messages = {
  payExtra: 'Pay Extra',
  downloadable: (count: number) => `Downloadable Files (${count})`,
  total: 'Total',
  subtotal: 'Subtotal',
  networkFee: 'Network Fee',
  networkFeeRate: '(10%)',
  networkFeeHelp:
    'This fee flows to the community treasury to support the Audius network.'
}

export const TransactionSummary = ({
  transaction,
  isSale = false
}: {
  transaction: USDCPurchaseDetails
  isSale?: boolean
}) => {
  const amount = BigInt(transaction.amount)
  const extraAmount = BigInt(transaction.extraAmount)
  const { contentId, contentType } = transaction
  const isTrack = contentType === USDCContentPurchaseType.TRACK
  const { data: track } = useGetTrackById({ id: contentId })
  const { stemTracks } = useCurrentStems({
    trackId: isTrack && track ? track.track_id : 0
  })
  const downloadableCount =
    stemTracks.length + (track?.is_original_available ? 1 : 0)

  let creatorTotal = BigInt(0)
  let networkFee = BigInt(0)
  for (const split of transaction.splits) {
    if (split.userId) {
      creatorTotal += BigInt(split.amount)
    } else {
      networkFee += BigInt(split.amount)
    }
  }
  const subtotal = isSale ? amount : creatorTotal
  const total = isSale ? extraAmount + creatorTotal : extraAmount + amount

  const items: SummaryTableItem[] = []
  if (transaction.access === PurchaseAccess.STREAM) {
    items.push({
      id: 'cost',
      label: messages.subtotal,
      value: USDC(subtotal).toLocaleString()
    })
  } else if (transaction.access === PurchaseAccess.DOWNLOAD) {
    items.push({
      id: 'download',
      label: messages.downloadable(downloadableCount),
      value: USDC(subtotal).toLocaleString('en-US', { roundingMode: 'floor' })
    })
  }

  if (extraAmount !== BigInt(0)) {
    items.push({
      id: 'payExtra',
      label: messages.payExtra,
      value: USDC(extraAmount).toLocaleString()
    })
  }

  if (networkFee > 0) {
    items.push({
      id: 'networkFee',
      label: (
        <Flex gap='s' alignItems='center'>
          <Text>
            {messages.networkFee + ' '}
            <Text color='subdued'>{messages.networkFeeRate}</Text>
          </Text>
          <Tooltip
            className={styles.tooltip}
            color='secondary'
            shouldWrapContent={false}
            text={
              <Text variant='body' size='m'>
                {messages.networkFeeHelp}
              </Text>
            }
            mount='body'
          >
            <IconInfo color='subdued' size='s' />
          </Tooltip>
        </Flex>
      ),
      value: USDC(isSale ? BigInt(0) - networkFee : networkFee).toLocaleString(
        'en-US',
        { roundingMode: 'ceil' }
      )
    })
  }

  return (
    <SummaryTable
      collapsible={true}
      title={messages.total}
      secondaryTitle={
        <Text tag='span' color='accent'>
          {USDC(total).toLocaleString()}
        </Text>
      }
      items={items}
    />
  )
}
