import { useEffect } from 'react'

import {
  trendingPlaylistsPageLineupSelectors,
  trendingPlaylistsPageLineupActions
} from '@audius/common/store'
import { route } from '@audius/common/utils'
import { useDispatch } from 'react-redux'

import { Header as DesktopHeader } from 'components/header/desktop/Header'
import { useMobileHeader } from 'components/header/mobile/hooks'
import Lineup from 'components/lineup/Lineup'
import { useLineupProps } from 'components/lineup/hooks'
import { LineupVariant } from 'components/lineup/types'
import MobilePageContainer from 'components/mobile-page-container/MobilePageContainer'
import Page from 'components/page/Page'
import { useIsMobile } from 'hooks/useIsMobile'
import RewardsBanner from 'pages/trending-page/components/RewardsBanner'
import { BASE_URL } from 'utils/route'
import { createSeoDescription } from 'utils/seo'

import styles from './TrendingPlaylistPage.module.css'

const { TRENDING_PLAYLISTS_PAGE } = route
const { getLineup } = trendingPlaylistsPageLineupSelectors

const messages = {
  trendingPlaylistTile: 'Trending Playlists',
  description: createSeoDescription('Trending Playlists on Audius')
}

/** Wraps useLineupProps to return trending playlist lineup props */
const useTrendingPlaylistLineup = (containerRef: HTMLElement) => {
  return useLineupProps({
    actions: trendingPlaylistsPageLineupActions,
    getLineupSelector: getLineup,
    variant: LineupVariant.PLAYLIST,
    numPlaylistSkeletonRows: 5,
    scrollParent: containerRef,
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
      <Lineup {...lineupProps} numPlaylistSkeletonRows={5} />
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
      hasDefaultHeader
    >
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
      dispatch(trendingPlaylistsPageLineupActions.reset())
    }
  }, [dispatch])
}

const TrendingPlaylistPage = (props: TrendingPlaylistPageProps) => {
  const isMobile = useIsMobile()

  useLineupReset()

  return (
    <>
      {isMobile ? (
        <MobileTrendingPlaylistPage {...props} />
      ) : (
        <DesktopTrendingPlaylistPage {...props} />
      )}
    </>
  )
}

export default TrendingPlaylistPage
