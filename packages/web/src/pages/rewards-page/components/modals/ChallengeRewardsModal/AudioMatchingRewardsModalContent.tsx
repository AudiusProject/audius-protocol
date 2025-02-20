import { ReactNode, useCallback } from 'react'

import {
  formatCooldownChallenges,
  useChallengeCooldownSchedule
} from '@audius/common/hooks'
import { ChallengeName, OptimisticUserChallenge } from '@audius/common/models'
import { challengesSelectors } from '@audius/common/store'
import {
  formatNumberCommas,
  challengeRewardsConfig,
  route
} from '@audius/common/utils'
import {
  Box,
  Button,
  ButtonProps,
  Flex,
  IconArrowRight,
  IconCloudUpload,
  Text
} from '@audius/harmony'
import { useSelector } from 'react-redux'

import { SummaryTable } from 'components/summary-table'
import { useIsMobile } from 'hooks/useIsMobile'
import { useNavigateToPage } from 'hooks/useNavigateToPage'

import { ProgressDescription } from './ProgressDescription'
import { ProgressReward } from './ProgressReward'

const { EXPLORE_PREMIUM_TRACKS_PAGE, UPLOAD_PAGE } = route

const { getOptimisticUserChallenges } = challengesSelectors

const messages = {
  rewardMapping: {
    [ChallengeName.AudioMatchingBuy]: '$AUDIO / Dollar',
    [ChallengeName.AudioMatchingSell]: '$AUDIO / Dollar'
  },
  viewPremiumTracks: 'View Premium Tracks',
  uploadTrack: 'Upload Track',
  totalClaimed: (amount: string) => `Total $AUDIO Claimed: ${amount}`,
  claimAudio: (amount: string) => `Claim ${amount} $AUDIO`,
  upcomingRewards: 'Upcoming Rewards',
  audio: '$AUDIO'
}

type AudioMatchingChallengeName =
  | ChallengeName.AudioMatchingBuy
  | ChallengeName.AudioMatchingSell

type AudioMatchingRewardsModalContentProps = {
  challenge?: OptimisticUserChallenge
  challengeName: AudioMatchingChallengeName
  onNavigateAway: () => void
  errorContent?: ReactNode
}

const ctaButtonProps: {
  [k in AudioMatchingChallengeName]: Partial<ButtonProps>
} = {
  [ChallengeName.AudioMatchingBuy]: {
    iconRight: IconArrowRight,
    children: messages.viewPremiumTracks
  },
  [ChallengeName.AudioMatchingSell]: {
    iconLeft: IconCloudUpload,
    children: messages.uploadTrack
  }
}

/** Implements custom ChallengeRewardsContent for the $AUDIO matching challenges */
export const AudioMatchingRewardsModalContent = ({
  challenge,
  challengeName,
  onNavigateAway,
  errorContent
}: AudioMatchingRewardsModalContentProps) => {
  const isMobile = useIsMobile()
  const navigateToPage = useNavigateToPage()
  const { fullDescription } = challengeRewardsConfig[challengeName]
  const {
    cooldownChallenges,
    summary,
    isEmpty: isCooldownChallengesEmpty
  } = useChallengeCooldownSchedule({ challengeId: challenge?.challenge_id })
  const userChallenge = useSelector(getOptimisticUserChallenges)[challengeName]

  const progressDescription = (
    <ProgressDescription>{fullDescription?.(challenge)}</ProgressDescription>
  )

  const progressReward = (
    <ProgressReward
      amount={challenge?.amount}
      subtext={messages.rewardMapping[challengeName]}
    />
  )

  const progressStatusLabel =
    userChallenge && userChallenge?.disbursed_amount > 0 ? (
      <Flex
        alignItems='center'
        justifyContent='center'
        ph='xl'
        pv='l'
        border='default'
        backgroundColor='surface1'
        borderRadius='s'
      >
        <Text variant='label' size='l' color='subdued'>
          {messages.totalClaimed(
            formatNumberCommas(userChallenge.disbursed_amount.toString())
          )}
        </Text>
      </Flex>
    ) : null

  const handleClickCTA = useCallback(() => {
    const route =
      challengeName === ChallengeName.AudioMatchingBuy
        ? EXPLORE_PREMIUM_TRACKS_PAGE
        : UPLOAD_PAGE
    navigateToPage(route)
    onNavigateAway()
  }, [challengeName, onNavigateAway, navigateToPage])

  const formatLabel = useCallback((item: any) => {
    const { label, claimableDate, isClose } = item
    const formattedLabel = isClose ? (
      label
    ) : (
      <Text>
        {label}&nbsp;
        <Text color='subdued'>{claimableDate.format('(M/D)')}</Text>
      </Text>
    )
    return {
      ...item,
      label: formattedLabel
    }
  }, [])

  const renderCooldownSummaryTable = () => {
    if (isCooldownChallengesEmpty) return null
    return (
      <SummaryTable
        title={messages.upcomingRewards}
        items={formatCooldownChallenges(cooldownChallenges).map(formatLabel)}
        summaryItem={summary}
        secondaryTitle={messages.audio}
        summaryLabelColor='accent'
        summaryValueColor='default'
      />
    )
  }

  return (
    <Flex column gap='2xl' justifyContent='space-between' h='100%'>
      {isMobile ? (
        <Flex column gap='2xl'>
          {progressDescription}
          {progressReward}
          {progressStatusLabel}
          {renderCooldownSummaryTable()}
        </Flex>
      ) : (
        <Flex column gap='2xl'>
          <Flex alignItems='center' justifyContent='space-between' gap='2xl'>
            {progressDescription}
            {progressReward}
          </Flex>
          {progressStatusLabel}
          {renderCooldownSummaryTable()}
        </Flex>
      )}
      {/* Hack alert, move this button down closer to the submit button */}
      <Box css={{ marginBottom: -16 }}>
        {challenge?.claimableAmount && challenge.claimableAmount > 0 ? null : (
          <Button
            variant='secondary'
            fullWidth
            {...ctaButtonProps[challengeName]}
            onClick={handleClickCTA}
          />
        )}
        {errorContent}
      </Box>
    </Flex>
  )
}
