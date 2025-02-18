import { ChallengeName, OptimisticUserChallenge } from '@audius/common/models'
import { challengesSelectors } from '@audius/common/store'
import {
  formatNumberCommas,
  challengeRewardsConfig
} from '@audius/common/utils'
import { Flex, IconHeadphones, Text } from '@audius/harmony'
import { useSelector } from 'react-redux'

import { useIsMobile } from 'hooks/useIsMobile'

import { ProgressDescription } from './ProgressDescription'
import { ProgressReward } from './ProgressReward'

const { getOptimisticUserChallenges } = challengesSelectors

const messages = {
  rewardSubtext: '$AUDIO/day',
  totalClaimed: (amount: string) => `${amount} $AUDIO Claimed`,
  day: (day: number) => `Day ${day} ${day > 0 ? '🔥' : ''}`,
  readyToClaim: 'Ready to claim!'
}

type ListenStreakChallengeModalContentProps = {
  challenge?: OptimisticUserChallenge
  challengeName: ChallengeName
}

/** Implements custom ChallengeRewardsContent for the $AUDIO matching challenges */
export const ListenStreakChallengeModalContent = ({
  challenge,
  challengeName
}: ListenStreakChallengeModalContentProps) => {
  const isMobile = useIsMobile()
  const { fullDescription } = challengeRewardsConfig[challengeName]
  const userChallenge = useSelector(getOptimisticUserChallenges)[challengeName]

  const progressDescription = (
    <ProgressDescription>{fullDescription?.(challenge)}</ProgressDescription>
  )
  const progressReward = (
    <ProgressReward
      amount={userChallenge?.amount}
      subtext={messages.rewardSubtext}
    />
  )

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
        justifyContent={
          isMobile || !userChallenge.disbursed_amount ? 'center' : 'flex-start'
        }
        alignItems='center'
      >
        <IconHeadphones size='m' color='subdued' />
        <Text variant='label' size='l' color='subdued'>
          {messages.day(userChallenge.current_step_count)}
        </Text>
      </Flex>
      {!userChallenge.disbursed_amount ? (
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

  const readyToClaim =
    userChallenge?.claimableAmount && userChallenge?.claimableAmount > 0 ? (
      <Flex
        backgroundColor='surface1'
        ph='xl'
        pv='m'
        borderRadius='s'
        border='default'
        justifyContent='space-between'
      >
        <Text variant='title'>{messages.readyToClaim}</Text>
        <Text variant='title'>{userChallenge?.claimableAmount} $AUDIO</Text>
      </Flex>
    ) : null

  return isMobile ? (
    <Flex column gap='3xl'>
      <Flex column alignItems='center' gap='xl'>
        {progressDescription}
        {progressReward}
      </Flex>
      {progressStatusLabel}
      {readyToClaim}
    </Flex>
  ) : (
    <Flex column gap='2xl'>
      <Flex alignItems='center' gap='xl'>
        {progressDescription}
        {progressReward}
      </Flex>
      {progressStatusLabel}
      {readyToClaim}
    </Flex>
  )
}
