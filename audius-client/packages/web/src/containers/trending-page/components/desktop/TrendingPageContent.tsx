import React, { useState, useRef, useCallback } from 'react'

import { Name } from 'common/models/Analytics'
import Status from 'common/models/Status'
import TimeRange from 'common/models/TimeRange'
import Page from 'components/general/Page'
import Header from 'components/general/header/desktop/Header'
import EndOfLineup from 'containers/lineup/EndOfLineup'
import Lineup from 'containers/lineup/Lineup'
import { LineupVariant } from 'containers/lineup/types'
import {
  trendingWeekActions,
  trendingMonthActions,
  trendingYearActions
} from 'containers/trending-page/store/lineups/trending/actions'
import { TrendingPageContentProps } from 'containers/trending-page/types'
import useTabs from 'hooks/useTabs/useTabs'
import { make, useRecord } from 'store/analytics/actions'
import { GENRES, ELECTRONIC_PREFIX } from 'utils/genres'

import RewardsBanner from '../RewardsBanner'

import GenreSelectionModal from './GenreSelectionModal'
import TrendingGenreFilters from './TrendingGenreFilters'
import styles from './TrendingPageContent.module.css'

const messages = {
  thisWeek: 'THIS WEEK',
  thisMonth: 'THIS MONTH',
  allTime: 'ALL TIME',
  allGenres: 'All Genres',
  endOfLineupDescription: "Looks like you've reached the end of this list...",
  disabledTabTooltip: 'Nothing available'
}

const initialGenres = [
  messages.allGenres,
  'Electronic',
  'Hip-Hop/Rap',
  'Alternative'
]

const RANK_ICON_COUNT = 5

// Creates a unique cache key for a time range & genre combination
const getTimeGenreCacheKey = (timeRange: TimeRange, genre: string | null) => {
  const newGenre = genre || 'all'
  return `${timeRange}-${newGenre}`
}

// For a given timeRange with no tracks,
// what other time ranges do we need to disable?
const getRangesToDisable = (timeRange: TimeRange) => {
  switch (timeRange) {
    case TimeRange.YEAR:
    case TimeRange.MONTH:
      // In the case of TimeRange.YEAR,
      // we don't want to return YEAR because
      // we don't want to disable YEAR (it's the only possible tab left, even if it's empty).
      return [TimeRange.MONTH, TimeRange.WEEK]
    case TimeRange.WEEK:
      return [TimeRange.WEEK]
  }
}

