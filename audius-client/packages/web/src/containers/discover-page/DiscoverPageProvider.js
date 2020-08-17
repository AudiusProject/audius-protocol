import React, { PureComponent } from 'react'
import { connect } from 'react-redux'
import { withRouter, matchPath } from 'react-router-dom'
import {
  push as pushRoute,
  replace as replaceRoute
} from 'connected-react-router'
import { feedActions } from './store/lineups/feed/actions'
import { trendingActions } from './store/lineups/trending/actions'
import * as discoverPageAction from './store/actions'
import { getHasAccount } from 'store/account/selectors'
import { openSignOn } from 'containers/sign-on/store/actions'
import { FEED_PAGE, TRENDING_PAGE, TRENDING_GENRES } from 'utils/route'
import { makeGetLineupMetadatas } from 'store/lineup/selectors'
import { getPlaying, getBuffering } from 'store/player/selectors'
import { makeGetCurrent } from 'store/queue/selectors'
import TimeRange from 'models/TimeRange'
import { GENRES } from 'utils/genres'

import {
  getDiscoverFeedLineup,
  makeGetSuggestedFollows,
  getDiscoverTrendingLineup,
  getFeedFilter,
  getTrendingTimeRange,
  getTrendingGenre,
  getDiscoverTrendingWeekLineup,
  getDiscoverTrendingYearLineup,
  getDiscoverTrendingMonthLineup,
  getLastFetchedTrendingGenre
} from 'containers/discover-page/store/selectors'
import {
  trendingWeekActions,
  trendingMonthActions,
  trendingYearActions
} from 'containers/discover-page/store/lineups/trending/actions'
import { isMobile } from 'utils/clientUtil'
import { make } from 'store/analytics/actions'
import { Name } from 'services/analytics'

