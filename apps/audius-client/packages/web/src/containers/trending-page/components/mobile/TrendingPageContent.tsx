import React, { useEffect, useContext, useCallback, useMemo } from 'react'

import cn from 'classnames'

import { ReactComponent as IconAllTime } from 'assets/img/iconAllTime.svg'
import { ReactComponent as IconDay } from 'assets/img/iconDay.svg'
import { ReactComponent as IconMonth } from 'assets/img/iconMonth.svg'
import { Name } from 'common/models/Analytics'
import Status from 'common/models/Status'
import TimeRange from 'common/models/TimeRange'
import MobilePageContainer from 'components/general/MobilePageContainer'
import Header from 'components/general/header/mobile/Header'
import { HeaderContext } from 'components/general/header/mobile/HeaderContextProvider'
import PullToRefresh from 'components/pull-to-refresh/PullToRefresh'
import { EndOfLineup } from 'containers/lineup/EndOfLineup'
import Lineup from 'containers/lineup/Lineup'
import { LineupVariant } from 'containers/lineup/types'
import NavContext, {
  LeftPreset,
  CenterPreset,
  RightPreset
} from 'containers/nav/store/context'
import {
  trendingWeekActions,
  trendingMonthActions,
  trendingYearActions
} from 'containers/trending-page/store/lineups/trending/actions'
import { TrendingPageContentProps } from 'containers/trending-page/types'
import useAsyncPoll from 'hooks/useAsyncPoll'
import useTabs from 'hooks/useTabs/useTabs'
import { make, useRecord } from 'store/analytics/actions'
import { BASE_URL, TRENDING_PAGE } from 'utils/route'
import { scrollWindowToTop } from 'utils/scroll'

import RewardsBanner from '../RewardsBanner'

import TrendingFilterButton from './TrendingFilterButton'
import styles from './TrendingPageContent.module.css'

const messages = {
  title: 'Trending',
  thisWeek: 'THIS WEEK',
  thisMonth: 'THIS MONTH',
  thisYear: 'THIS YEAR',
  endOfLineupDescription: "Looks like you've reached the end of this list..."
}

const RANK_ICON_COUNT = 5

const tabHeaders = [
  { icon: <IconDay />, text: messages.thisWeek, label: TimeRange.WEEK },
  { icon: <IconMonth />, text: messages.thisMonth, label: TimeRange.MONTH },
  { icon: <IconAllTime />, text: messages.thisYear, label: TimeRange.YEAR }
]

