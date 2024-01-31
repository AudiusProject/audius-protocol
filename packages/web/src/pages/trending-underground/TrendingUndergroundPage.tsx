import { useEffect } from 'react'

import {
  trendingUndergroundPageLineupSelectors,
  trendingUndergroundPageLineupActions
} from '@audius/common/store'

import { useDispatch } from 'react-redux'

import DesktopHeader from 'components/header/desktop/Header'
import { useMobileHeader } from 'components/header/mobile/hooks'
import Lineup from 'components/lineup/Lineup'
import { useLineupProps } from 'components/lineup/hooks'
import { LineupVariant } from 'components/lineup/types'
import MobilePageContainer from 'components/mobile-page-container/MobilePageContainer'
import Page from 'components/page/Page'
import { useIsMobile } from 'hooks/useIsMobile'
import RewardsBanner from 'pages/trending-page/components/RewardsBanner'
import { BASE_URL, TRENDING_UNDERGROUND_PAGE } from 'utils/route'
import { createSeoDescription } from 'utils/seo'

import styles from './TrendingUndergroundPage.module.css'
const { getLineup } = trendingUndergroundPageLineupSelectors

const useTrendingUndergroundLineup = (containerRef: HTMLElement) => {
  return useLineupProps({
    actions: trendingUndergroundPageLineupActions,
    getLineupSelector: getLineup,
    variant: LineupVariant.MAIN,
    scrollParent: containerRef,
    rankIconCount: 5,
    isTrending: true,
    isOrdered: true
  })
}

const messages = {
  trendingUndergroundTitle: 'Underground Trending',
  description: createSeoDescription(
    "Listen to what's trending on the Audius platform"
  )
}

type TrendingUndergroundPageProps = {
  containerRef: HTMLElement
}

const MobileTrendingUndergroundPage = ({
  containerRef
}: TrendingUndergroundPageProps) => {
  const lineupProps = useTrendingUndergroundLineup(containerRef)
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
        <Lineup {...lineupProps} />
      </div>
    </MobilePageContainer>
  )
}

const DesktopTrendingUndergroundPage = ({
  containerRef
}: TrendingUndergroundPageProps) => {
  const lineupProps = useTrendingUndergroundLineup(containerRef)

  const header = (
    <DesktopHeader primary={messages.trendingUndergroundTitle} variant='main' />
  )

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
      <Lineup {...lineupProps} />
    </Page>
  )
}

const useLineupReset = () => {
  const dispatch = useDispatch()
  useEffect(() => {
    return () => {
      dispatch(trendingUndergroundPageLineupActions.reset())
    }
  }, [dispatch])
}

const TrendingUndergroundPage = (props: TrendingUndergroundPageProps) => {
  const isMobile = useIsMobile()

  useLineupReset()

  return (
    <>
      {isMobile ? (
        <MobileTrendingUndergroundPage {...props} />
      ) : (
        <DesktopTrendingUndergroundPage {...props} />
      )}
    </>
  )
}

export default TrendingUndergroundPage
