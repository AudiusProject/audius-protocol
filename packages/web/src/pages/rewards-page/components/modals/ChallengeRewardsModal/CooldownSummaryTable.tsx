import { useCallback } from 'react'

import { useChallengeCooldownSchedule } from '@audius/common/hooks'
import { ChallengeRewardID } from '@audius/common/models'
import { Text } from '@audius/harmony'

import { SummaryTable } from 'components/summary-table'

const messages = {
  upcomingRewards: 'Upcoming Rewards',
  audio: '$AUDIO'
}

type CooldownSummaryTableProps = {
  challengeId: ChallengeRewardID
}

export const CooldownSummaryTable = ({
  challengeId
}: CooldownSummaryTableProps) => {
  const {
    cooldownChallenges,
    summary,
    isEmpty: isCooldownChallengesEmpty
  } = useChallengeCooldownSchedule({ challengeId })

  const formatLabel = useCallback((item: any) => {
    const { label, claimableDate, isClose } = item
    const formattedLabel = isClose ? (
      label
    ) : (
      <Text>
        {label}&nbsp;
        <Text color='subdued'>{claimableDate.format('(M/D)')}</Text>
      </Text>
    )
    return {
      ...item,
      label: formattedLabel
    }
  }, [])

  if (isCooldownChallengesEmpty) return null

  return (
    <SummaryTable
      title={messages.upcomingRewards}
      items={cooldownChallenges.map(formatLabel)}
      summaryItem={summary}
      secondaryTitle={messages.audio}
      summaryLabelColor='accent'
      summaryValueColor='default'
    />
  )
}
