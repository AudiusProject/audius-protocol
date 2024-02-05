import { useCallback, useEffect, useState } from 'react'

import {
  Theme,
  StringKeys,
  audioRewardsPageActions,
  TrendingRewardsModalType,
  audioRewardsPageSelectors
} from '@audius/common'
import { SegmentedControl, ButtonType, Button, IconArrow } from '@audius/stems'
import cn from 'classnames'
import { useDispatch } from 'react-redux'
import { TwitterTweetEmbed } from 'react-twitter-embed'

import { useModalState } from 'common/hooks/useModalState'
import LoadingSpinner from 'components/loading-spinner/LoadingSpinner'
import { useIsMobile } from 'hooks/useIsMobile'
import { useNavigateToPage } from 'hooks/useNavigateToPage'
import { useRemoteVar } from 'hooks/useRemoteConfig'
import { useWithMobileStyle } from 'hooks/useWithMobileStyle'
import { useSelector } from 'utils/reducer'
import {
  TRENDING_PAGE,
  TRENDING_PLAYLISTS_PAGE,
  TRENDING_UNDERGROUND_PAGE
} from 'utils/route'
import { getTheme, isDarkMode } from 'utils/theme/theme'

import ModalDrawer from './ModalDrawer'
import styles from './TrendingRewards.module.css'
const { getTrendingRewardsModalType } = audioRewardsPageSelectors
const { setTrendingRewardsModalType } = audioRewardsPageActions

const messages = {
  tracksTitle: 'Top 5 Tracks Each Week Receive 100 $AUDIO',
  playlistTitle: 'Top 5 Playlists Each Week Receive 100 $AUDIO',
  undergroundTitle: 'Top 5 Tracks Each Week Receive 100 $AUDIO',
  winners: 'Winners are selected every Friday at Noon PT!',
  lastWeek: "LAST WEEK'S WINNERS",
  tracks: 'TRACKS',
  topTracks: 'TOP TRACKS',
  playlists: 'PLAYLISTS',
  topPlaylists: 'TOP PLAYLISTS',
  underground: 'UNDERGROUND',
  terms: 'Terms and Conditions Apply',
  tracksModalTitle: 'Top 5 Trending Tracks',
  playlistsModalTitle: 'Top 5 Trending Playlists',
  undergroundModalTitle: 'Top 5 Underground Trending Tracks',
  buttonTextTracks: 'Current Trending Tracks',
  buttonTextPlaylists: 'Current Trending Playlists',
  buttonTextUnderground: 'Current Underground Trending Tracks',
  mobileButtonTextTracks: 'Trending Tracks',
  mobileButtonTextPlaylists: 'Trending Playlists',
  mobileButtonTextUnderground: 'Underground Trending Tracks',
  arrowCurveUp: 'arrow-curve-up',
  chartBar: 'chart-bar',
  chartIncreasing: 'chart-increasing'
}

const TRENDING_PAGES = {
  tracks: TRENDING_PAGE,
  playlists: TRENDING_PLAYLISTS_PAGE,
  underground: TRENDING_UNDERGROUND_PAGE
}

const textMap = {
  playlists: {
    modalTitle: messages.playlistsModalTitle,
    title: messages.playlistTitle,
    button: messages.buttonTextPlaylists,
    buttonMobile: messages.mobileButtonTextPlaylists,
    icon: messages.arrowCurveUp
  },
  tracks: {
    modalTitle: messages.tracksModalTitle,
    title: messages.tracksTitle,
    button: messages.buttonTextTracks,
    buttonMobile: messages.mobileButtonTextTracks,
    icon: messages.chartIncreasing
  },
  underground: {
    modalTitle: messages.undergroundModalTitle,
    title: messages.undergroundTitle,
    button: messages.buttonTextUnderground,
    buttonMobile: messages.mobileButtonTextUnderground,
    icon: messages.chartBar
  }
}

const TOS_URL = 'https://blog.audius.co/posts/audio-rewards'

// Getters and setters for whether we're looking at
// trending playlists or trending tracks
const useRewardsType = (): [
  TrendingRewardsModalType,
  (type: TrendingRewardsModalType) => void
] => {
  const dispatch = useDispatch()
  const rewardsType = useSelector(getTrendingRewardsModalType)
  const setTrendingRewardsType = useCallback(
    (type: TrendingRewardsModalType) => {
      dispatch(setTrendingRewardsModalType({ modalType: type }))
    },
    [dispatch]
  )
  return [rewardsType, setTrendingRewardsType]
}

