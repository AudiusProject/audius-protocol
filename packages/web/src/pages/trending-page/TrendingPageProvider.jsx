import { PureComponent } from 'react'

import {
  Name,
  TimeRange,
  GENRES,
  accountSelectors,
  lineupSelectors,
  trendingPageLineupActions,
  trendingPageSelectors,
  trendingPageActions,
  playerSelectors,
  queueSelectors
} from '@audius/common'
import {
  push as pushRoute,
  replace as replaceRoute
} from 'connected-react-router'
import { connect } from 'react-redux'
import { matchPath, withRouter } from 'react-router-dom'

import { HistoryContext } from 'app/HistoryProvider'
import { make } from 'common/store/analytics/actions'
import { openSignOn } from 'common/store/pages/signon/actions'
import { useIsMobile } from 'hooks/useIsMobile'
import { getPathname, TRENDING_GENRES } from 'utils/route'
import { createSeoDescription } from 'utils/seo'
const { makeGetCurrent } = queueSelectors

const { getBuffering, getPlaying } = playerSelectors
const {
  getDiscoverTrendingAllTimeLineup,
  getDiscoverTrendingMonthLineup,
  getDiscoverTrendingWeekLineup,
  getLastFetchedTrendingGenre,
  getTrendingGenre,
  getTrendingTimeRange
} = trendingPageSelectors
const {
  trendingActions,
  trendingAllTimeActions,
  trendingMonthActions,
  trendingWeekActions
} = trendingPageLineupActions
const { makeGetLineupMetadatas } = lineupSelectors
const getHasAccount = accountSelectors.getHasAccount

const messages = {
  trendingTitle: 'Trending',
  pageTitle: "Listen to what's trending on the Audius platform",
  trendingDescription: createSeoDescription(
    "Listen to what's trending on the Audius platform"
  )
}

// Dynamically dispatch call to a lineup action based on a timeRange
const callLineupAction = (timeRange, action, ...args) => {
  const timeRangeMap = {
    [TimeRange.WEEK]: trendingWeekActions,
    [TimeRange.MONTH]: trendingMonthActions,
    [TimeRange.ALL_TIME]: trendingAllTimeActions
  }
  return timeRangeMap[timeRange][action](...args)
}

/**
 *  TrendingPageProvider encapsulates the buisness logic
 *  around a connected TrendingPage, injecting props into
 *  children as `TrendingPageContentProps`.
 */
class TrendingPageProvider extends PureComponent {
  static contextType = HistoryContext
  goToSignUp = () => {
    this.props.openSignOn(false)
  }

  goToGenreSelection = () => {
    this.props.goToRoute(TRENDING_GENRES)
  }

  matchesRoute = (route) => {
    return matchPath(getPathname(this.context.history.location), {
      path: route
    })
  }

  componentDidMount() {
    // Update the url search params on the trending page with the genre and timeRange
    const urlParams = new URLSearchParams(window.location.search)
    const genre = urlParams.get('genre')
    const timeRange = urlParams.get('timeRange')
    const isValidGenre = genre && Object.values(GENRES).includes(genre)

    // NOTE: b/c genre can be changed from a modal state, we need to check props before using url params
    if (this.props.trendingGenre) {
      this.updateGenreUrlParam(this.props.trendingGenre)
    } else if (isValidGenre) {
      this.props.setTrendingGenre(genre)
    }
    const isValidTimeRange =
      timeRange && Object.values(TimeRange).includes(timeRange)
    if (isValidTimeRange) {
      this.props.setTrendingTimeRange(timeRange)
    }
  }

  componentDidUpdate(prevProps) {
    // Update the url search params on the trending page with the genre and timeRange when updated
    if (prevProps.trendingTimeRange !== this.props.trendingTimeRange) {
      this.updateTimeRangeUrlParam(this.props.trendingTimeRange)
    }
    if (prevProps.trendingGenre !== this.props.trendingGenre) {
      this.updateGenreUrlParam(this.props.trendingGenre)
    }
  }

  componentWillUnmount() {
    // Only reset to if we're not on mobile (mobile should
    // preserve the current tab + state) or there was no
    // account (because the lineups could contain stale content).
    if (!this.props.isMobile || !this.props.hasAccount) {
      this.props.resetTrendingLineup()
      this.props.makeResetTrending(TimeRange.WEEK)()
      this.props.makeResetTrending(TimeRange.MONTH)()
      this.props.makeResetTrending(TimeRange.ALL_TIME)()
    }
  }

  getLineupProps = (lineup) => {
    const { currentQueueItem, playing, buffering } = this.props
    const { uid: playingUid, track, source } = currentQueueItem
    return {
      lineup,
      playingUid,
      playingSource: source,
      playingTrackId: track ? track.track_id : null,
      playing,
      buffering,
      scrollParent: this.props.containerRef,
      selfLoad: true
    }
  }

  getLineupForRange = (timeRange) => {
    switch (timeRange) {
      case TimeRange.WEEK:
        return this.getLineupProps(this.props.trendingWeek)
      case TimeRange.MONTH:
        return this.getLineupProps(this.props.trendingMonth)
      case TimeRange.ALL_TIME:
        return this.getLineupProps(this.props.trendingAllTime)
      default:
        return this.getLineupProps(this.props.trendingAllTime)
    }
  }

  scrollToTop = (timeRange) => {
    const lineup = this.getLineupForRange(timeRange)
    if (lineup.scrollParent && lineup.scrollParent.scrollTo) {
      lineup.scrollParent.scrollTo(0, 0)
    }
  }

