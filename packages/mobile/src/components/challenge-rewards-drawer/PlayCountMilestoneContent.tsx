import React, { useMemo } from 'react'

import { ChallengeName } from '@audius/common/models'
import { challengesSelectors, ClaimStatus } from '@audius/common/store'
import {
  getChallengeStatusLabel,
  formatNumberCommas
} from '@audius/common/utils'
import { useSelector } from 'react-redux'

import { Button, Flex, Text, IconArrowRight } from '@audius/harmony-native'

import { ChallengeRewardsLayout } from './ChallengeRewardsLayout'
import { ClaimError } from './ClaimError'
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
  close: 'Close',
  claiming: 'Claiming',
  claimAudio: (amount: string) => `Claim ${amount} $AUDIO`
}

export const PlayCountMilestoneContent = (props: ChallengeContentProps) => {
  const { challengeName, onClose, onClaim, claimStatus, aaoErrorCode } = props
  const userChallenges = useSelector(getOptimisticUserChallenges)
  const optimisticChallenge = userChallenges[challengeName]

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

    const currentPlays = optimisticChallenge?.current_step_count || 0

    return { description, targetPlays, currentPlays }
  }, [challengeName, optimisticChallenge])

  const statusText = optimisticChallenge
    ? getChallengeStatusLabel(optimisticChallenge, challengeName)
    : ''

  const isClaimable =
    optimisticChallenge?.claimableAmount &&
    optimisticChallenge.claimableAmount > 0

  const claimInProgress =
    claimStatus === ClaimStatus.CLAIMING ||
    claimStatus === ClaimStatus.WAITING_FOR_RETRY

  const claimError = claimStatus === ClaimStatus.ERROR

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
          {statusText}
        </Text>
      </Flex>
    </Flex>
  )

  const additionalContent = optimisticChallenge?.cooldown_days ? (
    <CooldownSummaryTable challengeId={challengeName} />
  ) : null

  const actions =
    isClaimable && onClaim ? (
      <Button
        variant='primary'
        isLoading={claimInProgress}
        onPress={onClaim}
        iconRight={IconArrowRight}
        fullWidth
      >
        {claimInProgress
          ? messages.claiming
          : messages.claimAudio(
              formatNumberCommas(optimisticChallenge.claimableAmount)
            )}
      </Button>
    ) : (
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
      errorContent={
        claimError ? <ClaimError aaoErrorCode={aaoErrorCode} /> : null
      }
      isCooldownChallenge={!!optimisticChallenge?.cooldown_days}
    />
  )
}
