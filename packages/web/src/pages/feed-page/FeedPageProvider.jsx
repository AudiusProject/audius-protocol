import { PureComponent } from 'react'

import { Name } from '@audius/common/models'
import {
  accountSelectors,
  lineupSelectors,
  feedPageLineupActions as feedActions,
  feedPageSelectors,
  feedPageActions as discoverPageAction,
  queueSelectors,
  playerSelectors
} from '@audius/common/store'
import { route } from '@audius/common/utils'
import { connect } from 'react-redux'
import { withRouter, matchPath } from 'react-router-dom'

import { HistoryContext } from 'app/HistoryProvider'
import { make } from 'common/store/analytics/actions'
import { openSignOn } from 'common/store/pages/signon/actions'
import { useIsMobile } from 'hooks/useIsMobile'
import { push, replace } from 'utils/navigation'
import { getPathname } from 'utils/route'
const { TRENDING_PAGE } = route
const { makeGetCurrent } = queueSelectors
const { getPlaying, getBuffering } = playerSelectors
const { getDiscoverFeedLineup, getFeedFilter } = feedPageSelectors
const { makeGetLineupMetadatas } = lineupSelectors
const getHasAccount = accountSelectors.getHasAccount

const messages = {
  feedTitle: 'Feed',
  feedDescription: 'Listen to what people you follow are sharing'
}

/**
 *  FeedPageProvider encapsulates the buisness logic
 *  around a connected FeedPage, injecting props into
 *  children as `FeedPageContentProps`.
 */
class FeedPageProvider extends PureComponent {
  static contextType = HistoryContext

  goToTrending = () => {
    this.props.history.push({
      pathname: TRENDING_PAGE
    })
  }

  goToSignUp = () => {
    this.props.openSignOn(false)
  }

  matchesRoute = (route) => {
    return matchPath(getPathname(this.context.history.location), {
      path: route
    })
  }

  componentWillUnmount() {
    // Only reset to if we're not on mobile (mobile should
    // preserve the current tab + state) or there was no
    // account (because the lineups could contain stale content).
    if (!this.props.isMobile || !this.props.hasAccount) {
      this.props.resetFeedLineup()
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

  render() {
    const childProps = {
      feedTitle: messages.feedTitle,
      feedDescription: messages.feedDescription,
      feedIsMain: this.props.feedIsMain,
      feed: this.props.feed,

      refreshFeedInView: this.props.refreshFeedInView,
      hasAccount: this.props.hasAccount,
      goToSignUp: this.goToSignUp,
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

      makeLoadMore: this.props.makeLoadMore,
      makePlayTrack: this.props.makePlayTrack,
      makePauseTrack: this.props.makePauseTrack,
      makeSetInView: this.props.makeSetInView
    }

    return <this.props.children {...childProps} />
  }
}

const makeMapStateToProps = () => {
  const getCurrentQueueItem = makeGetCurrent()
  const getFeedLineup = makeGetLineupMetadatas(getDiscoverFeedLineup)

  const mapStateToProps = (state) => ({
    hasAccount: getHasAccount(state),
    feed: getFeedLineup(state),
    currentQueueItem: getCurrentQueueItem(state),
    playing: getPlaying(state),
    buffering: getBuffering(state),
    feedFilter: getFeedFilter(state)
  })
  return mapStateToProps
}

const mapDispatchToProps = (dispatch) => ({
  dispatch,
  openSignOn: (signIn) => dispatch(openSignOn(signIn)),
  resetFeedLineup: () => dispatch(feedActions.reset()),
  goToRoute: (route) => dispatch(push(route)),
  replaceRoute: (route) => dispatch(replace(route)),
  setFeedFilter: (filter) => dispatch(discoverPageAction.setFeedFilter(filter)),

  // Feed Lineup Actions
  setFeedInView: (inView) => dispatch(feedActions.setInView(inView)),
  loadMoreFeed: (offset, limit, overwrite) => {
    dispatch(feedActions.fetchLineupMetadatas(offset, limit, overwrite))
    const trackEvent = make(Name.FEED_PAGINATE, { offset, limit })
    dispatch(trackEvent)
  },
  refreshFeedInView: (overwrite, limit) =>
    dispatch(feedActions.refreshInView(overwrite, null, limit)),
  playFeedTrack: (uid) => dispatch(feedActions.play(uid)),
  pauseFeedTrack: () => dispatch(feedActions.pause())
})

const FeedPageProviderWrapper = (props) => {
  const isMobile = useIsMobile()
  return <FeedPageProvider isMobile={isMobile} {...props} />
}

export default withRouter(
  connect(makeMapStateToProps, mapDispatchToProps)(FeedPageProviderWrapper)
)