  updateGenreUrlParam = (genre) => {
    const urlParams = new URLSearchParams(window.location.search)
    if (genre) {
      urlParams.set('genre', genre)
    } else {
      urlParams.delete('genre')
    }
    this.props.replaceRoute({ search: `?${urlParams.toString()}` })
  }

  updateTimeRangeUrlParam = (timeRange) => {
    const urlParams = new URLSearchParams(window.location.search)
    if (timeRange) {
      urlParams.set('timeRange', timeRange)
    } else {
      urlParams.delete('timeRange')
    }
    this.props.replaceRoute({ search: `?${urlParams.toString()}` })
  }

  render() {
    const childProps = {
      trendingTitle: messages.trendingTitle,
      pageTitle: messages.pageTitle,
      trendingDescription: messages.trendingDescription,
      trending: this.props.trending,
      trendingWeek: this.props.trendingWeek,
      trendingMonth: this.props.trendingMonth,
      trendingAllTime: this.props.trendingAllTime,
      playTrendingTrack: this.props.playTrendingTrack,
      pauseTrendingTrack: this.props.pauseTrendingTrack,
      refreshTrendingInView: this.props.refreshTrendingInView,
      hasAccount: this.props.hasAccount,
      goToTrending: this.goToTrending,
      goToSignUp: this.goToSignUp,
      goToGenreSelection: this.goToGenreSelection,
      switchView: this.switchView,
      getLineupProps: this.getLineupProps,
      resetTrendingLineup: this.props.resetTrendingLineup,
      trendingGenre: this.props.trendingGenre,
      trendingTimeRange: this.props.trendingTimeRange,
      setTrendingTimeRange: this.props.setTrendingTimeRange,
      setTrendingGenre: this.props.setTrendingGenre,
      lastFetchedTrendingGenre: this.props.lastFetchedTrendingGenre,

      makeLoadMore: this.props.makeLoadMore,
      makePlayTrack: this.props.makePlayTrack,
      makePauseTrack: this.props.makePauseTrack,
      makeSetInView: this.props.makeSetInView,
      makeRefreshTrendingInView: this.props.makeRefreshTrendingInView,
      makeResetTrending: this.props.makeResetTrending,
      getLineupForRange: this.getLineupForRange,
      scrollToTop: this.scrollToTop
    }
    return <this.props.children {...childProps} />
  }
}

const makeMapStateToProps = () => {
  const getCurrentQueueItem = makeGetCurrent()
  const getTrendingWeekLineup = makeGetLineupMetadatas(
    getDiscoverTrendingWeekLineup
  )
  const getTrendingMonthLineup = makeGetLineupMetadatas(
    getDiscoverTrendingMonthLineup
  )
  const getTrendingAllTimeLineup = makeGetLineupMetadatas(
    getDiscoverTrendingAllTimeLineup
  )

  const mapStateToProps = (state) => ({
    hasAccount: getHasAccount(state),
    trendingWeek: getTrendingWeekLineup(state),
    trendingMonth: getTrendingMonthLineup(state),
    trendingAllTime: getTrendingAllTimeLineup(state),
    currentQueueItem: getCurrentQueueItem(state),
    playing: getPlaying(state),
    buffering: getBuffering(state),
    trendingTimeRange: getTrendingTimeRange(state),
    trendingGenre: getTrendingGenre(state),
    lastFetchedTrendingGenre: getLastFetchedTrendingGenre(state)
  })
  return mapStateToProps
}

const mapDispatchToProps = (dispatch) => ({
  dispatch,
  openSignOn: (signIn) => dispatch(openSignOn(signIn)),
  resetTrendingLineup: () => dispatch(trendingActions.reset()),
  goToRoute: (route) => dispatch(pushRoute(route)),
  replaceRoute: (route) => dispatch(replaceRoute(route)),

  // Trending Lineup Actions
  refreshTrendingInView: (overwrite) =>
    dispatch(trendingActions.refreshInView(overwrite)),
  playTrendingTrack: (uid) => dispatch(trendingActions.play(uid)),
  pauseTrendingTrack: () => dispatch(trendingActions.pause()),
  setTrendingGenre: (genre) =>
    dispatch(trendingPageActions.setTrendingGenre(genre)),
  setTrendingTimeRange: (timeRange) =>
    dispatch(trendingPageActions.setTrendingTimeRange(timeRange)),

  // Dynamically dispatched trending actions
  makeRefreshTrendingInView: (timeRange) => {
    return (overwrite) => {
      dispatch(callLineupAction(timeRange, 'refreshInView', overwrite))
    }
  },
  makeLoadMore: (timeRange) => {
    return (offset, limit, overwrite) => {
      dispatch(
        callLineupAction(
          timeRange,
          'fetchLineupMetadatas',
          offset,
          limit,
          overwrite
        )
      )
      const trackEvent = make(Name.TRENDING_PAGINATE, { offset, limit })
      dispatch(trackEvent)
    }
  },
  makePlayTrack: (timeRange) => {
    return (uid) => {
      dispatch(callLineupAction(timeRange, 'play', uid))
    }
  },
  makePauseTrack: (timeRange) => {
    return () => {
      dispatch(callLineupAction(timeRange, 'pause'))
    }
  },
  makeSetInView: (timeRange) => {
    return (inView) => {
      dispatch(callLineupAction(timeRange, 'setInView', inView))
    }
  },
  makeResetTrending: (timeRange) => {
    return () => {
      dispatch(callLineupAction(timeRange, 'reset'))
    }
  }
})

const InnerTrendingPageProvider = withRouter(
  connect(makeMapStateToProps, mapDispatchToProps)(TrendingPageProvider)
)

export default () => {
  const isMobile = useIsMobile()
  return <InnerTrendingPageProvider isMobile={isMobile} />
}
