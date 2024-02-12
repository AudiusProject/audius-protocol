import { useCallback } from 'react'

import {
  audioRewardsPageActions,
  TrendingRewardsModalType
} from '@audius/common/store'
import {
  IconArrowRight as IconArrow,
  IconCrown,
  useTheme
} from '@audius/harmony'
import cn from 'classnames'
import { useDispatch } from 'react-redux'

import { useModalState } from 'common/hooks/useModalState'
import { useIsMobile } from 'hooks/useIsMobile'

import styles from './RewardsBanner.module.css'
const { setTrendingRewardsModalType } = audioRewardsPageActions

const messages = {
  rewards: '$AUDIO REWARDS',
  tracksDescription: 'TOP 5 TRACKS EACH WEEK WIN $AUDIO',
  playlistsDescription: 'TOP 5 PLAYLISTS EACH WEEK WIN $AUDIO',
  undergroundDescription: 'TOP 5 TRACKS EACH WEEK WIN $AUDIO',
  learnMore: 'LEARN MORE'
}

const messageMap = {
  tracks: {
    description: messages.tracksDescription
  },
  playlists: {
    description: messages.playlistsDescription
  },
  underground: {
    description: messages.undergroundDescription
  }
}

type RewardsBannerProps = {
  bannerType: 'tracks' | 'playlists' | 'underground'
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
  const isMobile = useIsMobile()
  const mobileStyle = { [styles.mobile]: isMobile }
  const onClick = useHandleBannerClick()
  const { spacing } = useTheme()

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
      {!isMobile && (
        <div className={styles.learnMore}>
          {messages.learnMore}
          <IconArrow size='s' css={{ marginLeft: spacing.xs }} />
        </div>
      )}
    </div>
  )
}

export default RewardsBanner
