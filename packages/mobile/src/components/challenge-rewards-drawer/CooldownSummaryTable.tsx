import React from 'react'

import type { ChallengeRewardID } from '@audius/common'
import { useAudioMatchingChallengeCooldownSchedule } from '@audius/common/hooks'

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
  const { cooldownChallenges, cooldownChallengesSummary, isEmpty } =
    useAudioMatchingChallengeCooldownSchedule(challengeId)
  return !isEmpty ? (
    <SummaryTable
      title={messages.upcomingRewards}
      secondaryTitle={messages.audio}
      summaryValueColor='neutral'
      items={cooldownChallenges}
      summaryItem={cooldownChallengesSummary}
    />
  ) : null
}
