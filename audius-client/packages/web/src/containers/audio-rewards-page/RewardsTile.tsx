import React, { ReactNode } from 'react'
import { Tile } from './components/ExplainerTile'
import styles from './RewardsTile.module.css'
import { useWithMobileStyle } from 'hooks/useWithMobileStyle'
import { useSetVisibility } from 'hooks/useModalState'
import ButtonWithArrow from './components/ButtonWithArrow'
import { useRemoteVar } from 'containers/remote-config/hooks'
import { StringKeys } from 'services/remote-config'
import { useDispatch } from 'react-redux'
import { setTrendingRewardsModalType } from './store/slice'

type RewardID =
  | 'trending-track'
  | 'trending-playlist'
  | 'top-api'
  | 'verified-upload'

type RewardPanelProps = {
  title: string
  icon: ReactNode
  description: string
  buttonText: string
  onClickButton: () => void
  id: RewardID
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
        text={buttonText}
        onClick={onClickButton}
        textClassName={styles.panelButtonText}
      />
    </div>
  )
}

const rewardsMap = {
  'trending-playlist': {
    title: 'Top 5 Trending Playlists',
    icon: <i className='emoji large chart-increasing' />,
    description: 'Winners are selected every Friday at Noon PT!',
    buttonText: 'See More',
    id: 'trending-playlist' as 'trending-playlist'
  },
  'trending-track': {
    title: 'Top 5 Trending Tracks',
    icon: <i className='emoji large chart-increasing' />,
    description: 'Winners are selected every Friday at Noon PT!',
    buttonText: 'See More',
    id: 'trending-track' as 'trending-track'
  },
  'top-api': {
    title: 'Top 10 API Apps',
    icon: <i className='emoji large nerd-face' />,
    description: 'The top 10 Audius API apps each month win',
    buttonText: 'More Info',
    id: 'top-api' as 'top-api'
  },
  'verified-upload': {
    title: 'Verified Upload',
    icon: <i className='emoji large white-heavy-check-mark' />,
    description: 'Verified on Twitter/Instagram? Upload & tag us',
    buttonText: 'More Info',
    id: 'verified-upload' as 'verified-upload'
  }
}

type RewardsTileProps = {
  className?: string
}

const validRewardIds: { [k in RewardID]: any } = {
  'trending-track': 1,
  'trending-playlist': 1,
  'top-api': 1,
  'verified-upload': 1
}

const isValidRewardId = (s: string): s is RewardID => s in validRewardIds

const messages = {
  title: '$AUDIO REWARDS',
  description1: 'Win contests and complete tasks to earn $AUDIO tokens!',
  description2:
    'Opportunities to earn $AUDIO will change, so check back often for more chances to earn!'
}

/** Pulls rewards from remoteconfig */
const useRewardIds = () => {
  const rewardsString = useRemoteVar(StringKeys.REWARDS_IDS)
  if (!rewardsString) return []
  const rewards = rewardsString.split(',')
  const filteredRewards: RewardID[] = rewards.filter(isValidRewardId)
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
    'top-api': () => {
      setVisibility('APIRewardsExplainer')(true)
    },
    'verified-upload': () => {
      setVisibility('LinkSocialRewardsExplainer')(true)
    }
  }

  const rewardIds = useRewardIds()

  const rewardsTiles = rewardIds
    .map(id => rewardsMap[id])
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
        <span>{messages.description2}</span>
      </div>
      <div className={styles.rewardsContainer}>{rewardsTiles}</div>
    </Tile>
  )
}

export default RewardsTile
