import React from 'react'

import { useAudioMatchingChallengeCooldownSchedule } from '@audius/common/hooks'
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
  const { cooldownChallenges, cooldownChallengesSummary, isEmpty } =
    useAudioMatchingChallengeCooldownSchedule(challengeId)
  return !isEmpty ? (
    <SummaryTable
      title={messages.upcomingRewards}
      secondaryTitle={messages.audio}
      summaryValueColor='default'
      items={cooldownChallenges}
      summaryItem={cooldownChallengesSummary}
    />
  ) : null
}
