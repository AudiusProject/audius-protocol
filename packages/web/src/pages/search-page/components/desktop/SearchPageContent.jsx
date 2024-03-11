import { Component } from 'react'

import { Status } from '@audius/common/models'
import {
  searchResultsPageTracksLineupActions as tracksActions,
  SearchKind
} from '@audius/common/store'
import { formatCount } from '@audius/common/utils'
import { IconSearch as IconBigSearch } from '@audius/harmony'
import { Redirect } from 'react-router'

import Card from 'components/card/desktop/Card'
import CategoryHeader from 'components/header/desktop/CategoryHeader'
import Header from 'components/header/desktop/Header'
import CardLineup from 'components/lineup/CardLineup'
import Lineup from 'components/lineup/Lineup'
import LoadingSpinner from 'components/loading-spinner/LoadingSpinner'
import Page from 'components/page/Page'
import Toast from 'components/toast/Toast'
import {
  collectionPage,
  fullCollectionPage,
  profilePage,
  fullSearchResultsPage,
  NOT_FOUND_PAGE
} from 'utils/route'

import styles from './SearchPageContent.module.css'

const SEARCH_HEADER_MAX_WIDTH_PX = 720

const SearchHeader = (props) => {
  const secondary = (
    <span className={styles.searchText}>&#8220;{props.searchText}&#8221;</span>
  )
  return (
    <Header
      {...props}
      primary={props.title}
      secondary={secondary}
      overrideWidth={SEARCH_HEADER_MAX_WIDTH_PX}
      variant='main'
      containerStyles={styles.searchResultsHeader}
    />
  )
}

class SearchPageContent extends Component {
  constructor(props) {
    super(props)
    this.state = {
      cardToast: {}
    }
  }

  componentWillUnmount() {
    Object.keys(this.state.cardToast).forEach((toastId) =>
      this.clearCardToast(toastId)
    )
  }

  onShare = (category, id) => () => {
    const toastId = `${category}-${id}`
    this.setState({
      cardToast: {
        ...this.state.cardToast,
        [toastId]: {
          open: true,
          message: 'Copied to Clipboard!',
          timeout: setTimeout(this.clearCardToast(toastId), 2000)
        }
      }
    })
  }

  onRepost = (category, id, metadata) => () => {
    const toastId = `${category}-${id}`
    if (this.state.cardToast[toastId]) {
      clearTimeout(this.state.cardToast[toastId].timeout)
    }
    this.setState({
      cardToast: {
        ...this.state.cardToast,
        [toastId]: {
          open: true,
          message: 'Reposted!',
          timeout: setTimeout(this.clearCardToast(toastId), 2000)
        }
      }
    })
  }

  clearCardToast = (toastId) => () => {
    const cardToast = this.state.cardToast[toastId]
    clearTimeout(cardToast.timeout)
    this.setState({
      cardToast: {
        ...this.state.cardToast,
        [toastId]: {
          ...cardToast,
          open: false
        }
      }
    })
  }

