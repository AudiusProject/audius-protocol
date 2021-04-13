import { useLineupProps } from 'containers/lineup/hooks'
import { trendingUndergroundLineupActions } from './store/lineups/tracks/actions'
import { getLineup } from './store/lineups/tracks/selectors'
import React, { useEffect } from 'react'
import { LineupVariant } from 'containers/lineup/types'
import DesktopHeader from 'components/general/header/desktop/Header'
import Page from 'components/general/Page'
import Lineup from 'containers/lineup/Lineup'
import { useDispatch } from 'react-redux'
import { isMobile } from 'utils/clientUtil'
import { useFlag } from 'containers/remote-config/hooks'
import { FeatureFlags, getFeatureEnabled } from 'services/remote-config'
import { useNavigateToPage } from 'hooks/useNavigateToPage'
import {
  BASE_URL,
  NOT_FOUND_PAGE,
  TRENDING_UNDERGROUND_PAGE
} from 'utils/route'
import { useMobileHeader } from 'components/general/header/mobile/hooks'
import MobilePageContainer from 'components/general/MobilePageContainer'
import styles from './TrendingUndergroundPage.module.css'
import RewardsBanner from 'containers/trending-page/components/RewardsBanner'

const useTrendingUndergroundLineup = (containerRef: HTMLElement) => {
  return useLineupProps({
    actions: trendingUndergroundLineupActions,
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
  description: "Listen to what's trending on the Audius platform"
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
      dispatch(trendingUndergroundLineupActions.reset())
    }
  }, [dispatch])
}

export const useIsTrendingUndergroundEnabled = () => {
  return useFlag(FeatureFlags.TRENDING_UNDERGROUND)
}

export const getIsTrendingUndergroundEnabled = () => {
  return getFeatureEnabled(FeatureFlags.ENABLE_USER_REPLICA_SET_MANAGER)
}

const TrendingUndergroundPage = (props: TrendingUndergroundPageProps) => {
  const mobile = isMobile()
  const { isEnabled, isLoaded } = useIsTrendingUndergroundEnabled()

  // If we haven't loaded remote config yet, wait
  // If we have, then either show trending underground
  // or navigate to 404
  const navigate = useNavigateToPage()
  useEffect(() => {
    if (isLoaded && !isEnabled) {
      navigate(NOT_FOUND_PAGE)
    }
  }, [isEnabled, isLoaded, navigate])

  useLineupReset()

  if (!isEnabled || !isLoaded) return null

  return (
    <>
      {mobile ? (
        <MobileTrendingUndergroundPage {...props} />
      ) : (
        <DesktopTrendingUndergroundPage {...props} />
      )}
    </>
  )
}

export default TrendingUndergroundPage
