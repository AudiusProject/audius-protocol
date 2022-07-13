import { useEffect } from 'react'

import { useDispatch } from 'react-redux'

import { trendingPlaylistLineupActions } from 'common/store/pages/trending-playlists/lineups/actions'
import { getLineup } from 'common/store/pages/trending-playlists/lineups/selectors'
import DesktopHeader from 'components/header/desktop/Header'
import { useMobileHeader } from 'components/header/mobile/hooks'
import Lineup from 'components/lineup/Lineup'
import { useLineupProps } from 'components/lineup/hooks'
import { LineupVariant } from 'components/lineup/types'
import MobilePageContainer from 'components/mobile-page-container/MobilePageContainer'
import Page from 'components/page/Page'
import RewardsBanner from 'pages/trending-page/components/RewardsBanner'
import { isMobile } from 'utils/clientUtil'
import { BASE_URL, TRENDING_PLAYLISTS_PAGE } from 'utils/route'

import styles from './TrendingPlaylistPage.module.css'

const messages = {
  trendingPlaylistTile: 'Trending Playlists',
  description: 'Trending Playlists on Audius'
}

/** Wraps useLineupProps to return trending playlist lineup props */
const useTrendingPlaylistLineup = (containerRef: HTMLElement) => {
  return useLineupProps({
    actions: trendingPlaylistLineupActions,
    getLineupSelector: getLineup,
    variant: LineupVariant.PLAYLIST,
    numPlaylistSkeletonRows: 5,
    scrollParent: containerRef,
    rankIconCount: 5,
    isTrending: true,
    isOrdered: true
  })
}

type TrendingPlaylistPageProps = {
  containerRef: HTMLElement
}

const DesktopTrendingPlaylistPage = ({
  containerRef
}: TrendingPlaylistPageProps) => {
  const lineupProps = useTrendingPlaylistLineup(containerRef)

  const header = (
    <DesktopHeader primary={messages.trendingPlaylistTile} variant='main' />
  )

  return (
    <Page
      title={messages.trendingPlaylistTile}
      description={messages.description}
      size='large'
      header={header}>
      <div className={styles.bannerContainer}>
        <RewardsBanner bannerType='playlists' />
      </div>
      <Lineup {...lineupProps} />
    </Page>
  )
}

const MobileTrendingPlaylistPage = ({
  containerRef
}: TrendingPlaylistPageProps) => {
  const lineupProps = useTrendingPlaylistLineup(containerRef)

  useMobileHeader({ title: messages.trendingPlaylistTile })

  return (
    <MobilePageContainer
      title={messages.trendingPlaylistTile}
      description={messages.description}
      canonicalUrl={`${BASE_URL}${TRENDING_PLAYLISTS_PAGE}`}
      hasDefaultHeader>
      <div className={styles.mobileLineupContainer}>
        <div className={styles.mobileBannerContainer}>
          <RewardsBanner bannerType='playlists' />
        </div>
        <Lineup {...lineupProps} />
      </div>
    </MobilePageContainer>
  )
}

const useLineupReset = () => {
  const dispatch = useDispatch()
  useEffect(() => {
    return () => {
      dispatch(trendingPlaylistLineupActions.reset())
    }
  }, [dispatch])
}

const TrendingPlaylistPage = (props: TrendingPlaylistPageProps) => {
  const mobile = isMobile()

  useLineupReset()

  return (
    <>
      {mobile ? (
        <MobileTrendingPlaylistPage {...props} />
      ) : (
        <DesktopTrendingPlaylistPage {...props} />
      )}
    </>
  )
}

export default TrendingPlaylistPage
