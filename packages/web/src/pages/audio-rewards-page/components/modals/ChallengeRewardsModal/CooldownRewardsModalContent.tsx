import { ReactNode, useCallback } from 'react'

import { useAudioMatchingChallengeCooldownSchedule } from '@audius/common/hooks'
import {
  ChallengeName,
  ChallengeRewardID,
  OptimisticUserChallenge
} from '@audius/common/models'
import { challengesSelectors } from '@audius/common/store'
import {
  formatNumberCommas,
  challengeRewardsConfig
} from '@audius/common/utils'
import { Button, IconArrowRight, Text } from '@audius/harmony'
import cn from 'classnames'
import { useSelector } from 'react-redux'

import LoadingSpinner from 'components/loading-spinner/LoadingSpinner'
import { SummaryTable } from 'components/summary-table'
import { useIsMobile } from 'hooks/useIsMobile'
import { useWithMobileStyle } from 'hooks/useWithMobileStyle'

import { ProgressDescription } from './ProgressDescription'
import { ProgressReward } from './ProgressReward'
import styles from './styles.module.css'

const { getOptimisticUserChallenges } = challengesSelectors

type AudioMatchingChallengeName =
  | ChallengeName.AudioMatchingBuy
  | ChallengeName.AudioMatchingSell

const messages = {
  rewardMapping: {
    [ChallengeName.AudioMatchingBuy]: '$AUDIO Every Dollar Spent',
    [ChallengeName.AudioMatchingSell]: '$AUDIO Every Dollar Earned'
  },
  descriptionSubtext:
    'Note: There is a 7 day waiting period from completion until you can claim your reward.',
  totalClaimed: (amount: string) => `Total $AUDIO Claimed: ${amount}`,
  claimAudio: (amount: string) => `Claim ${amount} $AUDIO`,
  upcomingRewards: 'Upcoming Rewards',
  audio: '$AUDIO'
}

type CooldownRewardsModalContentProps = {
  challenge?: OptimisticUserChallenge
  challengeName: ChallengeRewardID
  onClaimRewardClicked: () => void
  claimInProgress?: boolean
  onNavigateAway: () => void
  onClickProgress: any
  progressIcon: any
  progressLabel: any
  errorContent?: ReactNode
}

// TODO: Migrate to @audius/harmony Button and pass `isLoading`
const ClaimInProgressSpinner = () => (
  <LoadingSpinner className={styles.spinner} />
)

/** Implements custom ChallengeRewardsContent for the $AUDIO matching challenges */
export const CooldownRewardsModalContent = ({
  challenge,
  challengeName,
  onClaimRewardClicked,
  claimInProgress = false,
  onNavigateAway,
  onClickProgress,
  progressIcon,
  progressLabel,
  errorContent
}: CooldownRewardsModalContentProps) => {
  const wm = useWithMobileStyle(styles.mobile)
  const isMobile = useIsMobile()
  const { fullDescription } = challengeRewardsConfig[challengeName]
  const {
    cooldownChallenges,
    claimableAmount,
    cooldownChallengesSummary,
    isEmpty: isCooldownChallengesEmpty
  } = useAudioMatchingChallengeCooldownSchedule(challenge?.challenge_id)
  const userChallenge = useSelector(getOptimisticUserChallenges)[challengeName]

  const progressDescription = (
    <ProgressDescription
      description={
        <div className={styles.audioMatchingDescription}>
          <Text variant='body'>{fullDescription?.(challenge)}</Text>
          <Text variant='body' color='subdued'>
            {messages.descriptionSubtext}
          </Text>
        </div>
      }
    />
  )
  const progressReward = (
    <ProgressReward
      amount={formatNumberCommas(challenge?.amount ?? '')}
      subtext={
        challengeName in messages.rewardMapping
          ? messages.rewardMapping[challengeName as AudioMatchingChallengeName]
          : messages.audio
      }
    />
  )

  const progressStatusLabel =
    userChallenge && userChallenge?.disbursed_amount > 0 ? (
      <div className={styles.audioMatchingTotalContainer}>
        <Text variant='label' size='l' strength='strong'>
          {messages.totalClaimed(
            formatNumberCommas(userChallenge.disbursed_amount.toString())
          )}
        </Text>
      </div>
    ) : null

  const handleClickCTA = useCallback(() => {
    onClickProgress()
    onNavigateAway()
  }, [onNavigateAway, onClickProgress])
  return (
    <div className={wm(cn(styles.container, styles.audioMatchingContainer))}>
      {isMobile ? (
        <>
          {progressDescription}
          <div className={wm(styles.progressCard)}>
            <div className={wm(styles.progressInfo)}>{progressReward}</div>
            {progressStatusLabel}
          </div>
        </>
      ) : (
        <>
          <div className={styles.progressCard}>
            <div className={styles.progressInfo}>
              {progressDescription}
              {progressReward}
            </div>
            {progressStatusLabel}
          </div>
          {!isCooldownChallengesEmpty ? (
            <SummaryTable
              title={messages.upcomingRewards}
              items={cooldownChallenges}
              summaryItem={cooldownChallengesSummary}
              secondaryTitle={messages.audio}
              summaryLabelColor='accent'
              summaryValueColor='default'
            />
          ) : null}
        </>
      )}
      {challenge?.claimableAmount && challenge.claimableAmount > 0 ? (
        <Button
          fullWidth
          iconRight={claimInProgress ? ClaimInProgressSpinner : IconArrowRight}
          disabled={claimInProgress}
          onClick={onClaimRewardClicked}
        >
          {messages.claimAudio(formatNumberCommas(claimableAmount))}
        </Button>
      ) : (
        <Button
          variant='secondary'
          fullWidth
          iconRight={progressIcon}
          onClick={handleClickCTA}
        >
          {progressLabel}
        </Button>
      )}
      {errorContent}
    </div>
  )
}
