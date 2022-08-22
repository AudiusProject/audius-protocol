import { ReactNode, useEffect, useState } from 'react'

import {
  ChallengeRewardID,
  OptimisticUserChallenge,
  removeNullable,
  StringKeys,
  fillString,
  formatNumberCommas,
  challengesSelectors,
  audioRewardsPageActions,
  ChallengeRewardsModalType,
  audioRewardsPageSelectors
} from '@audius/common'
import { ProgressBar } from '@audius/stems'
import cn from 'classnames'
import { useDispatch, useSelector } from 'react-redux'

import { useSetVisibility } from 'common/hooks/useModalState'
import LoadingSpinner from 'components/loading-spinner/LoadingSpinner'
import { useRemoteVar } from 'hooks/useRemoteConfig'
import { useWithMobileStyle } from 'hooks/useWithMobileStyle'

import styles from './RewardsTile.module.css'
import ButtonWithArrow from './components/ButtonWithArrow'
import { Tile } from './components/ExplainerTile'
import { challengeRewardsConfig } from './config'
const { getUserChallenges, getUserChallengesLoading } =
  audioRewardsPageSelectors
const { fetchUserChallenges, setChallengeRewardsModalType } =
  audioRewardsPageActions
const { getOptimisticUserChallenges } = challengesSelectors

const messages = {
  title: '$AUDIO REWARDS',
  description1: 'Complete tasks to earn $AUDIO tokens!',
  description2:
    'Opportunities to earn $AUDIO will change, so check back often for more chances to earn!',
  completeLabel: 'COMPLETE',
  claimReward: 'Claim Your Reward'
}

type RewardPanelProps = {
  title: string
  icon: ReactNode
  description: (challenge?: OptimisticUserChallenge) => string
  panelButtonText: string
  progressLabel: string
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

  const openRewardModal = () => openModal(id)

  const challenge = userChallenges[id]
  const shouldShowCompleted =
    challenge?.state === 'completed' || challenge?.state === 'disbursed'
  const needsDisbursement = challenge && challenge.claimableAmount > 0
  const shouldShowProgressBar =
    challenge &&
    challenge.max_steps > 1 &&
    challenge.challenge_type !== 'aggregate'

  let progressLabelFilled: string
  if (shouldShowCompleted) {
    progressLabelFilled = messages.completeLabel
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
    progressLabelFilled = fillString(
      progressLabel,
      formatNumberCommas(challenge?.current_step_count?.toString() ?? ''),
      formatNumberCommas(challenge?.max_steps?.toString() ?? '')
    )
  }

  return (
    <div className={wm(styles.rewardPanelContainer)} onClick={openRewardModal}>
      <span className={wm(styles.rewardTitle)}>
        {icon}
        {title}
      </span>
      <span className={wm(styles.rewardDescription)}>
        {description(challenge)}
      </span>
      <div className={wm(styles.rewardProgress)}>
        <p
          className={cn(styles.rewardProgressLabel, {
            [styles.complete]: shouldShowCompleted
          })}
        >
          {progressLabelFilled}
        </p>
        {shouldShowProgressBar && (
          <ProgressBar
            className={styles.rewardProgressBar}
            value={challenge?.current_step_count ?? 0}
            max={challenge?.max_steps}
          />
        )}
      </div>
      <ButtonWithArrow
        className={wm(styles.panelButton)}
        text={needsDisbursement ? messages.claimReward : panelButtonText}
        onClick={openRewardModal}
        textClassName={styles.panelButtonText}
      />
    </div>
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
  'first-playlist'
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
  const [haveChallengesLoaded, setHaveChallengesLoaded] = useState(false)

  // The referred challenge only needs a tile if the user was referred
  const hideReferredTile = !userChallenges.referred?.is_complete
  const rewardIds = useRewardIds({ referred: hideReferredTile })

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

  const rewardsTiles = rewardIds
    // Filter out challenges that DN didn't return
    .map((id) => userChallenges[id]?.challenge_id)
    .filter(removeNullable)
    .map((id) => {
      const props = challengeRewardsConfig[id]
      return <RewardPanel {...props} openModal={openModal} key={props.id} />
    })

  const wm = useWithMobileStyle(styles.mobile)

  return (
    <Tile className={wm(styles.rewardsTile, className)}>
      <span className={wm(styles.title)}>{messages.title}</span>
      <div className={wm(styles.subtitle)}>
        <span>{messages.description1}</span>
        <span>{messages.description2}</span>
      </div>
      <div className={styles.rewardsContainer}>
        {userChallengesLoading && !haveChallengesLoaded ? (
          <LoadingSpinner className={wm(styles.loadingRewardsTile)} />
        ) : (
          rewardsTiles
        )}
      </div>
    </Tile>
  )
}

export default RewardsTile
