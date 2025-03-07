import React, { useMemo } from 'react'

import { ChallengeName } from '@audius/common/models'
import {
  challengesSelectors,
  audioRewardsPageSelectors,
  ClaimStatus
} from '@audius/common/store'
import { getChallengeStatusLabel } from '@audius/common/utils'
import { Box, Flex, Text } from '@audius/harmony'
import { useSelector } from 'react-redux'

import { ChallengeRewardsLayout } from './ChallengeRewardsLayout'
import { ClaimButton } from './ClaimButton'
import { CooldownSummaryTable } from './CooldownSummaryTable'
import { ChallengeContentProps } from './types'

const { getOptimisticUserChallenges } = challengesSelectors
const { getUndisbursedUserChallenges, getClaimStatus } =
  audioRewardsPageSelectors

const messages = {
  title250: '250 PLAYS',
  title1000: '1,000 PLAYS',
  title10000: '10,000 PLAYS',
  description250:
    'Hit 250 plays across all of your tracks in 2025 to earn an $AUDIO Reward',
  description1000:
    'Hit 1,000 plays across all of your tracks in 2025 to earn an $AUDIO Reward',
  description10000:
    'Hit 10,000 plays across all of your tracks in 2025 to earn an $AUDIO Reward',
  progressLabel: 'PLAYS',
  close: 'Close'
}

export const PlayCountMilestoneContent = ({
  challengeName,
  onNavigateAway,
  errorContent
}: ChallengeContentProps) => {
  const userChallenges = useSelector(getOptimisticUserChallenges)
  const challenge = userChallenges[challengeName]
  const undisbursedUserChallenges = useSelector(getUndisbursedUserChallenges)
  const claimStatus = useSelector(getClaimStatus)
  const claimInProgress =
    claimStatus === ClaimStatus.CLAIMING ||
    claimStatus === ClaimStatus.WAITING_FOR_RETRY

  const { description, targetPlays, currentPlays } = useMemo(() => {
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

    const currentPlays = challenge?.current_step_count || 0

    return { description, targetPlays, currentPlays }
  }, [challengeName, challenge])

  const statusText = challenge
    ? getChallengeStatusLabel(challenge, challengeName)
    : ''

  const descriptionContent = (
    <Box>
      <Text variant='body' strength='default'>
        {description}
      </Text>
    </Box>
  )

  const progressStatusLabel = (
    <Flex w='100%' ph='xl' borderRadius='s' backgroundColor='surface1'>
      <Flex alignItems='center' justifyContent='center' pv='l'>
        <Text variant='label' size='l' color='subdued'>
          {statusText}
        </Text>
      </Flex>
    </Flex>
  )

  const additionalContent = challenge?.cooldown_days ? (
    <CooldownSummaryTable challengeId={challengeName} />
  ) : null

  const actions = (
    <ClaimButton
      challenge={challenge}
      claimInProgress={claimInProgress}
      onClose={onNavigateAway}
      undisbursedChallenges={undisbursedUserChallenges}
    />
  )

  return (
    <ChallengeRewardsLayout
      description={descriptionContent}
      errorContent={errorContent}
      amount={challenge?.amount}
      progressValue={currentPlays}
      progressMax={targetPlays}
      progressStatusLabel={progressStatusLabel}
      additionalContent={additionalContent}
      actions={actions}
    />
  )
}
