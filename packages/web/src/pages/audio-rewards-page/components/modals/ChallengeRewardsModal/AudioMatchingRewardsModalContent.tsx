import { ReactNode, useCallback } from 'react'

import {
  ChallengeName,
  OptimisticUserChallenge,
  challengeRewardsConfig,
  formatNumberCommas,
  audioRewardsPageSelectors,
  isAudioMatchingChallenge
} from '@audius/common'
import { IconArrowRight, IconCloudUpload, Text } from '@audius/harmony'
import {
  HarmonyButton,
  HarmonyButtonProps,
  HarmonyButtonType
} from '@audius/stems'
import cn from 'classnames'
import moment from 'moment'
import { useSelector } from 'react-redux'

import LoadingSpinner from 'components/loading-spinner/LoadingSpinner'
import { SummaryTable } from 'components/summary-table'
import { useNavigateToPage } from 'hooks/useNavigateToPage'
import { useWithMobileStyle } from 'hooks/useWithMobileStyle'
import { isMobile } from 'utils/clientUtil'
import { EXPLORE_PREMIUM_TRACKS_PAGE, UPLOAD_PAGE } from 'utils/route'

import { ProgressDescription } from './ProgressDescription'
import { ProgressReward } from './ProgressReward'
import styles from './styles.module.css'

const { getUndisbursedUserChallenges } = audioRewardsPageSelectors

const COOLDOWN_DAYS = 7

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
  totalEarned: (amount: string) => `Total $AUDIO Earned: ${amount}`,
  claimAudio: (amount: string) => `Claim ${amount} $AUDIO`,
  upcomingRewards: 'Upcoming Rewards',
  laterToday: 'Later Today',
  readyToClaim: 'Ready to Claim!'
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

/**
 * Filters for only $AUDIO matching challenges and generates row
 * items in correct format for SummaryTable. Also calculates the
 * total claimable amount.
 */
const useUndisbursedChallengesCooldown = () => {
  // Only show the cooldown for the $AUDIO matching challenges.
  // TODO: PAY-2030 Use cooldown_days from api instead of
  // isAudioMatchingChallenge and COOLDOWN_DAYS.
  const challenges = useSelector(getUndisbursedUserChallenges)
    .filter((c) => isAudioMatchingChallenge(c.challenge_id))
    .map((c) => ({ ...c, created_at: moment(c.created_at) }))
  const now = moment.utc()
  // Only challenges past the cooldown period are claimable
  const claimableAmount = challenges
    .filter((c) => now.diff(c.created_at, 'days') >= COOLDOWN_DAYS)
    .reduce((acc, curr) => acc + curr.amount, 0)
  // Challenges are already ordered by completed_blocknumber ascending.
  // Convert to local time and group challenges by date claimable.
  const cooldownItems = new Array(7)
  challenges
    .filter((c) => now.diff(c.created_at, 'days') < COOLDOWN_DAYS)
    .forEach((c) => {
      const diff = now.diff(c.created_at, 'days')
      cooldownItems[diff] = {
        ...cooldownItems[diff],
        id: c.specifier,
        label: c.created_at.add(7, 'days').local().format('ddd M/D'),
        value: (cooldownItems[diff]?.value ?? 0) + c.amount
      }
    })
  const cooldownSummary = {
    id: messages.readyToClaim,
    label: messages.readyToClaim,
    value: claimableAmount
  }
  return { cooldownItems, cooldownSummary, claimableAmount }
}

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
  const navigateToPage = useNavigateToPage()
  const { fullDescription } = challengeRewardsConfig[challengeName]
  const { cooldownItems, cooldownSummary, claimableAmount } =
    useUndisbursedChallengesCooldown()

  const audioClaimedSoFar = challenge
    ? challenge.amount * challenge.current_step_count -
      challenge.claimableAmount
    : 0

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
    audioClaimedSoFar > 0 ? (
      <div className={styles.audioMatchingTotalContainer}>
        <Text variant='label' size='l' strength='strong' color='subdued'>
          {messages.totalEarned(
            formatNumberCommas(audioClaimedSoFar.toString())
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
      {isMobile() ? (
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
          <SummaryTable
            title={messages.upcomingRewards}
            items={cooldownItems}
            summaryItem={cooldownSummary}
          />
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
