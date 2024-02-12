import { Component } from 'react'

import { Name } from '@audius/common/models'
import {
  accountSelectors,
  lineupSelectors,
  searchResultsPageTracksLineupActions as tracksActions,
  searchResultsPageActions as searchPageActions,
  searchResultsPageSelectors,
  SearchKind,
  queueSelectors,
  playerSelectors
} from '@audius/common/store'
import { push as pushRoute } from 'connected-react-router'
import { connect } from 'react-redux'
import { Redirect } from 'react-router'
import { withRouter } from 'react-router-dom'

import { HistoryContext } from 'app/HistoryProvider'
import { make } from 'common/store/analytics/actions'
import {
  NOT_FOUND_PAGE,
  SEARCH_CATEGORY_PAGE,
  SEARCH_PAGE,
  doesMatchRoute
} from 'utils/route'

import * as helpers from './helpers'
const { makeGetCurrent } = queueSelectors
const { getPlaying, getBuffering } = playerSelectors
const {
  makeGetSearchArtists,
  makeGetSearchPlaylists,
  makeGetSearchAlbums,
  getSearchTracksLineup,
  getBaseState: getSearchResultsState
} = searchResultsPageSelectors
const { makeGetLineupMetadatas } = lineupSelectors
const getUserId = accountSelectors.getUserId

class SearchPageProvider extends Component {
  static contextType = HistoryContext

  constructor(props, context) {
    super(props)
    const searchResultsCategory = helpers.getCategory(context.history.location)

    this.state = {
      searchResultsCategory
    }
  }

  componentDidMount() {
    // Listen for history changes when the component is mounted and maybe
    // reset/reload tracks.
    this.unlisten = this.props.history.listen((location, action) => {
      // Make sure the serach bar shows on every search-navigation
      if (window.scrollTo) window.scrollTo(0, 0)
      const isTagSearch = helpers.isTagSearch(this.context.history.location)
      const searchMatch = helpers.getSearchText(this.context.history.location)

      const category = helpers.getCategory(this.context.history.location)
      this.setState({ searchResultsCategory: category })

      if (!!searchMatch || isTagSearch) {
        const query = isTagSearch
          ? helpers.getSearchTag(this.context.history.location)
          : searchMatch
        this.props.dispatch(tracksActions.reset())
        if (category !== SearchKind.TRACKS) {
          const limit = helpers.getResultsLimit(this.props.isMobile, category)
          query && this.search(isTagSearch, query, category, limit)
        }
      }
      // TODO: Is this call necessary?
      this.props.scrollToTop()
    })

    const isTagSearch = helpers.isTagSearch(this.context.history.location)
    const query = isTagSearch
      ? helpers.getSearchTag(this.context.history.location)
      : helpers.getSearchText(this.context.history.location)
    const category = helpers.getCategory(this.context.history.location)
    if (category !== SearchKind.TRACKS) {
      const limit = helpers.getResultsLimit(this.props.isMobile, category)
      query && this.search(isTagSearch, query, category, limit)
    }
  }

  componentWillUnmount() {
    this.props.dispatch(tracksActions.reset())
    this.unlisten()
  }

  search = (isTagSearch, query, searchKind, limit, offset) => {
    if (isTagSearch) {
      this.props.dispatch(
        searchPageActions.fetchSearchPageTags(query, searchKind, limit, offset)
      )
      this.props.recordTagSearch(query)
    } else {
      this.props.dispatch(
        searchPageActions.fetchSearchPageResults(
          query,
          searchKind,
          limit,
          offset
        )
      )
      this.props.recordSearch(query)
    }
  }

  handleViewMoreResults = (category) => {
    return () => {
      const { history } = this.props
      const query = helpers.getQuery(this.context.history.location)
      history.push(`/search/${query}/${category}`)
      this.setState({
        searchResultsCategory: helpers.getCategory(
          this.context.history.location
        )
      })
      this.props.recordMoreResults(query, category)
    }
  }

  render() {
    // We can't rely on React Router to ensure this page has a
    // query param, because we need to accept params like #rap, which
    // React Router doesn't parse as a valid param. So we redirect to a 404
    // here if a user tries to access `/search/` without a query.
    // Note that if the user navigates and the page route does not match the
    // search page, then we should not redirect & allow react router to render
    // the correct page.
    const query = helpers.getQuery(this.context.history.location)
    if (
      !query &&
      (doesMatchRoute(this.context.history.location, SEARCH_CATEGORY_PAGE) ||
        doesMatchRoute(this.context.history.location, SEARCH_PAGE))
    ) {
      return <Redirect to={NOT_FOUND_PAGE} />
    }

    const ContentClass = this.props.children
    const injectedProps = {
      ...this.props,
      searchText: helpers.getQuery(this.context.history.location),
      handleViewMoreResults: this.handleViewMoreResults,
      searchResultsCategory: this.state.searchResultsCategory,
      isTagSearch: helpers.isTagSearch(this.context.history.location)
    }
    return <ContentClass {...injectedProps} />
  }
}

const makeMapStateToProps = (initialState, ownProps) => {
  const getPlaylists = makeGetSearchPlaylists()
  const getAlbums = makeGetSearchAlbums()
  const getSearchArtists = makeGetSearchArtists()
  const getCurrentQueueItem = makeGetCurrent()
  const getTracksLineup = makeGetLineupMetadatas(getSearchTracksLineup)
  const mapStateToProps = (state, props) => ({
    search: getSearchResultsState(state),
    tracks: getTracksLineup(state),
    artists: getSearchArtists(state),
    playlists: getPlaylists(state),
    albums: getAlbums(state),
    currentQueueItem: getCurrentQueueItem(state),
    playing: getPlaying(state),
    buffering: getBuffering(state),
    userId: getUserId(state)
  })
  return mapStateToProps
}

const mapDispatchToProps = (dispatch) => ({
  dispatch,
  goToRoute: (route) => dispatch(pushRoute(route)),
  recordTagSearch: (query) => {
    dispatch(make(Name.SEARCH_TAG_SEARCH, { tag: query }))
  },
  recordSearch: (query) => {
    dispatch(make(Name.SEARCH_SEARCH, { term: query }))
  },
  recordMoreResults: (term, source) => {
    dispatch(make(Name.SEARCH_MORE_RESULTS, { term, source }))
  },
  recordSearchResultClick: ({ term, kind, id, source }) => {
    dispatch(make(Name.SEARCH_RESULT_SELECT, { term, kind, id, source }))
  }
})

export default withRouter(
  connect(makeMapStateToProps, mapDispatchToProps)(SearchPageProvider)
)
