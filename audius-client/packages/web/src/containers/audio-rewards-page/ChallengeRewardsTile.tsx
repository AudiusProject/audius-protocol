import React, { ReactNode, useEffect } from 'react'

import { ProgressBar } from '@audius/stems'
import cn from 'classnames'
import { useDispatch, useSelector } from 'react-redux'

import { useSetVisibility } from 'common/hooks/useModalState'
import {
  getUserChallenges,
  getUserChallengesLoading
} from 'common/store/pages/audio-rewards/selectors'
import LoadingSpinner from 'components/loading-spinner/LoadingSpinner'
import { useRemoteVar } from 'containers/remote-config/hooks'
import { useWithMobileStyle } from 'hooks/useWithMobileStyle'
import { StringKeys } from 'services/remote-config'
import fillString from 'utils/fillString'

import { ChallengeRewardID } from '../../common/models/AudioRewards'
import {
  fetchUserChallenges,
  ChallengeRewardsModalType,
  setChallengeRewardsModalType
} from '../../common/store/pages/audio-rewards/slice'

import styles from './RewardsTile.module.css'
import ButtonWithArrow from './components/ButtonWithArrow'
import { Tile } from './components/ExplainerTile'
import { challengeRewardsConfig } from './config'

const messages = {
  title: '$AUDIO REWARDS',
  description1: 'Complete tasks to earn $AUDIO tokens!',
  description2:
    'Opportunities to earn $AUDIO will change, so check back often for more chances to earn!',
  completeLabel: 'COMPLETE'
}

type RewardPanelProps = {
  title: string
  icon: ReactNode
  description: string
  panelButtonText: string
  progressLabel: string
  stepCount: number
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
  icon,
  stepCount
}: RewardPanelProps) => {
  const wm = useWithMobileStyle(styles.mobile)
  const userChallenges = useSelector(getUserChallenges)

  const openRewardModal = () => openModal(id)

  const challenge = userChallenges[id]
  const currentStepCount = challenge?.current_step_count || 0
  const isComplete = currentStepCount === stepCount

  return (
    <div className={wm(styles.rewardPanelContainer)} onClick={openRewardModal}>
      <span className={wm(styles.rewardTitle)}>
        {icon}
        {title}
      </span>
      <span className={wm(styles.rewardDescription)}>{description}</span>
      <div className={wm(styles.rewardProgress)}>
        <p
          className={cn(styles.rewardProgressLabel, {
            [styles.complete]: isComplete
          })}
        >
          {isComplete
            ? messages.completeLabel
            : fillString(
                progressLabel,
                currentStepCount.toString(),
                stepCount.toString()
              )}
        </p>
        {stepCount > 1 && (
          <ProgressBar
            className={styles.rewardProgressBar}
            value={currentStepCount}
            max={stepCount}
          />
        )}
      </div>
      <ButtonWithArrow
        className={wm(styles.panelButton)}
        text={panelButtonText}
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
  'referred',
  'mobile-install',
  'connect-verified',
  'listen-streak',
  'profile-completion'
])

/** Pulls rewards from remoteconfig */
const useRewardIds = () => {
  const rewardsString = useRemoteVar(StringKeys.CHALLENGE_REWARD_IDS)
  if (rewardsString === null) return []
  const rewards = rewardsString.split(',') as ChallengeRewardID[]
  const filteredRewards: ChallengeRewardID[] = rewards.filter(reward =>
    validRewardIds.has(reward)
  )
  return filteredRewards
}

const RewardsTile = ({ className }: RewardsTileProps) => {
  const setVisibility = useSetVisibility()
  const dispatch = useDispatch()
  const rewardIds = useRewardIds()
  const userChallengesLoading = useSelector(getUserChallengesLoading)

  useEffect(() => {
    dispatch(fetchUserChallenges())
  }, [dispatch])

  const openModal = (modalType: ChallengeRewardsModalType) => {
    dispatch(setChallengeRewardsModalType({ modalType }))
    setVisibility('ChallengeRewardsExplainer')(true)
  }

  const rewardsTiles = rewardIds
    .map(id => challengeRewardsConfig[id])
    .map(props => (
      <RewardPanel {...props} openModal={openModal} key={props.id} />
    ))

  const wm = useWithMobileStyle(styles.mobile)

  return (
    <Tile className={wm(styles.rewardsTile, className)}>
      <span className={wm(styles.title)}>{messages.title}</span>
      <div className={wm(styles.subtitle)}>
        <span>{messages.description1}</span>
        <span>{messages.description2}</span>
      </div>
      <div className={styles.rewardsContainer}>
        {userChallengesLoading ? <LoadingSpinner /> : rewardsTiles}
      </div>
    </Tile>
  )
}

export default RewardsTile
