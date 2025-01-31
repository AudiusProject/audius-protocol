import { useEffect, useCallback } from 'react'

import { TimeRange, UID } from '@audius/common/models'
import { useTrending } from '@audius/common/src/api'
import {
  accountSelectors,
  trendingPageLineupActions,
  trendingPageActions,
  trendingPageSelectors
} from '@audius/common/store'
import { GENRES, Genre, route } from '@audius/common/utils'
import { useDispatch, useSelector } from 'react-redux'

import { openSignOn } from 'common/store/pages/signon/actions'
import { useIsMobile } from 'hooks/useIsMobile'
import { push as pushRoute, replace as replaceRoute } from 'utils/navigation'

import TrendingPageContent from './components/desktop/TrendingPageContent'
import TrendingPageMobileContent from './components/mobile/TrendingPageContent'
import { TrendingPageContentProps } from './types'

const { getHasAccount } = accountSelectors
const { getTrendingTimeRange, getTrendingGenre, getLastFetchedTrendingGenre } =
  trendingPageSelectors
const { trendingWeekActions, trendingMonthActions, trendingAllTimeActions } =
  trendingPageLineupActions

const TRENDING_GENRES = route.TRENDING_GENRES

const messages = {
  trendingTitle: 'Trending',
  pageTitle: 'Trending',
  trendingDescription: 'The top trending tracks on Audius'
}

type TrendingPageProps = {
  containerRef: HTMLDivElement
}

const callLineupAction = (
  timeRange: TimeRange,
  action: string,
  ...args: any[]
) => {
  switch (timeRange) {
    case TimeRange.WEEK:
      return trendingWeekActions[action](...args)
    case TimeRange.MONTH:
      return trendingMonthActions[action](...args)
    case TimeRange.ALL_TIME:
      return trendingAllTimeActions[action](...args)
    default:
      return trendingAllTimeActions[action](...args)
  }
}

const TrendingPage = ({ containerRef }: TrendingPageProps) => {
  const dispatch = useDispatch()
  const isMobile = useIsMobile()

  // Selectors
  const hasAccount = useSelector(getHasAccount)
  const trendingTimeRange = useSelector(getTrendingTimeRange)
  const trendingGenre = useSelector(getTrendingGenre)
  const lastFetchedTrendingGenre = useSelector(getLastFetchedTrendingGenre)

  const trendingQueryData = useTrending({
    timeRange: trendingTimeRange,
    genre: trendingGenre || undefined
  })

  // Action Creators
  const goToSignUp = useCallback(() => {
    dispatch(openSignOn(false))
  }, [dispatch])

  const goToGenreSelection = useCallback(() => {
    dispatch(pushRoute(TRENDING_GENRES))
  }, [dispatch])

  const updateGenreUrlParam = useCallback(
    (genre: Genre | null) => {
      const urlParams = new URLSearchParams(window.location.search)
      if (genre) {
        urlParams.set('genre', genre)
      } else {
        urlParams.delete('genre')
      }
      dispatch(replaceRoute({ search: `?${urlParams.toString()}` }))
    },
    [dispatch]
  )

  const updateTimeRangeUrlParam = useCallback(
    (timeRange: TimeRange) => {
      const urlParams = new URLSearchParams(window.location.search)
      if (timeRange) {
        urlParams.set('timeRange', timeRange)
      } else {
        urlParams.delete('timeRange')
      }
      dispatch(replaceRoute({ search: `?${urlParams.toString()}` }))
    },
    [dispatch]
  )

  const scrollToTop = useCallback(() => {
    if (containerRef && containerRef instanceof HTMLElement) {
      containerRef.scrollTo(0, 0)
    }
  }, [containerRef])

  const makeResetTrending = useCallback(
    (timeRange: TimeRange) => {
      return () => {
        dispatch(callLineupAction(timeRange, 'reset'))
      }
    },
    [dispatch]
  )

  useEffect(() => {
    // Update the url search params on the trending page with the genre and timeRange
    const urlParams = new URLSearchParams(window.location.search)
    const genre = urlParams.get('genre') as Genre | null
    const timeRange = urlParams.get('timeRange') as TimeRange | null
    const isValidGenre = genre && Object.values(GENRES).includes(genre)

    if (trendingGenre) {
      updateGenreUrlParam(trendingGenre)
    } else if (isValidGenre) {
      dispatch(trendingPageActions.setTrendingGenre(genre))
    }
    const isValidTimeRange =
      timeRange && Object.values(TimeRange).includes(timeRange)
    if (isValidTimeRange) {
      dispatch(trendingPageActions.setTrendingTimeRange(timeRange))
    }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    return () => {
      if (!isMobile || !hasAccount) {
        dispatch(trendingWeekActions.reset())
        makeResetTrending(TimeRange.WEEK)()
        makeResetTrending(TimeRange.MONTH)()
        makeResetTrending(TimeRange.ALL_TIME)()
      }
    }
  }, [dispatch, isMobile, hasAccount, makeResetTrending])

  useEffect(() => {
    if (trendingTimeRange) {
      updateTimeRangeUrlParam(trendingTimeRange)
    }
  }, [trendingTimeRange, updateTimeRangeUrlParam])

  useEffect(() => {
    if (trendingGenre !== undefined) {
      updateGenreUrlParam(trendingGenre)
    }
  }, [trendingGenre, updateGenreUrlParam])

  const childProps: TrendingPageContentProps = {
    trendingTitle: messages.trendingTitle,
    pageTitle: messages.pageTitle,
    trendingDescription: messages.trendingDescription,
    playTrendingTrack: (uid: UID) => dispatch(trendingWeekActions.play(uid)),
    pauseTrendingTrack: () => dispatch(trendingWeekActions.pause()),
    refreshTrendingInView: (overwrite: boolean) =>
      dispatch(trendingWeekActions.refreshInView(overwrite)),
    hasAccount,
    goToSignUp,
    goToGenreSelection,
    resetTrendingLineup: () => dispatch(trendingWeekActions.reset()),
    trendingGenre: trendingGenre as string | null,
    trendingTimeRange,
    setTrendingTimeRange: (timeRange: TimeRange) =>
      dispatch(trendingPageActions.setTrendingTimeRange(timeRange)),
    setTrendingGenre: (genre: string | null) =>
      dispatch(trendingPageActions.setTrendingGenre(genre as Genre | null)),
    lastFetchedTrendingGenre: lastFetchedTrendingGenre as string | null,
    scrollToTop,
    fetchSuggestedFollowUsers: () => {},
    followUsers: () => {},
    suggestedFollows: [],
    goToTrending: () => {},
    setTrendingInView: () => {},
    switchView: () => {},
    trendingQueryData,
    scrollParentRef: containerRef
  }

  const TrendingContent = isMobile
    ? TrendingPageMobileContent
    : TrendingPageContent

  return <TrendingContent {...childProps} />
}

export default TrendingPage