const messages = {
  feedTitle: 'Feed',
  feedDescription: 'Listen to what people you follow are sharing',
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
 *  DiscoverPageProvider encapsulates the buisness logic
 *  around a connected DiscoverPage, injecting props into
 *  children as `DiscoverPageContentProps`.
 */
class DiscoverPageProvider extends PureComponent {
  goToTrending = () => {
    this.props.history.push({
      pathname: TRENDING_PAGE
    })
  }

  goToFeed = () => {
    this.props.history.push({
      pathname: FEED_PAGE
    })
  }

  goToSignUp = () => {
    this.props.openSignOn(false)
  }

  goToGenreSelection = () => {
    this.props.goToRoute(TRENDING_GENRES)
  }

  switchView = () => {
    if (this.props.feedIsMain) {
      this.goToTrending()
    } else if (!this.props.hasAccount) {
      this.goToSignUp()
    } else {
      this.goToFeed()
    }
  }

  matchesRoute = route => {
    return matchPath(window.location.pathname, {
      path: route
    })
  }

  isOnDiscoverRoute = () => {
    return this.matchesRoute(TRENDING_PAGE) || this.matchesRoute(FEED_PAGE)
  }

  componentDidMount() {
    // Update the url search params on the trending page with the genre and timeRange
    if (this.matchesRoute(TRENDING_PAGE)) {
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
    // Only reset the lineup if we're not staying
    // on the discover page
    if (this.isOnDiscoverRoute()) return

    // Only reset to if we're not on mobile (mobile should
    // preserve the current tab + state) or there was no
    // account (because the lineups could contain stale content).
    if (!this.props.isMobile || !this.props.hasAccount) {
      this.props.resetFeedLineup()
      this.props.resetTrendingLineup()
      this.props.makeResetTrending(TimeRange.WEEK)()
      this.props.makeResetTrending(TimeRange.MONTH)()
      this.props.makeResetTrending(TimeRange.YEAR)()
      this.props.setTrendingGenre(null)
      this.props.setTrendingTimeRange(TimeRange.WEEK)
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
      feedTitle: messages.feedTitle,
      feedDescription: messages.feedDescription,
      feedIsMain: this.props.feedIsMain,
      feed: this.props.feed,

      trendingTitle: messages.trendingTitle,
      trendingDescription: messages.trendingDescription,
      trending: this.props.trending,
      trendingWeek: this.props.trendingWeek,
      trendingMonth: this.props.trendingMonth,
      trendingYear: this.props.trendingYear,

      fetchSuggestedFollowUsers: this.props.fetchSuggestedFollowUsers,
      followUsers: this.props.followUsers,
      suggestedFollows: this.props.suggestedFollows,
      playTrendingTrack: this.props.playTrendingTrack,
      pauseTrendingTrack: this.props.pauseTrendingTrack,
      refreshTrendingInView: this.props.refreshTrendingInView,
      refreshFeedInView: this.props.refreshFeedInView,
      hasAccount: this.props.hasAccount,
      goToTrending: this.goToTrending,
      goToSignUp: this.goToSignUp,
      goToFeed: this.goToFeed,
      goToGenreSelection: this.goToGenreSelection,
      setFeedInView: this.props.setFeedInView,
      loadMoreFeed: this.props.loadMoreFeed,
      playFeedTrack: this.props.playFeedTrack,
      pauseFeedTrack: this.props.pauseFeedTrack,
      switchView: this.switchView,
      getLineupProps: this.getLineupProps,
      setFeedFilter: this.props.setFeedFilter,
      feedFilter: this.props.feedFilter,
      resetFeedLineup: this.props.resetFeedLineup,
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
  const getSuggestedFollows = makeGetSuggestedFollows()
  const getFeedLineup = makeGetLineupMetadatas(getDiscoverFeedLineup)
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
    feed: getFeedLineup(state),
    trending: getTrendingLineup(state),
    trendingWeek: getTrendingWeekLineup(state),
    trendingMonth: getTrendingMonthLineup(state),
    trendingYear: getTrendingYearLineup(state),
    suggestedFollows: getSuggestedFollows(state),
    currentQueueItem: getCurrentQueueItem(state),
    playing: getPlaying(state),
    buffering: getBuffering(state),
    feedFilter: getFeedFilter(state),
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
  resetFeedLineup: () => dispatch(feedActions.reset()),
  fetchSuggestedFollowUsers: () =>
    dispatch(discoverPageAction.fetchSuggestedFollowUsers()),
  goToRoute: route => dispatch(pushRoute(route)),
  replaceRoute: route => dispatch(replaceRoute(route)),
  followUsers: userIds => dispatch(discoverPageAction.followUsers(userIds)),
  setFeedFilter: filter => dispatch(discoverPageAction.setFeedFilter(filter)),

  // Feed Lineup Actions
  setFeedInView: inView => dispatch(feedActions.setInView(inView)),
  loadMoreFeed: (offset, limit, overwrite) => {
    dispatch(feedActions.fetchLineupMetadatas(offset, limit, overwrite))
    const trackEvent = make(Name.FEED_PAGINATE, { offset, limit })
    dispatch(trackEvent)
  },
  refreshFeedInView: (overwrite, limit) =>
    dispatch(feedActions.refreshInView(overwrite, null, limit)),
  playFeedTrack: uid => dispatch(feedActions.play(uid)),
  pauseFeedTrack: () => dispatch(feedActions.pause()),

  // Trending Lineup Actions
  refreshTrendingInView: overwrite =>
    dispatch(trendingActions.refreshInView(overwrite)),
  playTrendingTrack: uid => dispatch(trendingActions.play(uid)),
  pauseTrendingTrack: () => dispatch(trendingActions.pause()),
  setTrendingGenre: genre =>
    dispatch(discoverPageAction.setTrendingGenre(genre)),
  setTrendingTimeRange: timeRange =>
    dispatch(discoverPageAction.setTrendingTimeRange(timeRange)),

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
  connect(makeMapStateToProps, mapDispatchToProps)(DiscoverPageProvider)
)
