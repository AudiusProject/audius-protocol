import React, { PureComponent } from 'react'

import {
  push as pushRoute,
  replace as replaceRoute
} from 'connected-react-router'
import { connect } from 'react-redux'
import { withRouter, matchPath } from 'react-router-dom'

import { Name } from 'common/models/Analytics'
import TimeRange from 'common/models/TimeRange'
import { getHasAccount } from 'common/store/account/selectors'
import { openSignOn } from 'containers/sign-on/store/actions'
import {
  trendingWeekActions,
  trendingMonthActions,
  trendingYearActions,
  trendingActions
} from 'containers/trending-page/store/lineups/trending/actions'
import {
  getDiscoverTrendingLineup,
  getTrendingTimeRange,
  getTrendingGenre,
  getDiscoverTrendingWeekLineup,
  getDiscoverTrendingYearLineup,
  getDiscoverTrendingMonthLineup,
  getLastFetchedTrendingGenre
} from 'containers/trending-page/store/selectors'
import { make } from 'store/analytics/actions'
import { makeGetLineupMetadatas } from 'store/lineup/selectors'
import { getPlaying, getBuffering } from 'store/player/selectors'
import { makeGetCurrent } from 'store/queue/selectors'
import { isMobile } from 'utils/clientUtil'
import { GENRES } from 'utils/genres'
import { getPathname, TRENDING_GENRES } from 'utils/route'

import * as trendingPageActions from './store/actions'

const messages = {
  trendingTitle: 'Trending',
  trendingDescription: "Listen to what's trending on the Audius platform"
}

// Dynamically dispatch call to a lineup action based on a timeRange
const callLineupAction = (timeRange, action, ...args) => {
  const timeRangeMap = {
    [TimeRange.WEEK]: trendingWeekActions,
    [TimeRange.MONTH]: trendingMonthActions,
    [TimeRange.YEAR]: trendingYearActions
  }
  return timeRangeMap[timeRange][action](...args)
}

/**
 *  TrendingPageProvider encapsulates the buisness logic
 *  around a connected TrendingPage, injecting props into
 *  children as `TrendingPageContentProps`.
 */
class TrendingPageProvider extends PureComponent {
  goToSignUp = () => {
    this.props.openSignOn(false)
  }

  goToGenreSelection = () => {
    this.props.goToRoute(TRENDING_GENRES)
  }

  matchesRoute = route => {
    return matchPath(getPathname(), {
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
      this.props.makeResetTrending(TimeRange.YEAR)()
    }
  }

  getLineupProps = lineup => {
    const { currentQueueItem, playing, buffering } = this.props
    const { uid: playingUid, track, source } = currentQueueItem
    return {
      lineup,
      playingUid,
      playingSource: source,
      playingTrackId: track ? track.track_id : null,
      playing: playing,
      buffering: buffering,
      scrollParent: this.props.containerRef,
      selfLoad: true
    }
  }

  getLineupForRange = timeRange => {
    switch (timeRange) {
      case TimeRange.WEEK:
        return this.getLineupProps(this.props.trendingWeek)
      case TimeRange.MONTH:
        return this.getLineupProps(this.props.trendingMonth)
      case TimeRange.YEAR:
      default:
        return this.getLineupProps(this.props.trendingYear)
    }
  }

  scrollToTop = timeRange => {
    const lineup = this.getLineupForRange(timeRange)
    if (lineup.scrollParent && lineup.scrollParent.scrollTo) {
      lineup.scrollParent.scrollTo(0, 0)
    }
  }

  updateGenreUrlParam = genre => {
    const urlParams = new URLSearchParams(window.location.search)
    if (genre) {
      urlParams.set('genre', genre)
    } else {
      urlParams.delete('genre')
    }
    this.props.replaceRoute({ search: `?${urlParams.toString()}` })
  }

  updateTimeRangeUrlParam = timeRange => {
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
      trendingDescription: messages.trendingDescription,
      trending: this.props.trending,
      trendingWeek: this.props.trendingWeek,
      trendingMonth: this.props.trendingMonth,
      trendingYear: this.props.trendingYear,

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
  const getTrendingLineup = makeGetLineupMetadatas(getDiscoverTrendingLineup)
  const getTrendingWeekLineup = makeGetLineupMetadatas(
    getDiscoverTrendingWeekLineup
  )
  const getTrendingMonthLineup = makeGetLineupMetadatas(
    getDiscoverTrendingMonthLineup
  )
  const getTrendingYearLineup = makeGetLineupMetadatas(
    getDiscoverTrendingYearLineup
  )

  const mapStateToProps = state => ({
    hasAccount: getHasAccount(state),
    trending: getTrendingLineup(state),
    trendingWeek: getTrendingWeekLineup(state),
    trendingMonth: getTrendingMonthLineup(state),
    trendingYear: getTrendingYearLineup(state),
    currentQueueItem: getCurrentQueueItem(state),
    playing: getPlaying(state),
    buffering: getBuffering(state),
    trendingTimeRange: getTrendingTimeRange(state),
    trendingGenre: getTrendingGenre(state),
    lastFetchedTrendingGenre: getLastFetchedTrendingGenre(state),
    isMobile: isMobile()
  })
  return mapStateToProps
}

const mapDispatchToProps = dispatch => ({
  dispatch,
  openSignOn: signIn => dispatch(openSignOn(signIn)),
  resetTrendingLineup: () => dispatch(trendingActions.reset()),
  goToRoute: route => dispatch(pushRoute(route)),
  replaceRoute: route => dispatch(replaceRoute(route)),

  // Trending Lineup Actions
  refreshTrendingInView: overwrite =>
    dispatch(trendingActions.refreshInView(overwrite)),
  playTrendingTrack: uid => dispatch(trendingActions.play(uid)),
  pauseTrendingTrack: () => dispatch(trendingActions.pause()),
  setTrendingGenre: genre =>
    dispatch(trendingPageActions.setTrendingGenre(genre)),
  setTrendingTimeRange: timeRange =>
    dispatch(trendingPageActions.setTrendingTimeRange(timeRange)),

  // Dynamically dispatched trending actions
  makeRefreshTrendingInView: timeRange => {
    return overwrite => {
      dispatch(callLineupAction(timeRange, 'refreshInView', overwrite))
    }
  },
  makeLoadMore: timeRange => {
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
  makePlayTrack: timeRange => {
    return uid => {
      dispatch(callLineupAction(timeRange, 'play', uid))
    }
  },
  makePauseTrack: timeRange => {
    return () => {
      dispatch(callLineupAction(timeRange, 'pause'))
    }
  },
  makeSetInView: timeRange => {
    return inView => {
      dispatch(callLineupAction(timeRange, 'setInView', inView))
    }
  },
  makeResetTrending: timeRange => {
    return () => {
      dispatch(callLineupAction(timeRange, 'reset'))
    }
  }
})

export default withRouter(
  connect(makeMapStateToProps, mapDispatchToProps)(TrendingPageProvider)
)