  render() {
    const {
      userId,
      tracks,
      currentQueueItem,
      playing,
      buffering,
      artists,
      playlists,
      albums,
      goToRoute,
      handleViewMoreResults,
      searchResultsCategory,
      isTagSearch,
      searchText,
      search: { status },
      recordSearchResultClick
    } = this.props
    console.log('asdf albums: ', albums)
    const { cardToast } = this.state
    const searchTitle = isTagSearch ? `Tag Search` : `Search`
    const artistCards = artists.map((artist, ind) => {
      const toastId = `user-${artist.user_id}`
      const onClick = () => {
        goToRoute(profilePage(artist.handle))
        recordSearchResultClick({
          term: searchText,
          kind: 'profile',
          id: artist.user_id,
          source:
            searchResultsCategory === 'all'
              ? 'search results page'
              : 'more results page'
        })
      }
      return (
        <Toast
          key={artist.user_id}
          text={cardToast[toastId] && cardToast[toastId].message}
          open={cardToast[toastId] && cardToast[toastId].open}
          placement='bottom'
          fillParent={false}
          firesOnClick={false}
        >
          <Card
            id={artist.user_id}
            userId={artist.user_id}
            imageSize={artist._profile_picture_sizes}
            isUser
            size={'small'}
            primaryText={artist.name}
            secondaryText={`${formatCount(artist.follower_count)} Followers`}
            onClick={onClick}
            menu={{
              type: 'user',
              handle: artist.handle,
              userId: artist.user_id,
              currentUserFollows: artist.does_current_user_follow,
              onShare: this.onShare('user', artist.user_id)
            }}
          />
        </Toast>
      )
    })

    const playlistCards = playlists.map((playlist, ind) => {
      const toastId = `playlist-${playlist.playlist_id}`
      const onClick = () => {
        goToRoute(
          collectionPage(
            playlist.user.handle,
            playlist.playlist_name,
            playlist.playlist_id,
            playlist.permalink,
            playlist.is_album
          )
        )
        recordSearchResultClick({
          term: searchText,
          kind: 'playlist',
          id: playlist.playlist_id,
          source:
            searchResultsCategory === 'all'
              ? 'search results page'
              : 'more results page'
        })
      }
      return (
        // TODO: Refactor cards and the way draggable wraps them.
        <Toast
          key={playlist.playlist_id}
          text={cardToast[toastId] && cardToast[toastId].message}
          open={cardToast[toastId] && cardToast[toastId].open}
          placement='bottom'
          fillParent={false}
          playlistId={playlist.playlist_id}
          isAlbum={playlist.is_album}
          link={fullCollectionPage(
            playlist.user.handle,
            playlist.playlist_name,
            playlist.playlist_id,
            playlist.permalink,
            playlist.is_album
          )}
          primaryText={playlist.playlist_name}
          firesOnClick={false}
        >
          <Card
            size={'small'}
            id={playlist.playlist_id}
            imageSize={playlist._cover_art_sizes}
            primaryText={playlist.playlist_name}
            secondaryText={`${playlist.user.name} • ${
              playlist.trackCount
            } Track${playlist.trackCount > 1 ? 's' : ''}`}
            onClick={onClick}
            menu={{
              type: 'playlist',
              handle: playlist.user.handle,
              name: playlist.playlist_name,
              isOwner: playlist.user.user_id === userId,
              playlistId: playlist.playlist_id,
              currentUserSaved: playlist.has_current_user_saved,
              currentUserReposted: playlist.has_current_user_reposted,
              metadata: playlist,
              includeShare: true,
              includeRepost: true,
              isPublic: !playlist.is_private,
              onShare: this.onShare('playlist', playlist.playlist_id),
              onRepost: this.onRepost('playlist', playlist.playlist_id)
            }}
          />
        </Toast>
      )
    })

    const albumCards = albums.map((album, ind) => {
      const toastId = `album-${album.playlist_id}`
      const onClick = () => {
        goToRoute(
          collectionPage(
            album.user.handle,
            album.playlist_name,
            album.playlist_id,
            album.permalink,
            true
          )
        )
        recordSearchResultClick({
          term: searchText,
          kind: 'album',
          id: album.playlist_id,
          source:
            searchResultsCategory === 'all'
              ? 'search results page'
              : 'more results page'
        })
      }
      return (
        // TODO: Refactor cards and the way draggable wraps them.
        <Toast
          key={album.playlist_id}
          text={cardToast[toastId] && cardToast[toastId].message}
          open={cardToast[toastId] && cardToast[toastId].open}
          placement='bottom'
          fillParent={false}
          playlistId={album.playlist_id}
          isAlbum={album.is_album}
          link={fullCollectionPage(
            album.user.handle,
            album.playlist_name,
            album.playlist_id,
            album.permalink,
            album.is_album
          )}
          primaryText={album.playlist_name}
          firesOnClick={false}
        >
          <Card
            size={'small'}
            id={album.playlist_id}
            userId={userId}
            imageSize={album._cover_art_sizes}
            primaryText={album.playlist_name}
            secondaryText={album.user.name}
            onClick={onClick}
            menu={{
              type: 'album',
              handle: album.user.handle,
              name: album.playlist_name,
              playlistId: album.playlist_id,
              isOwner: album.user.user_id === userId,
              metadata: album,
              isPublic: !album.is_private,
              currentUserSaved: album.has_current_user_saved,
              currentUserReposted: album.has_current_user_reposted,
              includeShare: true,
              includeRepost: true,
              onShare: this.onShare('album', album.playlist_id),
              onRepost: this.onRepost('album', album.playlist_id)
            }}
          />
        </Toast>
      )
    })

    const foundResults =
      artistCards.length > 0 ||
      tracks.entries.length > 0 ||
      playlistCards.length > 0 ||
      albumCards.length > 0
    let content
    let header
    if (searchResultsCategory === 'users') {
      content = (
        <CardLineup
          categoryName={'Profiles'}
          cards={artistCards}
          containerClassName={styles.artistSearchResultsContainer}
          cardsClassName={styles.cardsContainer}
        />
      )
      header = <SearchHeader searchText={searchText} title={searchTitle} />
    } else if (searchResultsCategory === 'tracks') {
      content = (
        <>
          <div className={styles.trackSearchResultsContainer}>
            <CategoryHeader categoryName='Tracks' />
            <Lineup
              search
              key='searchTracks'
              selfLoad
              variant='section'
              lineup={tracks}
              playingSource={currentQueueItem.source}
              playingUid={currentQueueItem.uid}
              playingTrackId={
                currentQueueItem.track && currentQueueItem.track.track_id
              }
              playing={playing}
              buffering={buffering}
              scrollParent={this.props.containerRef}
              loadMore={(offset, limit) => {
                this.props.dispatch(
                  tracksActions.fetchLineupMetadatas(offset, limit, false, {
                    category: searchResultsCategory,
                    query: searchText,
                    isTagSearch
                  })
                )
              }}
              playTrack={(uid) => this.props.dispatch(tracksActions.play(uid))}
              pauseTrack={() => this.props.dispatch(tracksActions.pause())}
              actions={tracksActions}
            />
          </div>
        </>
      )
      header = <SearchHeader searchText={searchText} title={searchTitle} />
    } else if (searchResultsCategory === 'playlists') {
      content = isTagSearch ? (
        <Redirect to={NOT_FOUND_PAGE} />
      ) : (
        <>
          <CardLineup
            categoryName={'Playlists'}
            cards={playlistCards}
            containerClassName={styles.playlistSearchResultsContainer}
            cardsClassName={styles.cardsContainer}
          />
        </>
      )
      header = <SearchHeader searchText={searchText} title={searchTitle} />
    } else if (searchResultsCategory === 'albums') {
      content = isTagSearch ? (
        <Redirect to={NOT_FOUND_PAGE} />
      ) : (
        <>
          <CardLineup
            categoryName={'Albums'}
            cards={albumCards}
            containerClassName={styles.albumSearchResultsContainer}
            cardsClassName={styles.cardsContainer}
          />
        </>
      )
      header = <SearchHeader searchText={searchText} title={searchTitle} />
    } else if (foundResults) {
      header = <SearchHeader searchText={searchText} title={searchTitle} />
      content = (
        <>
          {artistCards.length > 0 ? (
            <CardLineup
              categoryName={'Profiles'}
              onMore={
                artistCards.length >= 4
                  ? handleViewMoreResults('profiles')
                  : null
              }
              cards={artistCards.slice(0, Math.min(4, artistCards.length))}
              containerClassName={styles.artistSearchResultsContainer}
              cardsClassName={styles.cardsContainer}
            />
          ) : null}
          {tracks.entries.length > 0 ? (
            <div className={styles.trackSearchResultsContainer}>
              <CategoryHeader
                categoryName='Tracks'
                onMore={handleViewMoreResults('tracks')}
              />
              <Lineup
                search
                variant='section'
                count={4}
                selfLoad={false}
                lineup={tracks}
                playingSource={currentQueueItem.source}
                playingUid={currentQueueItem.uid}
                playingTrackId={
                  currentQueueItem.track && currentQueueItem.track.track_id
                }
                playing={playing}
                buffering={buffering}
                scrollParent={this.props.containerRef}
                onMore={
                  tracks.entries.length >= 4
                    ? handleViewMoreResults('tracks')
                    : null
                }
                loadMore={(offset, limit) =>
                  this.props.dispatch(
                    tracksActions.fetchLineupMetadatas(offset, limit, false, {
                      category: SearchKind.ALL,
                      query: searchText,
                      isTagSearch
                    })
                  )
                }
                playTrack={(uid) =>
                  this.props.dispatch(tracksActions.play(uid))
                }
                pauseTrack={(uid) => this.props.dispatch(tracksActions.pause())}
                actions={tracksActions}
              />
            </div>
          ) : null}
          {!isTagSearch && playlistCards.length > 0 ? (
            <CardLineup
              categoryName={'Playlists'}
              onMore={
                playlistCards.length >= 4
                  ? handleViewMoreResults('playlists')
                  : null
              }
              cards={playlistCards.slice(0, Math.min(4, playlistCards.length))}
              containerClassName={styles.playlistSearchResultsContainer}
              cardsClassName={styles.cardsContainer}
            />
          ) : null}
          {!isTagSearch && albumCards.length > 0 ? (
            <CardLineup
              categoryName={'Albums'}
              onMore={
                albumCards.length >= 4 ? handleViewMoreResults('albums') : null
              }
              cards={albumCards.slice(0, Math.min(4, albumCards.length))}
              containerClassName={styles.albumSearchResultsContainer}
              cardsClassName={styles.cardsContainer}
            />
          ) : null}
        </>
      )
    } else {
      const errorText = isTagSearch
        ? "Sorry, we couldn't find any tags that match"
        : "Sorry, we couldn't find anything that matches"
      header = <SearchHeader searchText={searchText} title={searchTitle} />
      content = (
        <>
          <div className={styles.noResults}>
            <IconBigSearch color='subdued' />
            <div className={styles.queryText}>{errorText}</div>
            <div className={styles.queryText}>&#8220;{searchText}&#8221;</div>
            <div className={styles.helperText}>
              {`Please check your spelling or try broadening your search.`}
            </div>
          </div>
        </>
      )
    }

    return (
      <Page
        title={`${searchTitle} ${searchText}`}
        description={`Search results for ${searchText}`}
        canonicalUrl={fullSearchResultsPage(searchText)}
        contentClassName={styles.searchResults}
        header={header}
      >
        {status === Status.ERROR ? (
          <p>Oh no! Something went wrong!</p>
        ) : status === Status.LOADING ? (
          <LoadingSpinner className={styles.spinner} />
        ) : (
          content
        )}
      </Page>
    )
  }
}

export default SearchPageContent
