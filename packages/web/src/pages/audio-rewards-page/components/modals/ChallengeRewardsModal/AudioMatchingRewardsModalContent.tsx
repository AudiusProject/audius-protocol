import { ReactNode, useCallback } from 'react'

import {
  ChallengeName,
  OptimisticUserChallenge,
  challengeRewardsConfig,
  formatNumberCommas,
  useAudioMatchingChallengeCooldownSchedule,
  challengesSelectors
} from '@audius/common'
import { IconArrowRight, IconCloudUpload, Text } from '@audius/harmony'
import {
  HarmonyButton,
  HarmonyButtonProps,
  HarmonyButtonType
} from '@audius/stems'
import cn from 'classnames'
import { useSelector } from 'react-redux'

import LoadingSpinner from 'components/loading-spinner/LoadingSpinner'
import { SummaryTable } from 'components/summary-table'
import { useNavigateToPage } from 'hooks/useNavigateToPage'
import { useWithMobileStyle } from 'hooks/useWithMobileStyle'
import { useIsMobile } from 'hooks/useIsMobile'
import { EXPLORE_PREMIUM_TRACKS_PAGE, UPLOAD_PAGE } from 'utils/route'

import { ProgressDescription } from './ProgressDescription'
import { ProgressReward } from './ProgressReward'
import styles from './styles.module.css'

const { getOptimisticUserChallenges } = challengesSelectors

const messages = {
  rewardMapping: {
    [ChallengeName.AudioMatchingBuy]: '$AUDIO Every Dollar Spent',
    [ChallengeName.AudioMatchingSell]: '$AUDIO Every Dollar Earned'
  },
  descriptionSubtext: {
    [ChallengeName.AudioMatchingBuy]:
      'Note: There is a 7 day waiting period between when you purchase and when you can claim your reward.',
    [ChallengeName.AudioMatchingSell]:
      'Note: There is a 7 day waiting period between when your track is purchased and when you can claim your reward.'
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
  onClaimRewardClicked: () => void
  claimInProgress?: boolean
  onNavigateAway: () => void
  errorContent?: ReactNode
}

const ctaButtonProps: {
  [k in AudioMatchingChallengeName]: Partial<HarmonyButtonProps>
} = {
  [ChallengeName.AudioMatchingBuy]: {
    iconRight: IconArrowRight,
    text: messages.viewPremiumTracks
  },
  [ChallengeName.AudioMatchingSell]: {
    iconLeft: IconCloudUpload,
    text: messages.uploadTrack
  }
}

// TODO: Migrate to @audius/harmony Button and pass `isLoading`
const ClaimInProgressSpinner = () => (
  <LoadingSpinner className={styles.spinner} />
)

/** Implements custom ChallengeRewardsContent for the $AUDIO matching challenges */
export const AudioMatchingRewardsModalContent = ({
  challenge,
  challengeName,
  onClaimRewardClicked,
  claimInProgress = false,
  onNavigateAway,
  errorContent
}: AudioMatchingRewardsModalContentProps) => {
  const wm = useWithMobileStyle(styles.mobile)
  const isMobile = useIsMobile()
  const navigateToPage = useNavigateToPage()
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
            {messages.descriptionSubtext[challengeName]}
          </Text>
        </div>
      }
    />
  )
  const progressReward = (
    <ProgressReward
      amount={formatNumberCommas(challenge?.amount ?? '')}
      subtext={messages.rewardMapping[challengeName]}
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
    const route =
      challengeName === ChallengeName.AudioMatchingBuy
        ? EXPLORE_PREMIUM_TRACKS_PAGE
        : UPLOAD_PAGE
    navigateToPage(route)
    onNavigateAway()
  }, [challengeName, onNavigateAway, navigateToPage])

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
              summaryLabelColor='secondary'
              summaryValueColor='neutral'
            />
          ) : null}
        </>
      )}
      {challenge?.claimableAmount && challenge.claimableAmount > 0 ? (
        <HarmonyButton
          fullWidth
          iconRight={claimInProgress ? ClaimInProgressSpinner : IconArrowRight}
          disabled={claimInProgress}
          text={messages.claimAudio(formatNumberCommas(claimableAmount))}
          onClick={onClaimRewardClicked}
        />
      ) : (
        <HarmonyButton
          variant={HarmonyButtonType.SECONDARY}
          fullWidth
          {...ctaButtonProps[challengeName]}
          onClick={handleClickCTA}
        />
      )}
      {errorContent}
    </div>
  )
}
