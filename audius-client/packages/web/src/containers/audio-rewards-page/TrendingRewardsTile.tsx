import React, { ReactNode } from 'react'

import { useDispatch } from 'react-redux'

import { useSetVisibility } from 'common/hooks/useModalState'
import { useRemoteVar } from 'containers/remote-config/hooks'
import { useWithMobileStyle } from 'hooks/useWithMobileStyle'
import { StringKeys } from 'services/remote-config'

import { TrendingRewardID } from '../../common/models/AudioRewards'
import { setTrendingRewardsModalType } from '../../common/store/pages/audio-rewards/slice'

import styles from './RewardsTile.module.css'
import ButtonWithArrow from './components/ButtonWithArrow'
import { Tile } from './components/ExplainerTile'
import { trendingRewardsConfig } from './config'

type RewardPanelProps = {
  title: string
  icon: ReactNode
  description: string
  buttonText: string
  onClickButton: () => void
  id: TrendingRewardID
}

const RewardPanel = ({
  title,
  description,
  buttonText,
  onClickButton,
  icon
}: RewardPanelProps) => {
  const wm = useWithMobileStyle(styles.mobile)

  return (
    <div className={wm(styles.rewardPanelContainer)} onClick={onClickButton}>
      <span className={wm(styles.rewardTitle)}>
        {icon}
        {title}
      </span>
      <span className={wm(styles.rewardDescription)}>{description}</span>
      <ButtonWithArrow
        className={wm(styles.panelButton)}
        text={buttonText}
        onClick={onClickButton}
        textClassName={styles.panelButtonText}
      />
    </div>
  )
}

type RewardsTileProps = {
  className?: string
}

const validRewardIds: Set<TrendingRewardID> = new Set([
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
  const rewards = rewardsString.split(',') as TrendingRewardID[]
  const filteredRewards: TrendingRewardID[] = rewards.filter(reward =>
    validRewardIds.has(reward)
  )
  return filteredRewards
}

const RewardsTile = ({ className }: RewardsTileProps) => {
  const setVisibility = useSetVisibility()
  const dispatch = useDispatch()
  const callbacksMap = {
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
    .map(id => trendingRewardsConfig[id])
    .map(props => (
      <RewardPanel
        {...props}
        onClickButton={callbacksMap[props.id]}
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
