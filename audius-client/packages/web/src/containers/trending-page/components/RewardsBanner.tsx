import React, { useCallback } from 'react'
import cn from 'classnames'

import styles from './RewardsBanner.module.css'
import { IconArrow, IconCrown } from '@audius/stems'
import { isMobile } from 'utils/clientUtil'
import { useModalState } from 'hooks/useModalState'
import { useDispatch } from 'react-redux'
import {
  setTrendingRewardsModalType,
  TrendingRewardsModalType
} from 'containers/audio-rewards-page/store/slice'

const messages = {
  rewards: '$AUDIO REWARDS',
  tracksDescription: 'TOP 5 TRACKS EACH WEEK WIN $AUDIO',
  playlistsDescription: 'TOP 5 PLAYLISTS EACH WEEK WIN $AUDIO',
  learnMore: 'LEARN MORE'
}

const messageMap = {
  tracks: {
    description: messages.tracksDescription
  },
  playlists: {
    description: messages.playlistsDescription
  }
}

type RewardsBannerProps = {
  bannerType: 'tracks' | 'playlists'
}

const useHandleBannerClick = () => {
  const [, setModal] = useModalState('TrendingRewardsExplainer')
  const dispatch = useDispatch()
  const onClickBanner = useCallback(
    (modalType: TrendingRewardsModalType) => {
      setModal(true)
      dispatch(setTrendingRewardsModalType({ modalType }))
    },
    [dispatch, setModal]
  )
  return onClickBanner
}

const RewardsBanner = ({ bannerType }: RewardsBannerProps) => {
  const mobile = isMobile()
  const mobileStyle = { [styles.mobile]: mobile }
  const onClick = useHandleBannerClick()

  return (
    <div
      className={cn(cn(styles.container, mobileStyle))}
      onClick={() => onClick(bannerType)}
    >
      <div className={cn(styles.rewardsText, mobileStyle)}>
        <div className={styles.iconCrown}>
          <IconCrown />
        </div>
        {messages.rewards}
      </div>
      <span className={styles.descriptionText}>
        {messageMap[bannerType].description}
      </span>
      {!mobile && (
        <div className={styles.learnMore}>
          {messages.learnMore}
          <IconArrow />
        </div>
      )}
    </div>
  )
}

export default RewardsBanner
