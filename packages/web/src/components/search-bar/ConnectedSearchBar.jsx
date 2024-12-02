import { Component } from 'react'

import {
  imageBlank as placeholderArt,
  imageProfilePicEmpty as profilePicEmpty
} from '@audius/common/assets'
import { Kind, Name, SquareSizes } from '@audius/common/models'
import { getTierForUser, searchActions } from '@audius/common/store'
import { route } from '@audius/common/utils'
import { Box } from '@audius/harmony'
import { push as pushRoute } from 'connected-react-router'
import { connect } from 'react-redux'
import { matchPath } from 'react-router'
import { generatePath, withRouter } from 'react-router-dom'

import { HistoryContext } from 'app/HistoryProvider'
import { make } from 'common/store/analytics/actions'
import {
  fetchSearch,
  cancelFetchSearch,
  clearSearch
} from 'common/store/search-bar/actions'
import { getSearch } from 'common/store/search-bar/selectors'
import SearchBar from 'components/search/SearchBar'
import { getPathname } from 'utils/route'

const { profilePage, collectionPage, SEARCH_PAGE } = route
const { addItem: addRecentSearch } = searchActions

class ConnectedSearchBar extends Component {
  static contextType = HistoryContext
  state = {
    value: ''
  }

  componentDidMount() {
    const { history } = this.props

    // Clear search when navigating away from the search results page.
    history.listen((location, action) => {
      const params = new URLSearchParams(this.context.history.location.search)
      if (!params.has('query')) {
        this.onSearchChange('')
      }
    })

    // Set the initial search bar value if we loaded into a search page.
    const params = new URLSearchParams(this.context.history.location.search)
    if (params.has('query')) {
      this.onSearchChange(params.get('query'))
    }
  }

  isTagSearch = () => this.state.value[0] === '#'

  onSearchChange = (value, fetch) => {
    if (value.trim().length === 0) {
      // If the user erases the entire search content, clear the search store
      // so that on the next search a new dataSource triggers animation of the dropdown.
      this.props.clearSearch()
      this.setState({ value: '' })
      return
    }

    // decodeURIComponent can fail with searches that include
    // a % sign (malformed URI), so wrap this in a try catch
    let decodedValue = value
    try {
      decodedValue = decodeURIComponent(value)
    } catch {}

    if (!this.isTagSearch() && fetch) {
      this.props.fetchSearch(decodedValue)
    }
    this.setState({ value: decodedValue })
  }

  onSubmit = (value) => {
    const pathname = '/search'
    const locationSearchParams = new URLSearchParams(
      this.props.history.location.search
    )

    if (value) {
      locationSearchParams.set('query', value)
    } else {
      locationSearchParams.delete('query')
    }

    let newPath = pathname
    const searchMatch = matchPath(getPathname(this.props.history.location), {
      path: SEARCH_PAGE
    })

    if (searchMatch) {
      newPath = generatePath(SEARCH_PAGE, {
        ...searchMatch.params
      })
    }

    value = encodeURIComponent(value)
    this.props.history.push({
      pathname: newPath,
      search: locationSearchParams.toString(),
      state: {}
    })
  }

  onSelect = (value) => {
    const { id, kind } = (() => {
      const selectedUser = this.props.search.users.find(
        (u) => value === profilePage(u.handle)
      )
      if (selectedUser) return { kind: 'profile', id: selectedUser.user_id }
      const selectedTrack = this.props.search.tracks.find(
        (t) => value === (t.user ? t.permalink : '')
      )
      if (selectedTrack) return { kind: 'track', id: selectedTrack.track_id }
      const selectedPlaylist = this.props.search.playlists.find(
        (p) =>
          value ===
          (p.user
            ? collectionPage(
                p.user.handle,
                p.playlist_name,
                p.playlist_id,
                p.permalink,
                p.is_album
              )
            : '')
      )
      if (selectedPlaylist)
        return { kind: 'playlist', id: selectedPlaylist.playlist_id }
      const selectedAlbum = this.props.search.albums.find(
        (a) =>
          value ===
          (a.user
            ? collectionPage(
                a.user.handle,
                a.playlist_name,
                a.playlist_id,
                a.permalink,
                true
              )
            : '')
      )
      if (selectedAlbum) return { kind: 'album', id: selectedAlbum.playlist_id }
      return {}
    })()
    this.props.recordSearchResultClick({
      term: this.props.search.searchText,
      kind,
      id,
      source: 'autocomplete'
    })
  }

  onClear = () => {
    this.props.clearSearch()
    this.setState({ value: '' })

    const locationSearchParams = new URLSearchParams(
      this.props.history.location.search
    )

    locationSearchParams.delete('query')

    let newPath = '/search'

    const searchMatch = matchPath(getPathname(this.props.history.location), {
      path: SEARCH_PAGE
    })

    if (searchMatch) {
      newPath = generatePath(SEARCH_PAGE, {
        ...searchMatch.params
      })
    }

    this.props.history.push({
      pathname: newPath,
      search: locationSearchParams.toString(),
      state: {}
    })
  }

