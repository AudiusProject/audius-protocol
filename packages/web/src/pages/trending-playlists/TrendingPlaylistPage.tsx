import { useTrendingPlaylists } from '@audius/common/api'
import { trendingPlaylistsPageLineupActions } from '@audius/common/store'
import { route } from '@audius/common/utils'

import { Header as DesktopHeader } from 'components/header/desktop/Header'
import { useMobileHeader } from 'components/header/mobile/hooks'
import Lineup, { LineupProps } from 'components/lineup/Lineup'
import { useTanQueryLineupProps } from 'components/lineup/hooks'
import MobilePageContainer from 'components/mobile-page-container/MobilePageContainer'
import Page from 'components/page/Page'
import { useIsMobile } from 'hooks/useIsMobile'
import { useMainContentRef } from 'pages/MainContentContext'
import RewardsBanner from 'pages/trending-page/components/RewardsBanner'
import { BASE_URL } from 'utils/route'
import { createSeoDescription } from 'utils/seo'

import styles from './TrendingPlaylistPage.module.css'

const { TRENDING_PLAYLISTS_PAGE } = route

const messages = {
  trendingPlaylistTile: 'Trending Playlists',
  description: createSeoDescription('Trending Playlists on Audius')
}

const DesktopTrendingPlaylistPage = (props: LineupProps) => {
  const header = <DesktopHeader primary={messages.trendingPlaylistTile} />

  return (
    <Page
      title={messages.trendingPlaylistTile}
      description={messages.description}
      size='large'
      header={header}
    >
      <div className={styles.bannerContainer}>
        <RewardsBanner bannerType='playlists' />
      </div>
      <Lineup {...props} />
    </Page>
  )
}

const MobileTrendingPlaylistPage = (props: LineupProps) => {
  useMobileHeader({ title: messages.trendingPlaylistTile })

  return (
    <MobilePageContainer
      title={messages.trendingPlaylistTile}
      description={messages.description}
      canonicalUrl={`${BASE_URL}${TRENDING_PLAYLISTS_PAGE}`}
      hasDefaultHeader
    >
      <div className={styles.mobileLineupContainer}>
        <div className={styles.mobileBannerContainer}>
          <RewardsBanner bannerType='playlists' />
        </div>
        <Lineup {...props} />
      </div>
    </MobilePageContainer>
  )
}

const TrendingPlaylistPage = () => {
  const scrollParentRef = useMainContentRef()
  const isMobile = useIsMobile()
  const { lineup, loadNextPage, play, pause, isPlaying, pageSize } =
    useTrendingPlaylists()
  const lineupProps = useTanQueryLineupProps()

  const props = {
    scrollParent: scrollParentRef.current,
    lineup,
    loadMore: loadNextPage,
    playing: isPlaying,
    playTrack: play,
    pauseTrack: pause,
    actions: trendingPlaylistsPageLineupActions,
    pageSize,
    ...lineupProps
  }

  return isMobile ? (
    <MobileTrendingPlaylistPage {...props} />
  ) : (
    <DesktopTrendingPlaylistPage {...props} />
  )
}

export default TrendingPlaylistPage
