import { ReactNode } from 'react'

import { StringKeys, audioRewardsPageActions } from '@audius/common'
import {
  ChallengeRewardID,
  OptimisticUserChallenge
} from '@audius/common/models'
import { ButtonType, Button, IconArrow } from '@audius/stems'
import cn from 'classnames'
import { useDispatch } from 'react-redux'

import { useSetVisibility } from 'common/hooks/useModalState'
import { useRemoteVar } from 'hooks/useRemoteConfig'
import { useWithMobileStyle } from 'hooks/useWithMobileStyle'

import styles from './RewardsTile.module.css'
import { Tile } from './components/ExplainerTile'
import { getChallengeConfig } from './config'
const { setTrendingRewardsModalType } = audioRewardsPageActions

type RewardPanelProps = {
  title: string
  icon: ReactNode
  description: (amount?: OptimisticUserChallenge) => string
  panelButtonText: string
  onClickButton: () => void
  id: ChallengeRewardID
}

const RewardPanel = ({
  title,
  description,
  panelButtonText,
  onClickButton,
  icon
}: RewardPanelProps) => {
  const wm = useWithMobileStyle(styles.mobile)

  return (
    <div
      className={wm(
        cn(styles.rewardPanelContainer, styles.trendingRewardPanelContainer)
      )}
      onClick={onClickButton}
    >
      <span className={wm(styles.rewardTitle)}>
        {icon}
        {title}
      </span>
      <span className={wm(styles.rewardDescription)}>{description()}</span>
      <Button
        type={ButtonType.COMMON_ALT}
        className={wm(styles.panelButton)}
        text={panelButtonText}
        rightIcon={<IconArrow />}
        iconClassName={wm(styles.buttonIcon)}
        onClick={onClickButton}
        textClassName={styles.panelButtonText}
      />
    </div>
  )
}

type RewardsTileProps = {
  className?: string
}

const validRewardIds: Set<ChallengeRewardID> = new Set([
  'trending-track',
  'trending-playlist',
  'top-api',
  'verified-upload',
  'trending-underground'
])

const messages = {
  title: 'TRENDING COMPETITIONS',
  description1: 'Win contests to earn $AUDIO tokens!'
}

/** Pulls rewards from remoteconfig */
const useRewardIds = () => {
  const rewardsString = useRemoteVar(StringKeys.TRENDING_REWARD_IDS)
  if (!rewardsString) return []
  const rewards = rewardsString.split(',') as ChallengeRewardID[]
  const filteredRewards: ChallengeRewardID[] = rewards.filter((reward) =>
    validRewardIds.has(reward)
  )
  return filteredRewards
}

const RewardsTile = ({ className }: RewardsTileProps) => {
  const setVisibility = useSetVisibility()
  const dispatch = useDispatch()

  const callbacksMap: Partial<Record<ChallengeRewardID, () => void>> = {
    'trending-track': () => {
      dispatch(setTrendingRewardsModalType({ modalType: 'tracks' }))
      setVisibility('TrendingRewardsExplainer')(true)
    },
    'trending-playlist': () => {
      dispatch(setTrendingRewardsModalType({ modalType: 'playlists' }))
      setVisibility('TrendingRewardsExplainer')(true)
    },
    'trending-underground': () => {
      dispatch(setTrendingRewardsModalType({ modalType: 'underground' }))
      setVisibility('TrendingRewardsExplainer')(true)
    },
    'top-api': () => {
      setVisibility('APIRewardsExplainer')(true)
    },
    'verified-upload': () => {
      setVisibility('LinkSocialRewardsExplainer')(true)
    }
  }

  const rewardIds = useRewardIds()

  const rewardsTiles = rewardIds
    .map((id) => getChallengeConfig(id))
    .map((props) => (
      <RewardPanel
        {...props}
        onClickButton={callbacksMap[props.id] ?? (() => {})}
        key={props.id}
      />
    ))

  const wm = useWithMobileStyle(styles.mobile)

  return (
    <Tile className={wm(styles.rewardsTile, className)}>
      <span className={wm(styles.title)}>{messages.title}</span>
      <div className={wm(styles.subtitle)}>
        <span>{messages.description1}</span>
      </div>
      <div className={styles.rewardsContainer}>{rewardsTiles}</div>
    </Tile>
  )
}

export default RewardsTile
