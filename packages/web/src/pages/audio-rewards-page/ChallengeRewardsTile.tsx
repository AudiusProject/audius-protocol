import { ReactNode, useEffect, useMemo, useState } from 'react'

import {
  useFeatureFlag,
  usePendingChallengeSchedule
} from '@audius/common/hooks'
import {
  Name,
  ChallengeName,
  ChallengeRewardID,
  OptimisticUserChallenge
} from '@audius/common/models'
import { FeatureFlags, StringKeys } from '@audius/common/services'
import {
  challengesSelectors,
  audioRewardsPageSelectors,
  audioRewardsPageActions,
  ChallengeRewardsModalType
} from '@audius/common/store'
import {
  fillString,
  formatNumberCommas,
  removeNullable,
  makeOptimisticChallengeSortComparator,
  isAudioMatchingChallenge
} from '@audius/common/utils'
import {
  Button,
  Divider,
  Flex,
  IconArrowRight as IconArrow,
  IconCheck,
  IconTokenGold,
  Paper,
  ProgressBar,
  Text
} from '@audius/harmony'
import cn from 'classnames'
import { useDispatch, useSelector } from 'react-redux'

import { useModalState, useSetVisibility } from 'common/hooks/useModalState'
import LoadingSpinner from 'components/loading-spinner/LoadingSpinner'
import { useIsAudioMatchingChallengesEnabled } from 'hooks/useIsAudioMatchingChallengesEnabled'
import { useRemoteVar } from 'hooks/useRemoteConfig'
import { useWithMobileStyle } from 'hooks/useWithMobileStyle'
import { make, track } from 'services/analytics'

import styles from './RewardsTile.module.css'
import { Tile } from './components/ExplainerTile'
import { getChallengeConfig } from './config'
const { getUserChallenges, getUserChallengesLoading } =
  audioRewardsPageSelectors
const { fetchUserChallenges, setChallengeRewardsModalType } =
  audioRewardsPageActions
const { getOptimisticUserChallenges } = challengesSelectors

const messages = {
  title: 'EARN REWARDS',
  description1: 'Complete tasks to earn $AUDIO tokens!',
  completeLabel: 'COMPLETE',
  claimReward: 'Claim Your Reward',
  claimAllRewards: 'Claim All Rewards',

  readyToClaim: 'Ready to Claim',
  totalReadyToClaim: 'Total Ready To Claim',
  pending: 'Pending',
  viewDetails: 'View Details',
  new: 'New!',
  goldAudioToken: 'Gold $AUDIO token',
  availableNow: '$AUDIO available now'
}

type RewardPanelProps = {
  title: string
  icon: ReactNode
  description: (challenge?: OptimisticUserChallenge) => string
  panelButtonText: string
  progressLabel?: string
  remainingLabel?: string
  openModal: (modalType: ChallengeRewardsModalType) => void
  id: ChallengeRewardID
}

