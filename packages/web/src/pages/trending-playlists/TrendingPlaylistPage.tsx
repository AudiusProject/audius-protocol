import { useTrendingPlaylists } from '@audius/common/api'
import { trendingPlaylistsPageLineupActions } from '@audius/common/store'
import { route } from '@audius/common/utils'

import { Header as DesktopHeader } from 'components/header/desktop/Header'
import { useMobileHeader } from 'components/header/mobile/hooks'
import {
  TanQueryLineup,
  TanQueryLineupProps
} from 'components/lineup/TanQueryLineup'
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

type TrendingPlaylistPageProps = {
  lineupProps: TanQueryLineupProps
}

const DesktopTrendingPlaylistPage = ({
  lineupProps
}: TrendingPlaylistPageProps) => {
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
      <TanQueryLineup {...lineupProps} />
    </Page>
  )
}

const MobileTrendingPlaylistPage = ({
  lineupProps
}: TrendingPlaylistPageProps) => {
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
        <TanQueryLineup {...lineupProps} />
      </div>
    </MobilePageContainer>
  )
}

const TrendingPlaylistPage = () => {
  const scrollParentRef = useMainContentRef()
  const isMobile = useIsMobile()
  const trendingPlaylistsData = useTrendingPlaylists()

  const lineupProps = {
    actions: trendingPlaylistsPageLineupActions,
    scrollParent: scrollParentRef.current,
    lineupQueryData: trendingPlaylistsData,
    pageSize: trendingPlaylistsData.pageSize
  }

  return isMobile ? (
    <MobileTrendingPlaylistPage lineupProps={lineupProps} />
  ) : (
    <DesktopTrendingPlaylistPage lineupProps={lineupProps} />
  )
}

export default TrendingPlaylistPage
