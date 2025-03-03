import {
  audioRewardsPageSelectors,
  challengesSelectors,
  ClaimStatus
} from '@audius/common/store'
import {
  formatNumberCommas,
  challengeRewardsConfig,
  getChallengeStatusLabel
} from '@audius/common/utils'
import { Flex, IconArrowRotate, IconCheck, Text } from '@audius/harmony'
import { useSelector } from 'react-redux'

import { useIsMobile } from 'hooks/useIsMobile'

import { ChallengeRewardsLayout } from './ChallengeRewardsLayout'
import { ClaimButton } from './ClaimButton'
import { type DefaultChallengeProps } from './types'

const { getOptimisticUserChallenges } = challengesSelectors
const { getUndisbursedUserChallenges, getClaimStatus } =
  audioRewardsPageSelectors

const messages = {
  rewardSubtext: '$AUDIO/Week',
  totalClaimed: (amount: string) => `${amount} $AUDIO Claimed`
}

export const FirstWeeklyCommentChallengeModalContent = ({
  challenge,
  challengeName,
  onNavigateAway,
  errorContent
}: DefaultChallengeProps) => {
  const isMobile = useIsMobile()
  const userChallenge = useSelector(getOptimisticUserChallenges)[challengeName]
  const undisbursedUserChallenges = useSelector(getUndisbursedUserChallenges)
  const claimStatus = useSelector(getClaimStatus)
  const claimInProgress =
    claimStatus === ClaimStatus.CLAIMING ||
    claimStatus === ClaimStatus.WAITING_FOR_RETRY

  // Following the pattern from mobile implementation
  const modifiedChallenge = challenge
    ? {
        ...challenge,
        totalAmount: challenge?.amount ?? 0
      }
    : undefined

  const { fullDescription } = challengeRewardsConfig[challengeName]

  const progressStatusLabel = userChallenge ? (
    <Flex
      ph='xl'
      backgroundColor='surface1'
      border='default'
      borderRadius='s'
      column={isMobile}
    >
      <Flex
        pv='l'
        gap='s'
        w='100%'
        justifyContent={isMobile ? 'center' : 'flex-start'}
        alignItems='center'
      >
        {userChallenge?.claimableAmount ? (
          <IconCheck size='s' color='subdued' />
        ) : userChallenge?.disbursed_amount &&
          !userChallenge?.claimableAmount ? (
          <IconArrowRotate size='s' color='subdued' />
        ) : null}
        <Text variant='label' size='l' color='subdued'>
          {getChallengeStatusLabel(userChallenge, challengeName)}
        </Text>
      </Flex>
      {userChallenge.disbursed_amount ? (
        <Flex
          pv='l'
          w='100%'
          justifyContent={isMobile ? 'center' : 'flex-end'}
          alignItems='center'
          borderTop={isMobile ? 'default' : undefined}
        >
          <Text variant='label' size='l' color='subdued'>
            {messages.totalClaimed(
              formatNumberCommas(userChallenge.disbursed_amount.toString())
            )}
          </Text>
        </Flex>
      ) : null}
    </Flex>
  ) : null

  return (
    <ChallengeRewardsLayout
      description={
        <Text variant='body'>{fullDescription?.(modifiedChallenge)}</Text>
      }
      amount={modifiedChallenge?.totalAmount}
      rewardSubtext={messages.rewardSubtext}
      progressStatusLabel={progressStatusLabel}
      actions={
        <ClaimButton
          challenge={modifiedChallenge}
          claimInProgress={claimInProgress}
          undisbursedChallenges={undisbursedUserChallenges}
          onClose={onNavigateAway}
        />
      }
      errorContent={errorContent}
    />
  )
}