const RewardPanel = ({
  id,
  title,
  description,
  panelButtonText,
  openModal,
  progressLabel,
  remainingLabel,
  icon
}: RewardPanelProps) => {
  const wm = useWithMobileStyle(styles.mobile)
  const userChallenges = useSelector(getOptimisticUserChallenges)

  const openRewardModal = () => {
    openModal(id)
    track(
      make({ eventName: Name.REWARDS_CLAIM_DETAILS_OPENED, challengeId: id })
    )
  }

  const challenge = userChallenges[id]

  const shouldShowCompleted =
    challenge?.state === 'completed' || challenge?.state === 'disbursed'
  const hasDisbursed = challenge?.state === 'disbursed'
  const needsDisbursement = challenge && challenge.claimableAmount > 0
  const shouldShowProgressBar =
    challenge &&
    challenge.max_steps > 1 &&
    challenge.challenge_type !== 'aggregate' &&
    !hasDisbursed
  const showNewChallengePill =
    isAudioMatchingChallenge(id) && !needsDisbursement

  let progressLabelFilled: string
  if (shouldShowCompleted) {
    progressLabelFilled = messages.completeLabel
  } else if (isAudioMatchingChallenge(id)) {
    if (needsDisbursement) {
      progressLabelFilled = messages.readyToClaim
    } else {
      progressLabelFilled = progressLabel ?? ''
    }
  } else if (challenge?.challenge_type === 'aggregate') {
    // Count down
    progressLabelFilled = fillString(
      remainingLabel ?? '',
      formatNumberCommas(
        (challenge?.max_steps - challenge?.current_step_count)?.toString() ?? ''
      ),
      formatNumberCommas(challenge?.max_steps?.toString() ?? '')
    )
  } else {
    // Count up
    progressLabelFilled = progressLabel
      ? fillString(
          progressLabel,
          formatNumberCommas(challenge?.current_step_count?.toString() ?? ''),
          formatNumberCommas(challenge?.max_steps?.toString() ?? '')
        )
      : ''
  }
  const buttonMessage = hasDisbursed ? messages.viewDetails : panelButtonText

  const buttonVariant = 'secondary'

  return (
    <div
      className={wm(
        cn(styles.rewardPanelContainer, hasDisbursed ? styles.disbursed : '')
      )}
      onClick={openRewardModal}
    >
      <div className={wm(styles.rewardPanelTop)}>
        <div className={wm(styles.rewardPillContainer)}>
          {needsDisbursement ? (
            <span className={styles.pillMessage}>{messages.readyToClaim}</span>
          ) : showNewChallengePill ? (
            <Text
              tag='span'
              className={styles.newChallengePill}
              variant='body'
              strength='strong'
              color='staticWhite'
            >
              {messages.new}
            </Text>
          ) : null}
        </div>
        <span className={wm(styles.rewardTitle)}>
          {icon}
          {title}
        </span>
        <span className={wm(styles.rewardDescription)}>
          {description(challenge)}
        </span>
      </div>
      <div className={wm(styles.rewardPanelBottom)}>
        <div className={wm(styles.rewardProgress)}>
          {needsDisbursement && <IconCheck className={wm(styles.iconCheck)} />}
          <p className={styles.rewardProgressLabel}>{progressLabelFilled}</p>
          {shouldShowProgressBar && (
            <ProgressBar
              className={styles.rewardProgressBar}
              value={challenge?.current_step_count ?? 0}
              max={challenge?.max_steps}
            />
          )}
        </div>
        <Button
          variant={buttonVariant}
          size='small'
          iconRight={hasDisbursed ? null : IconArrow}
          onClick={openRewardModal}
          fullWidth
        >
          {buttonMessage}
        </Button>
      </div>
    </div>
  )
}

const ClaimAllPanel = ({}) => {
  const wm = useWithMobileStyle(styles.mobile)
  const optimisticUserChallenges = useSelector(getOptimisticUserChallenges)

  const totalClaimableAmount = Object.values(optimisticUserChallenges).reduce(
    (sum, challenge) => sum + challenge.claimableAmount,
    0
  )
  const pendingChallengeSchedule = usePendingChallengeSchedule()
  const [, setClaimAllRewardsVisibility] = useModalState('ClaimAllRewards')
  const onClickClaimAllRewards = () => {
    setClaimAllRewardsVisibility(true)
  }
  const pendingAmount = pendingChallengeSchedule.claimableAmount

  return (
    <Paper
      shadow='flat'
      border='strong'
      p='xl'
      alignItems='center'
      alignSelf='stretch'
      justifyContent='space-between'
      m='s'
      // className={wm(styles.claimAllContainer)}
    >
      <Flex gap='l' alignItems='center'>
        <IconTokenGold
          height={48}
          width={48}
          aria-label={messages.goldAudioToken}
        />
        <Flex direction='column'>
          <Flex>
            <Text color='accent' size='m' variant='heading'>
              {messages.totalReadyToClaim}
            </Text>
            <div className={wm(styles.pendingPillContainer)}>
              <span className={styles.pillMessage}>
                {pendingAmount} {messages.pending}
              </span>
            </div>
          </Flex>
          <Text variant='body' textAlign='left'>
            {totalClaimableAmount} {messages.availableNow}
          </Text>
        </Flex>
      </Flex>
      <Button onClick={onClickClaimAllRewards} iconRight={IconArrow}>
        {messages.claimAllRewards}
      </Button>
    </Paper>
  )
}