  render() {
    if (!this.props.search.tracks) {
      this.props.search.tracks = []
    }
    const dataSource = {
      sections: [
        {
          title: 'Profiles',
          children: this.props.search.users.map((user) => {
            return {
              key: profilePage(user.handle),
              primary: user.name || user.handle,
              userId: user.user_id,
              id: user.user_id,
              artwork: user.profile_picture,
              size: user.profile_picture_sizes
                ? SquareSizes.SIZE_150_BY_150
                : null,
              defaultImage: profilePicEmpty,
              isVerifiedUser: user.is_verified,
              tier: getTierForUser(user),
              kind: Kind.USERS
            }
          })
        },
        {
          title: 'Tracks',
          children: this.props.search.tracks.map((track) => {
            return {
              key: track.user ? track.permalink : '',
              primary: track.title,
              secondary: track.user ? track.user.name : '',
              id: track.track_id,
              userId: track.owner_id,
              artwork: track.artwork,
              size: track.cover_art_sizes ? SquareSizes.SIZE_150_BY_150 : null,
              defaultImage: placeholderArt,
              isVerifiedUser: track.user.is_verified,
              tier: getTierForUser(track.user),
              kind: Kind.TRACKS
            }
          })
        },
        {
          title: 'Playlists',
          children: this.props.search.playlists.map((playlist) => {
            return {
              primary: playlist.playlist_name,
              secondary: playlist.user ? playlist.user.name : '',
              key: playlist.user
                ? collectionPage(
                    playlist.user.handle,
                    playlist.playlist_name,
                    playlist.playlist_id,
                    playlist.permalink,
                    playlist.is_album
                  )
                : '',
              id: playlist.playlist_id,
              userId: playlist.playlist_owner_id,
              artwork: playlist.artwork,
              size: playlist.cover_art_sizes
                ? SquareSizes.SIZE_150_BY_150
                : null,
              defaultImage: placeholderArt,
              isVerifiedUser: playlist.user.is_verified,
              tier: getTierForUser(playlist.user),
              kind: Kind.COLLECTIONS
            }
          })
        },
        {
          title: 'Albums',
          children: this.props.search.albums.map((album) => {
            return {
              key: album.user
                ? collectionPage(
                    album.user.handle,
                    album.playlist_name,
                    album.playlist_id,
                    album.permalink,
                    true
                  )
                : '',
              primary: album.playlist_name,
              secondary: album.user ? album.user.name : '',
              id: album.playlist_id,
              userId: album.playlist_owner_id,
              artwork: album.artwork,
              size: album.cover_art_sizes ? SquareSizes.SIZE_150_BY_150 : null,
              defaultImage: placeholderArt,
              isVerifiedUser: album.user.is_verified,
              tier: getTierForUser(album.user),
              kind: Kind.COLLECTIONS
            }
          })
        }
      ]
    }
    const resultsCount = dataSource.sections.reduce(
      (count, section) => count + section.children.length,
      0
    )
    const { status, searchText } = this.props.search
    return (
      <Box ml='unit10' mt='l'>
        <SearchBar
          value={this.state.value}
          isTagSearch={this.isTagSearch()}
          isViewingSearchPage={this.props.isViewingSearchPage}
          status={status}
          searchText={searchText}
          dataSource={dataSource}
          resultsCount={resultsCount}
          onSelect={this.onSelect}
          onSearch={this.onSearchChange}
          onCancel={this.props.cancelFetchSearch}
          onSubmit={this.onSubmit}
          goToRoute={this.props.goToRoute}
          addRecentSearch={this.props.addRecentSearch}
          onClear={this.onClear}
        />
      </Box>
    )
  }
}

const mapStateToProps = (state, props) => ({
  search: getSearch(state, props),
  isViewingSearchPage: !!matchPath(state.router.location.pathname, {
    path: SEARCH_PAGE
  })
})
const mapDispatchToProps = (dispatch) => ({
  fetchSearch: (value) => dispatch(fetchSearch(value)),
  cancelFetchSearch: () => dispatch(cancelFetchSearch()),
  clearSearch: () => dispatch(clearSearch()),
  goToRoute: (route) => dispatch(pushRoute(route)),
  recordSearchResultClick: ({ term, kind, id, source }) =>
    dispatch(make(Name.SEARCH_RESULT_SELECT, { term, kind, id, source })),
  addRecentSearch: (searchItem) => dispatch(addRecentSearch(searchItem))
})

export default withRouter(
  connect(mapStateToProps, mapDispatchToProps)(ConnectedSearchBar)
)
