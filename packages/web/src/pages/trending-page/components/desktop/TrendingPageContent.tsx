import { useCallback, useRef, useState } from 'react'

import {
  TRENDING_INITIAL_PAGE_SIZE,
  TRENDING_LOAD_MORE_PAGE_SIZE,
  useTrending
} from '@audius/common/api'
import { Name, TimeRange } from '@audius/common/models'
import { trendingPageLineupActions } from '@audius/common/store'
import { ELECTRONIC_PREFIX, TRENDING_GENRES } from '@audius/common/utils'
import { IconTrending } from '@audius/harmony'

import { make, useRecord } from 'common/store/analytics/actions'
import { Header } from 'components/header/desktop/Header'
import EndOfLineup from 'components/lineup/EndOfLineup'
import { TanQueryLineup } from 'components/lineup/TanQueryLineup'
import { LineupVariant } from 'components/lineup/types'
import Page from 'components/page/Page'
import useTabs from 'hooks/useTabs/useTabs'
import { TrendingPageContentProps } from 'pages/trending-page/types'

import RewardsBanner from '../RewardsBanner'

import GenreSelectionModal from './GenreSelectionModal'
import { TrendingGenreFilters } from './TrendingGenreFilters'
import styles from './TrendingPageContent.module.css'
const { trendingAllTimeActions, trendingMonthActions, trendingWeekActions } =
  trendingPageLineupActions

const messages = {
  thisWeek: 'This Week',
  thisMonth: 'This Month',
  allTime: 'All Time',
  allGenres: 'All Genres',
  endOfLineupDescription: "Looks like you've reached the end of this list...",
  disabledTabTooltip: 'Nothing available'
}

// Creates a unique cache key for a time range & genre combination
const getTimeGenreCacheKey = (timeRange: TimeRange, genre: string | null) => {
  const newGenre = genre || 'all'
  return `${timeRange}-${newGenre}`
}

const TrendingPageContent = (props: TrendingPageContentProps) => {
  const {
    trendingTitle,
    pageTitle,
    trendingDescription,
    trendingGenre,
    setTrendingTimeRange,
    setTrendingGenre,
    trendingTimeRange,
    scrollToTop
  } = props

  const {
    data,
    isFetching,
    isPending,
    isError,
    hasNextPage,
    play,
    pause,
    loadNextPage,
    isPlaying,
    lineup
  } = useTrending({
    timeRange: trendingTimeRange,
    genre: trendingGenre
  })

  // Maintain a set of combinations of time range & genre that
  // have no tracks.
  const emptyTimeGenreSet = useRef(new Set())

  const trendingLineups = [
    <div
      key={`weekly-trending-tracks-${trendingGenre}`}
      className={styles.lineupContainer}
    >
      {trendingGenre === null ? (
        <div className={styles.bannerContainer}>
          <RewardsBanner bannerType='tracks' />
        </div>
      ) : null}
      <TanQueryLineup
        data={data}
        isFetching={isFetching}
        isPending={isPending}
        isError={isError}
        hasNextPage={hasNextPage}
        play={play}
        pause={pause}
        loadNextPage={loadNextPage}
        isPlaying={isPlaying}
        lineup={lineup}
        aria-label='weekly trending tracks'
        ordered
        pageSize={TRENDING_LOAD_MORE_PAGE_SIZE}
        initialPageSize={TRENDING_INITIAL_PAGE_SIZE}
        actions={trendingWeekActions}
        endOfLineupElement={
          <EndOfLineup description={messages.endOfLineupDescription} />
        }
        variant={LineupVariant.MAIN}
      />
    </div>,
    <div
      key={`monthly-trending-tracks-${trendingGenre}`}
      className={styles.lineupContainer}
    >
      <TanQueryLineup
        aria-label='monthly trending tracks'
        ordered
        pageSize={TRENDING_LOAD_MORE_PAGE_SIZE}
        initialPageSize={TRENDING_INITIAL_PAGE_SIZE}
        actions={trendingMonthActions}
        data={data}
        isFetching={isFetching}
        isPending={isPending}
        isError={isError}
        hasNextPage={hasNextPage}
        play={play}
        pause={pause}
        loadNextPage={loadNextPage}
        isPlaying={isPlaying}
        lineup={lineup}
        endOfLineupElement={
          <EndOfLineup description={messages.endOfLineupDescription} />
        }
        variant={LineupVariant.MAIN}
      />
    </div>,
    <div
      key={`all-time-trending-tracks-${trendingGenre}`}
      className={styles.lineupContainer}
    >
      <TanQueryLineup
        aria-label='all-time trending tracks'
        ordered
        pageSize={TRENDING_LOAD_MORE_PAGE_SIZE}
        initialPageSize={TRENDING_INITIAL_PAGE_SIZE}
        actions={trendingAllTimeActions}
        data={data}
        isFetching={isFetching}
        isPending={isPending}
        isError={isError}
        hasNextPage={hasNextPage}
        play={play}
        pause={pause}
        loadNextPage={loadNextPage}
        isPlaying={isPlaying}
        lineup={lineup}
        endOfLineupElement={
          <EndOfLineup description={messages.endOfLineupDescription} />
        }
        variant={LineupVariant.MAIN}
      />
    </div>
  ]
  const record = useRecord()

  const setGenre = useCallback(
    (genre: string | null) => {
      setTrendingGenre(genre)
      record(
        make(Name.TRENDING_CHANGE_VIEW, {
          timeframe: trendingTimeRange,
          genre: genre || ''
        })
      )
    },
    [setTrendingGenre, record, trendingTimeRange]
  )

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
        label: TimeRange.ALL_TIME,
        disabled: tabIsDisabled(TimeRange.ALL_TIME)
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
      icon={IconTrending}
      primary={trendingTitle}
      bottomBar={tabs}
      rightDecorator={
        <TrendingGenreFilters
          currentGenre={trendingGenre}
          didSelectGenre={setGenre}
          didSelectMore={() => setModalIsOpen(true)}
        />
      }
    />
  )

  return (
    <>
      <Page
        title={pageTitle}
        description={trendingDescription}
        size='large'
        header={header}
      >
        {body}
      </Page>
      <GenreSelectionModal
        genres={TRENDING_GENRES}
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
