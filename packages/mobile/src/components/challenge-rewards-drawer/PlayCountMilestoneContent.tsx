import React, { useMemo } from 'react'

import { ChallengeName } from '@audius/common/models'
import { challengesSelectors } from '@audius/common/store'
import { useSelector } from 'react-redux'

import { Button, Flex, Text } from '@audius/harmony-native'

import { ChallengeRewardsLayout } from './ChallengeRewardsLayout'
import { CooldownSummaryTable } from './CooldownSummaryTable'
import type { ChallengeContentProps } from './types'

const { getOptimisticUserChallenges } = challengesSelectors

const messages = {
  description250:
    'Hit 250 plays across all of your tracks in 2025 to earn an $AUDIO Reward',
  description1000:
    'Hit 1,000 plays across all of your tracks in 2025 to earn an $AUDIO Reward',
  description10000:
    'Hit 10,000 plays across all of your tracks in 2025 to earn an $AUDIO Reward',
  progressLabel: 'PLAYS',
  audio: '$AUDIO',
  close: 'Close'
}

export const PlayCountMilestoneContent = (props: ChallengeContentProps) => {
  const { challengeName, onClose } = props
  const userChallenges = useSelector(getOptimisticUserChallenges)
  const optimisticChallenge = userChallenges[challengeName]

  const { description, targetPlays, currentPlays, isComplete } = useMemo(() => {
    let description = ''

    switch (challengeName) {
      case ChallengeName.PlayCount250:
        description = messages.description250
        break
      case ChallengeName.PlayCount1000:
        description = messages.description1000
        break
      case ChallengeName.PlayCount10000:
        description = messages.description10000
        break
      default:
        description = messages.description250
    }

    const targetPlays =
      challengeName === ChallengeName.PlayCount250
        ? 250
        : challengeName === ChallengeName.PlayCount1000
          ? 1000
          : challengeName === ChallengeName.PlayCount10000
            ? 10000
            : 250

    const currentPlays = optimisticChallenge?.current_step_count || 0

    const isComplete =
      optimisticChallenge?.state === 'completed' ||
      optimisticChallenge?.state === 'disbursed'

    return { description, targetPlays, currentPlays, isComplete }
  }, [challengeName, optimisticChallenge])

  const statusLabel = (
    <Flex
      w='100%'
      ph='xl'
      border='default'
      borderRadius='s'
      backgroundColor='surface1'
    >
      <Flex w='100%' alignItems='center' justifyContent='center' pv='l'>
        <Text variant='label' size='l' color='subdued'>
          {isComplete
            ? 'COMPLETE!'
            : `${currentPlays} ${messages.progressLabel}`}
        </Text>
      </Flex>
    </Flex>
  )

  const additionalContent = optimisticChallenge?.cooldown_days ? (
    <CooldownSummaryTable challengeId={challengeName} />
  ) : null

  const actions = (
    <Button variant='secondary' onPress={onClose} fullWidth>
      {messages.close}
    </Button>
  )

  return (
    <ChallengeRewardsLayout
      description={description}
      amount={optimisticChallenge?.amount}
      rewardSubtext={messages.audio}
      showProgressBar={true}
      progressValue={currentPlays}
      progressMax={targetPlays}
      statusLabel={statusLabel}
      actions={actions}
      additionalContent={additionalContent}
      errorContent={null}
      claimInProgress={false}
      isCooldownChallenge={!!optimisticChallenge?.cooldown_days}
    />
  )
}
