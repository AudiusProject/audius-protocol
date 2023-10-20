import React from 'react'

import type { ChallengeRewardID } from '@audius/common'
import { useAudioMatchingChallengeCooldownSchedule } from '@audius/common'

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
  const { cooldownChallenges, cooldownChallengesSummary } =
    useAudioMatchingChallengeCooldownSchedule(challengeId)
  return (
    <SummaryTable
      title={messages.upcomingRewards}
      secondaryTitle={messages.audio}
      summaryValueColor='neutral'
      items={cooldownChallenges}
      summaryItem={cooldownChallengesSummary}
    />
  )
}