type RewardsTileProps = {
  className?: string
}

const validRewardIds: Set<ChallengeRewardID> = new Set([
  'track-upload',
  'referrals',
  'ref-v',
  'mobile-install',
  'connect-verified',
  'listen-streak',
  'profile-completion',
  'referred',
  'send-first-tip',
  'first-playlist',
  ChallengeName.AudioMatchingSell, // $AUDIO matching seller
  ChallengeName.AudioMatchingBuy // $AUDIO matching buyer
])

/** Pulls rewards from remoteconfig */
const useRewardIds = (
  hideConfig: Partial<Record<ChallengeRewardID, boolean>>
) => {
  const rewardsString = useRemoteVar(StringKeys.CHALLENGE_REWARD_IDS)
  if (rewardsString === null) return []
  const rewards = rewardsString.split(',') as ChallengeRewardID[]
  const filteredRewards: ChallengeRewardID[] = rewards.filter(
    (reward) => validRewardIds.has(reward) && !hideConfig[reward]
  )
  return filteredRewards
}

const RewardsTile = ({ className }: RewardsTileProps) => {
  const setVisibility = useSetVisibility()
  const dispatch = useDispatch()
  const userChallengesLoading = useSelector(getUserChallengesLoading)
  const userChallenges = useSelector(getUserChallenges)
  const optimisticUserChallenges = useSelector(getOptimisticUserChallenges)
  const [haveChallengesLoaded, setHaveChallengesLoaded] = useState(false)
  const isAudioMatchingChallengesEnabled = useIsAudioMatchingChallengesEnabled()
  const { isEnabled: isRewardsCooldownEnabled } = useFeatureFlag(
    FeatureFlags.REWARDS_COOLDOWN
  )

  // The referred challenge only needs a tile if the user was referred
  const hideReferredTile = !userChallenges.referred?.is_complete
  const rewardIds = useRewardIds({
    referred: hideReferredTile,
    b: !isAudioMatchingChallengesEnabled,
    s: !isAudioMatchingChallengesEnabled
  })

  useEffect(() => {
    if (!userChallengesLoading && !haveChallengesLoaded) {
      setHaveChallengesLoaded(true)
    }
  }, [userChallengesLoading, haveChallengesLoaded])

  useEffect(() => {
    // Refresh user challenges on page visit
    dispatch(fetchUserChallenges())
  }, [dispatch])

  const openModal = (modalType: ChallengeRewardsModalType) => {
    dispatch(setChallengeRewardsModalType({ modalType }))
    setVisibility('ChallengeRewardsExplainer')(true)
  }

  const rewardIdsSorted = useMemo(
    () =>
      rewardIds
        // Filter out challenges that DN didn't return
        .map((id) => userChallenges[id]?.challenge_id)
        .filter(removeNullable)
        .sort(makeOptimisticChallengeSortComparator(optimisticUserChallenges)),
    [rewardIds, userChallenges, optimisticUserChallenges]
  )

  const rewardsTiles = rewardIdsSorted.map((id) => {
    const props = getChallengeConfig(id)
    return <RewardPanel {...props} openModal={openModal} key={props.id} />
  })

  const wm = useWithMobileStyle(styles.mobile)

  return (
    <Tile className={wm(styles.rewardsTile, className)}>
      <span className={wm(styles.title)}>{messages.title}</span>
      <div className={wm(styles.subtitle)}>
        <span>{messages.description1}</span>
      </div>
      {userChallengesLoading && !haveChallengesLoaded ? (
        <LoadingSpinner className={wm(styles.loadingRewardsTile)} />
      ) : (
        <>
          {isRewardsCooldownEnabled ? <ClaimAllPanel></ClaimAllPanel> : null}
          <Divider orientation='horizontal' className={wm(styles.divider)} />
          <div className={styles.rewardsContainer}>{rewardsTiles}</div>
        </>
      )}
    </Tile>
  )
}

export default RewardsTile
