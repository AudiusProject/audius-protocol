import React from 'react'

import {
  formatCooldownChallenges,
  useChallengeCooldownSchedule
} from '@audius/common/hooks'
import type { ChallengeRewardID } from '@audius/common/models'

import { SummaryTable } from '../summary-table'

const messages = {
  readyToClaim: 'Ready to Claim!',
  upcomingRewards: 'Upcoming Rewards',
  audio: '$AUDIO'
}

export const CooldownSummaryTable = ({
  challengeId
}: {
  challengeId: ChallengeRewardID
}) => {
  const { cooldownChallenges, summary, isEmpty } = useChallengeCooldownSchedule(
    { challengeId }
  )
  return !isEmpty ? (
    <SummaryTable
      title={messages.upcomingRewards}
      secondaryTitle={messages.audio}
      summaryValueColor='default'
      items={formatCooldownChallenges(cooldownChallenges)}
      summaryItem={summary}
    />
  ) : null
}