const TrendingPageMobileContent = ({
  trendingTitle,
  trendingDescription,

  trendingTimeRange,
  setTrendingTimeRange,
  makeRefreshTrendingInView,

  getLineupProps,
  makePauseTrack,
  makeLoadMore,
  makePlayTrack,
  trendingWeek,
  trendingMonth,
  trendingYear,
  makeSetInView,
  getLineupForRange,
  trendingGenre,
  goToGenreSelection
}: TrendingPageContentProps) => {
  // Set Nav-Bar Menu
  const { setLeft, setCenter, setRight } = useContext(NavContext)!
  useEffect(() => {
    setLeft(LeftPreset.NOTIFICATION)
    setRight(RightPreset.SEARCH)
    setCenter(CenterPreset.LOGO)
  }, [setLeft, setCenter, setRight])

  const getStatus = (timeRange: TimeRange) => {
    const lineup = getLineupForRange(timeRange)
    if (!lineup) return Status.SUCCESS
    return lineup.lineup.status
  }

  const [weekStatus, monthStatus, yearStatus] = [
    getStatus(TimeRange.WEEK),
    getStatus(TimeRange.MONTH),
    getStatus(TimeRange.YEAR)
  ]

  // Setup pull to refresh
  const refreshTrendingWeek = useCallback(
    () => makeRefreshTrendingInView(TimeRange.WEEK)(true),
    [makeRefreshTrendingInView]
  )
  const refreshTrendingMonth = useCallback(
    () => makeRefreshTrendingInView(TimeRange.MONTH)(true),
    [makeRefreshTrendingInView]
  )
  const refreshTrendingYear = useCallback(
    () => makeRefreshTrendingInView(TimeRange.YEAR)(true),
    [makeRefreshTrendingInView]
  )

  const asyncRefresh = {
    [TimeRange.WEEK]: useAsyncPoll({
      call: refreshTrendingWeek,
      variable: weekStatus,
      value: Status.SUCCESS
    }),
    [TimeRange.MONTH]: useAsyncPoll({
      call: refreshTrendingMonth,
      variable: monthStatus,
      value: Status.SUCCESS
    }),
    [TimeRange.YEAR]: useAsyncPoll({
      call: refreshTrendingYear,
      variable: yearStatus,
      value: Status.SUCCESS
    })
  }

  // Setup lineups
  const weekProps = useMemo(() => getLineupProps(trendingWeek), [
    getLineupProps,
    trendingWeek
  ])
  const monthProps = useMemo(() => getLineupProps(trendingMonth), [
    getLineupProps,
    trendingMonth
  ])
  const yearProps = useMemo(() => getLineupProps(trendingYear), [
    getLineupProps,
    trendingYear
  ])

  const lineups = useMemo(() => {
    return [
      <>
        {trendingGenre === null ? (
          <div className={styles.rewardsContainer}>
            <RewardsBanner bannerType='tracks' />
          </div>
        ) : null}
        <Lineup
          key='trendingWeek'
          {...weekProps}
          setInView={makeSetInView(TimeRange.WEEK)}
          loadMore={makeLoadMore(TimeRange.WEEK)}
          playTrack={makePlayTrack(TimeRange.WEEK)}
          pauseTrack={makePauseTrack(TimeRange.WEEK)}
          actions={trendingWeekActions}
          variant={LineupVariant.MAIN}
          isTrending
          rankIconCount={trendingGenre === null ? RANK_ICON_COUNT : undefined}
          endOfLineup={
            <EndOfLineup
              key='endOfLineup'
              description={messages.endOfLineupDescription}
            />
          }
        />
      </>,
      <Lineup
        key='trendingMonth'
        {...monthProps}
        setInView={makeSetInView(TimeRange.MONTH)}
        loadMore={makeLoadMore(TimeRange.MONTH)}
        playTrack={makePlayTrack(TimeRange.MONTH)}
        pauseTrack={makePauseTrack(TimeRange.MONTH)}
        actions={trendingMonthActions}
        variant={LineupVariant.MAIN}
        isTrending
        endOfLineup={
          <EndOfLineup
            key='endOfLineup'
            description={messages.endOfLineupDescription}
          />
        }
      />,
      <Lineup
        key='trendingYear'
        {...yearProps}
        setInView={makeSetInView(TimeRange.YEAR)}
        loadMore={makeLoadMore(TimeRange.YEAR)}
        playTrack={makePlayTrack(TimeRange.YEAR)}
        pauseTrack={makePauseTrack(TimeRange.YEAR)}
        actions={trendingYearActions}
        variant={LineupVariant.MAIN}
        isTrending
        endOfLineup={
          <EndOfLineup
            key='endOfLineup'
            description={messages.endOfLineupDescription}
          />
        }
      />
    ]
  }, [
    makeLoadMore,
    makePauseTrack,
    makePlayTrack,
    makeSetInView,
    monthProps,
    weekProps,
    yearProps,
    trendingGenre
  ])
  const record = useRecord()

  const didChangeTabs = useCallback(
    (from: string, to: string) => {
      if (from === to) return
      setTrendingTimeRange(to as TimeRange)

      // Fo the mobile layout scroll the document element, not the lineup container
      scrollWindowToTop()

      // Manually setInView
      makeSetInView(to as TimeRange)(true)
      makeSetInView(from as TimeRange)(false)
      if (from !== to)
        record(
          make(Name.TRENDING_CHANGE_VIEW, {
            timeframe: to as TimeRange,
            genre: trendingGenre || ''
          })
        )
    },
    [setTrendingTimeRange, makeSetInView, record, trendingGenre]
  )

  const memoizedElements = useMemo(() => {
    return lineups.map((lineup, i) => (
      <div key={i} className={cn(styles.lineupContainer)}>
        {lineup}
      </div>
    ))
  }, [lineups])

  const { tabs, body } = useTabs({
    tabs: tabHeaders,
    elements: memoizedElements,
    initialTab: trendingTimeRange,
    selectedTabLabel: trendingTimeRange,
    didChangeTabsFrom: didChangeTabs
  })

  const { setHeader } = useContext(HeaderContext)
  useEffect(() => {
    setHeader(
      <>
        <Header title={messages.title} className={styles.header}>
          <TrendingFilterButton
            selectedGenre={trendingGenre}
            onClick={goToGenreSelection}
          />
        </Header>
        <div className={styles.tabBarHolder}>{tabs}</div>
      </>
    )
  }, [setHeader, trendingGenre, goToGenreSelection, tabs])

  return (
    <MobilePageContainer
      title={trendingTitle}
      description={trendingDescription}
      canonicalUrl={`${BASE_URL}${TRENDING_PAGE}`}
    >
      <div className={styles.tabsContainer}>
        <div className={styles.tabBodyHolder}>
          <PullToRefresh fetchContent={asyncRefresh[trendingTimeRange]}>
            {body}
          </PullToRefresh>
        </div>
      </div>
    </MobilePageContainer>
  )
}

export default TrendingPageMobileContent
