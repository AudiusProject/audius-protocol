import { ReactNode } from 'react'

import { useChallengeCooldownSchedule } from '@audius/common/hooks'
import { ChallengeName, OptimisticUserChallenge } from '@audius/common/models'
import { challengesSelectors } from '@audius/common/store'
import {
  formatNumberCommas,
  challengeRewardsConfig
} from '@audius/common/utils'
import { Flex, IconHeadphones, Paper, Text } from '@audius/harmony'
import { useSelector } from 'react-redux'

import { useIsMobile } from 'hooks/useIsMobile'

import { ProgressDescription } from './ProgressDescription'
import { ProgressReward } from './ProgressReward'

const { getOptimisticUserChallenges } = challengesSelectors

const messages = {
  rewardSubtext: '$AUDIO/day',
  descriptionSubtext:
    'Listen to music on Audius daily for a week to start a streak and earn $AUDIO for each day you keep it going.',
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
    <ProgressDescription
      description={<Text variant='body'>{fullDescription?.(challenge)}</Text>}
    />
  )
  const progressReward = (
    <ProgressReward
      amount={formatNumberCommas(userChallenge?.amount ?? '')}
      subtext={messages.rewardSubtext}
    />
  )

  const progressStatusLabel = userChallenge ? (
    <Flex
      alignItems='center'
      justifyContent='space-between'
      ph='xl'
      pv='l'
      backgroundColor='surface2'
      border='default'
      borderRadius='s'
    >
      <Flex alignItems='center' gap='s'>
        <IconHeadphones size='m' color='subdued' />
        <Text variant='label' size='l' color='subdued'>
          {messages.day(userChallenge.current_step_count)}
        </Text>
      </Flex>
      {userChallenge.disbursed_amount ? (
        <Text variant='label' size='l' color='subdued'>
          {messages.totalClaimed(
            formatNumberCommas(userChallenge.disbursed_amount.toString())
          )}
        </Text>
      ) : null}
    </Flex>
  ) : null

  return (
    <Flex column gap='2xl'>
      {isMobile ? (
        <>
          {progressDescription}
          <Paper column shadow='flat' w='100%' css={{ overflow: 'hidden' }}>
            <Flex justifyContent='center'>{progressReward}</Flex>
            {progressStatusLabel}
          </Paper>
        </>
      ) : (
        <Paper shadow='flat' w='100%' direction='column' borderRadius='s'>
          <Flex justifyContent='center'>
            {progressDescription}
            {progressReward}
          </Flex>
          <Flex column gap='l'>
            {progressStatusLabel}
            <Flex
              backgroundColor='surface1'
              ph='xl'
              pv='m'
              borderRadius='s'
              border='default'
              justifyContent='space-between'
            >
              <Text variant='title'>{messages.readyToClaim}</Text>
              <Text variant='title'>{userChallenge?.claimableAmount}</Text>
            </Flex>
          </Flex>
        </Paper>
      )}
    </Flex>
  )
}