const useTweetId = (type: TrendingRewardsModalType) => {
  const tracksId = useRemoteVar(StringKeys.REWARDS_TWEET_ID_TRACKS)
  const playlistsId = useRemoteVar(StringKeys.REWARDS_TWEET_ID_PLAYLISTS)
  const undergroundId = useRemoteVar(StringKeys.REWARDS_TWEET_ID_UNDERGROUND)
  return {
    tracks: tracksId,
    playlists: playlistsId,
    underground: undergroundId
  }[type]
}
const shouldUseDarkTwitter = () => {
  const theme = getTheme()
  return theme === Theme.MATRIX || isDarkMode()
}

const TrendingRewardsBody = ({
  dismissModal
}: {
  dismissModal: () => void
}) => {
  const [modalType, setModalType] = useRewardsType()

  const onClickToS = useCallback(() => {
    window.open(TOS_URL, '_blank')
  }, [])

  const isMobile = useIsMobile()
  const tabOptions = [
    {
      key: 'tracks',
      text: isMobile ? messages.tracks : messages.topTracks
    },
    {
      key: 'playlists',
      text: isMobile ? messages.playlists : messages.topPlaylists
    },
    {
      key: 'underground',
      text: messages.underground
    }
  ]

  const navigate = useNavigateToPage()

  const onButtonClick = useCallback(() => {
    const page = TRENDING_PAGES[modalType]
    navigate(page)
    dismissModal()
  }, [navigate, modalType, dismissModal])

  const wm = useWithMobileStyle(styles.mobile)

  // If we change type, show the spinner again
  const [showSpinner, setShowSpinner] = useState(true)
  useEffect(() => {
    setShowSpinner(true)
  }, [modalType])

  const tweetId = useTweetId(modalType)

  return (
    <div className={styles.scrollContainer}>
      <div className={wm(styles.container)}>
        <div className={styles.sliderContainer}>
          <SegmentedControl
            options={tabOptions}
            selected={modalType}
            onSelectOption={(option) =>
              setModalType(option as TrendingRewardsModalType)
            }
            textClassName={cn(styles.slider, styles.compactSlider)}
            activeTextClassName={styles.activeSlider}
            key={`rewards-slider-${tabOptions.length}`}
          />
        </div>
        <div className={styles.titles}>
          <span className={styles.title}>{textMap[modalType].title}</span>
          <span className={styles.subtitle}>{messages.winners}</span>
        </div>
        <div className={styles.insetRegion}>
          <span className={styles.lastWeek}>{messages.lastWeek}</span>
          <div className={styles.embedWrapper}>
            {showSpinner && <LoadingSpinner className={styles.spinner} />}
            <TwitterTweetEmbed
              // Refresh it when we toggle
              key={`twitter-${modalType}`}
              tweetId={tweetId}
              onLoad={() => setShowSpinner(false)}
              options={{
                theme: shouldUseDarkTwitter() ? 'dark' : 'light',
                cards: 'none',
                conversation: 'none',
                hide_thread: true,
                width: 554,
                height: 390
              }}
            />
          </div>
        </div>
        <Button
          type={ButtonType.PRIMARY_ALT}
          text={textMap[modalType][isMobile ? 'buttonMobile' : 'button']}
          onClick={onButtonClick}
          className={styles.button}
          rightIcon={<IconArrow />}
          iconClassName={wm(styles.buttonIcon)}
        />
        <span onClick={onClickToS} className={styles.terms}>
          {messages.terms}
        </span>
      </div>
    </div>
  )
}

export const TrendingRewardsModal = () => {
  const [isOpen, setOpen] = useModalState('TrendingRewardsExplainer')
  const [modalType] = useRewardsType()

  return (
    <ModalDrawer
      isOpen={isOpen}
      onClose={() => setOpen(false)}
      title={
        <h2 className={styles.titleHeader}>
          <i
            className={`emoji large ${styles.titleIcon} ${textMap[modalType].icon}`}
          />
          {textMap[modalType].modalTitle}
        </h2>
      }
      allowScroll
      showTitleHeader
      showDismissButton
    >
      <TrendingRewardsBody dismissModal={() => setOpen(false)} />
    </ModalDrawer>
  )
}

export default TrendingRewardsModal