const TrendingPageContent = (props: TrendingPageContentProps) => {
  const {
    trendingTitle,
    trendingDescription,
    trendingWeek,
    trendingMonth,
    trendingYear,
    getLineupProps,
    trendingGenre,
    setTrendingGenre,
    setTrendingTimeRange,
    trendingTimeRange,
    lastFetchedTrendingGenre,
    makeLoadMore,
    makePlayTrack,
    makePauseTrack,
    makeSetInView,
    makeResetTrending,
    getLineupForRange,
    scrollToTop
  } = props

  const weekProps = getLineupProps(trendingWeek)
  const monthProps = getLineupProps(trendingMonth)
  const yearProps = getLineupProps(trendingYear)

  // Maintain a set of combinations of time range & genre that
  // have no tracks.
  const emptyTimeGenreSet = useRef(new Set())

  const getLimit = useCallback(
    (timeRange: TimeRange) => {
      return getLineupForRange(timeRange).lineup.total
    },
    [getLineupForRange]
  )

  const reloadAndSwitchTabs = (timeRange: TimeRange) => {
    makeResetTrending(timeRange)()
    setTrendingTimeRange(timeRange)
    scrollToTop(timeRange)
    const offset = 0
    makeLoadMore(timeRange)(offset, getLimit(timeRange), true)
  }

  // Called when we have an empty state
  const moveToNextTab = () => {
    switch (trendingTimeRange) {
      case TimeRange.WEEK: {
        // If week is empty, month might also be empty (because we accessed it previously.)
        // If month is also empty, jump straight to year.
        const monthAlsoEmpty = emptyTimeGenreSet.current.has(
          getTimeGenreCacheKey(TimeRange.MONTH, trendingGenre!)
        )
        const newTimeRange = monthAlsoEmpty ? TimeRange.YEAR : TimeRange.MONTH
        reloadAndSwitchTabs(newTimeRange)
        break
      }
      case TimeRange.MONTH:
        reloadAndSwitchTabs(TimeRange.YEAR)
        break
      case TimeRange.YEAR:
      default:
      // Nothing to do for year
    }
  }

  const setGenreAndRefresh = useCallback(
    (genre: string | null) => {
      const trimmedGenre =
        genre !== null ? genre.replace(ELECTRONIC_PREFIX, '') : genre
      setTrendingGenre(trimmedGenre)

      // Call reset to change everything everything to skeleton tiles
      makeResetTrending(TimeRange.WEEK)()
      makeResetTrending(TimeRange.MONTH)()
      makeResetTrending(TimeRange.YEAR)()

      scrollToTop(trendingTimeRange)

      const limit = getLimit(trendingTimeRange)
      const offset = 0
      makeLoadMore(trendingTimeRange)(offset, limit, true)
    },
    [
      setTrendingGenre,
      makeLoadMore,
      trendingTimeRange,
      scrollToTop,
      makeResetTrending,
      getLimit
    ]
  )

  const cacheKey = getTimeGenreCacheKey(trendingTimeRange, trendingGenre)
  const currentLineup = getLineupForRange(trendingTimeRange)

  // We switch genres slightly before we fetch new lineup metadata, so if we're on a dead page
  // (e.g. some obscure genre with no All Time tracks), and then switch to a more popular genre
  // we will briefly be in a state with the New Genre set, but lineup status === Success and an empty
  // entries list. This would errantly cause us to think the lineup was empty and insert it into the cache.
  const unfetchedLineup = trendingGenre !== lastFetchedTrendingGenre

  // Should move to next tab if:
  //  - We've already seen this tab is empty AND we're not in the loading state
  //  OR
  //  - The current lineup was the last lineup fetched
  //    AND
  //  - The current lineup has finished fetching
  //    AND
  //  - The current lineup has no trending order (to ensure we're not in the middle of resetting/refretching)
  //    AND
  //  - We're not in the all genres (genre = null) state
  const shouldMoveToNextTab =
    (emptyTimeGenreSet.current.has(cacheKey) &&
      currentLineup.lineup.status !== Status.LOADING) ||
    (!unfetchedLineup &&
      currentLineup.lineup.status === Status.SUCCESS &&
      !currentLineup.lineup.entries.length &&
      trendingGenre !== null)

  if (shouldMoveToNextTab) {
    getRangesToDisable(trendingTimeRange)
      .map(r => getTimeGenreCacheKey(r, trendingGenre))
      .forEach(k => {
        emptyTimeGenreSet.current.add(k)
      })

    moveToNextTab()
  }

  const mainLineupProps = {
    variant: LineupVariant.MAIN
  }

  const trendingLineups = [
    <div key='week' className={styles.lineupContainer}>
      {trendingGenre === null ? (
        <div className={styles.bannerContainer}>
          <RewardsBanner bannerType='tracks' />
        </div>
      ) : null}
      <Lineup
        key='trendingWeek'
        ordered
        rankIconCount={trendingGenre === null ? RANK_ICON_COUNT : undefined}
        {...weekProps}
        setInView={makeSetInView(TimeRange.WEEK)}
        loadMore={makeLoadMore(TimeRange.WEEK)}
        playTrack={makePlayTrack(TimeRange.WEEK)}
        pauseTrack={makePauseTrack(TimeRange.WEEK)}
        actions={trendingWeekActions}
        endOfLineup={
          <EndOfLineup
            key='endOfLineup'
            description={messages.endOfLineupDescription}
          />
        }
        {...mainLineupProps}
      />
    </div>,
    <div key='month' className={styles.lineupContainer}>
      <Lineup
        key='trendingMonth'
        ordered
        {...monthProps}
        setInView={makeSetInView(TimeRange.MONTH)}
        loadMore={makeLoadMore(TimeRange.MONTH)}
        playTrack={makePlayTrack(TimeRange.MONTH)}
        pauseTrack={makePauseTrack(TimeRange.MONTH)}
        endOfLineup={
          <EndOfLineup
            key='endOfLineup'
            description={messages.endOfLineupDescription}
          />
        }
        actions={trendingMonthActions}
        {...mainLineupProps}
      />
    </div>,
    <div key='year' className={styles.lineupContainer}>
      <Lineup
        key='trendingYear'
        ordered
        {...yearProps}
        setInView={makeSetInView(TimeRange.YEAR)}
        loadMore={makeLoadMore(TimeRange.YEAR)}
        playTrack={makePlayTrack(TimeRange.YEAR)}
        pauseTrack={makePauseTrack(TimeRange.YEAR)}
        actions={trendingYearActions}
        endOfLineup={
          <EndOfLineup
            key='endOfLineup'
            description={messages.endOfLineupDescription}
          />
        }
        {...mainLineupProps}
      />
    </div>
  ]
  const record = useRecord()

  // Setup tabs
  const didChangeTabs = (from: string, to: string) => {
    setTrendingTimeRange(to as TimeRange)
    scrollToTop(to as TimeRange)
    record(
      make(Name.TRENDING_CHANGE_VIEW, {
        timeframe: to as TimeRange,
        genre: trendingGenre || ''
      })
    )
  }

  const tabIsDisabled = (timeRange: TimeRange) =>
    emptyTimeGenreSet.current.has(
      getTimeGenreCacheKey(timeRange, trendingGenre)
    )
  const { tabs, body } = useTabs({
    isMobile: false,
    tabs: [
      {
        text: messages.thisWeek,
        label: TimeRange.WEEK,
        disabled: tabIsDisabled(TimeRange.WEEK)
      },
      {
        text: messages.thisMonth,
        label: TimeRange.MONTH,
        disabled: tabIsDisabled(TimeRange.MONTH)
      },
      {
        text: messages.allTime,
        label: TimeRange.YEAR,
        disabled: tabIsDisabled(TimeRange.YEAR)
      }
    ],
    selectedTabLabel: trendingTimeRange,
    elements: trendingLineups,
    didChangeTabsFrom: didChangeTabs,
    bodyClassName: styles.tabBody,
    elementClassName: styles.tabElement,
    interElementSpacing: 100,
    disabledTabTooltipText: messages.disabledTabTooltip
  })

  const setGenre = useCallback(
    (genre: string | null) => {
      setGenreAndRefresh(genre)
      record(
        make(Name.TRENDING_CHANGE_VIEW, {
          timeframe: trendingTimeRange,
          genre: genre || ''
        })
      )
    },
    [setGenreAndRefresh, record, trendingTimeRange]
  )

  // Setup Modal
  const [modalIsOpen, setModalIsOpen] = useState(false)
  const didSelectModalGenre = (genre: string | null) => {
    const trimmedGenre =
      genre !== null ? genre.replace(ELECTRONIC_PREFIX, '') : genre
    setGenre(trimmedGenre)
    setModalIsOpen(false)
  }

  // Setup Header
  const header = (
    <Header
      primary={trendingTitle}
      variant={'main'}
      bottomBar={tabs}
      rightDecorator={
        <TrendingGenreFilters
          initialGenres={initialGenres}
          genre={trendingGenre}
          didSelectGenre={setGenre}
          didSelectMore={() => setModalIsOpen(true)}
        />
      }
    />
  )

  return (
    <>
      <Page
        title={trendingTitle}
        description={trendingDescription}
        size='large'
        header={header}
      >
        {body}
      </Page>
      <GenreSelectionModal
        genres={GENRES}
        selectedGenre={trendingGenre}
        didClose={() => {
          setModalIsOpen(false)
        }}
        didSelectGenre={didSelectModalGenre}
        isOpen={modalIsOpen}
      />
    </>
  )
}

export default TrendingPageContent
