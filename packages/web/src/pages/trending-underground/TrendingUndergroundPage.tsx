import { useTrendingUnderground } from '@audius/common/api'
import { trendingUndergroundPageLineupActions } from '@audius/common/store'
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

import styles from './TrendingUndergroundPage.module.css'
const { TRENDING_UNDERGROUND_PAGE } = route

const messages = {
  trendingUndergroundTitle: 'Underground Trending',
  description: createSeoDescription(
    "Listen to what's trending on the Audius platform"
  )
}

const MobileTrendingUndergroundPage = (props: LineupProps) => {
  useMobileHeader({ title: messages.trendingUndergroundTitle })

  return (
    <MobilePageContainer
      title={messages.trendingUndergroundTitle}
      description={messages.description}
      canonicalUrl={`${BASE_URL}${TRENDING_UNDERGROUND_PAGE}`}
      hasDefaultHeader
    >
      <div className={styles.mobileLineupContainer}>
        <div className={styles.mobileBannerContainer}>
          <RewardsBanner bannerType='underground' />
        </div>
        <Lineup {...props} />
      </div>
    </MobilePageContainer>
  )
}

const DesktopTrendingUndergroundPage = (props: LineupProps) => {
  const header = <DesktopHeader primary={messages.trendingUndergroundTitle} />

  return (
    <Page
      title={messages.trendingUndergroundTitle}
      description={messages.description}
      size='large'
      header={header}
    >
      <div className={styles.bannerContainer}>
        <RewardsBanner bannerType='underground' />
      </div>
      <Lineup {...props} />
    </Page>
  )
}

const TrendingUndergroundPage = () => {
  const scrollParentRef = useMainContentRef()
  const isMobile = useIsMobile()
  const { lineup, loadNextPage, play, pause, isPlaying, pageSize } =
    useTrendingUnderground()
  const lineupProps = useTanQueryLineupProps()

  const props = {
    scrollParent: scrollParentRef.current,
    lineup,
    loadMore: loadNextPage,
    playing: isPlaying,
    playTrack: play,
    pauseTrack: pause,
    actions: trendingUndergroundPageLineupActions,
    pageSize,
    ...lineupProps
  }

  return isMobile ? (
    <MobileTrendingUndergroundPage {...props} />
  ) : (
    <DesktopTrendingUndergroundPage {...props} />
  )
}

export default TrendingUndergroundPage
