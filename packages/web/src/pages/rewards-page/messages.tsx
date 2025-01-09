import { dayjs, removeNullable } from '@audius/common/utils'
import { Text } from '@audius/harmony'

import { SummaryTableItem } from 'components/summary-table'

type ClaimableSummaryTableItem = SummaryTableItem & {
  claimableDate: dayjs.Dayjs
  isClose: boolean
}

export const messages = {
  title: 'Achievement Rewards',
  description1: 'Earn $AUDIO by completing simple tasks while using Audius.',
  completeLabel: 'COMPLETE',
  claimReward: 'Claim This Reward',
  claimAllRewards: 'Claim All Rewards',
  moreInfo: 'More Info',
  readyToClaim: 'Ready to Claim',
  pendingRewards: 'Pending Reward',
  totalUpcomingRewards: 'Total Upcoming Rewards',
  totalReadyToClaim: 'Ready To Claim',
  pending: 'Pending',
  viewDetails: 'View Details',
  new: 'New!',
  goldAudioToken: 'Gold $AUDIO token',
  available: '$AUDIO available',
  now: 'now!',
  availableMessage: (summaryItems: ClaimableSummaryTableItem[]) => {
    const filteredSummaryItems = summaryItems.filter(removeNullable)
    const summaryItem = filteredSummaryItems.pop()
    const { value, label, claimableDate, isClose } = (summaryItem ??
      {}) as ClaimableSummaryTableItem
    if (isClose) {
      return `${value} ${messages.available} ${label}`
    }
    return (
      <Text>
        {value} {messages.available} {label}&nbsp;
        <Text color='subdued'>{claimableDate.format('(M/D)')}</Text>
      </Text>
    )
  }
}
