import { Component } from 'react'

import { Status, Name } from '@audius/common/models'
import {
  searchResultsPageTracksLineupActions as tracksActions,
  SearchKind
} from '@audius/common/store'
import { route } from '@audius/common/utils'
import { IconSearch as IconBigSearch, Box } from '@audius/harmony'
import { Redirect } from 'react-router'

import { make } from 'common/store/analytics/actions'
import { CollectionCard } from 'components/collection'
import CategoryHeader from 'components/header/desktop/CategoryHeader'
import Header from 'components/header/desktop/Header'
import CardLineup from 'components/lineup/CardLineup'
import Lineup from 'components/lineup/Lineup'
import LoadingSpinner from 'components/loading-spinner/LoadingSpinner'
import Page from 'components/page/Page'
import { UserCard } from 'components/user-card'
import { fullSearchResultsPage } from 'utils/route'

import styles from './SearchPageContent.module.css'

const { NOT_FOUND_PAGE } = route

const SearchHeader = (props) => {
  const secondary = (
    <span className={styles.searchText}>&#8220;{props.searchText}&#8221;</span>
  )
  return (
    <Header
      {...props}
      primary={props.title}
      secondary={secondary}
      variant='main'
      containerStyles={styles.searchResultsHeader}
    />
  )
}

class SearchPageContent extends Component {
  render() {
    const {
      tracks,
      currentQueueItem,
      playing,
      buffering,
      artists,
      playlists,
      albums,
      handleViewMoreResults,
      searchResultsCategory,
      isTagSearch,
      searchText,
      search: { status },
      recordSearchResultClick
    } = this.props
    const searchTitle = isTagSearch ? `Tag Search` : `Search`

    const artistCards = artists.map((artist) => {
      const onClick = () => {
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
        <UserCard
          key={artist.user_id}
          id={artist.user_id}
          onClick={onClick}
          size='m'
        />
      )
    })

    const playlistCards = playlists.map((playlist) => {
      const handleClick = () => {
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
        <CollectionCard
          key={playlist.playlist_id}
          id={playlist.playlist_id}
          onClick={handleClick}
          size='m'
        />
      )
    })

    const albumCards = albums.map((album) => {
      const handleClick = () => {
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
        <CollectionCard
          key={album.playlist_id}
          id={album.playlist_id}
          onClick={handleClick}
          size='m'
        />
      )
    })

    const onClickTile = (trackId, source) => {
      this.props.dispatch(
        make(Name.SEARCH_RESULT_SELECT, {
          term: searchText,
          kind: 'track',
          id: trackId,
          source
        })
      )
    }
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
              playTrack={(uid, trackId) => {
                onClickTile(trackId, 'more results page')
                this.props.dispatch(tracksActions.play(uid))
              }}
              pauseTrack={() => this.props.dispatch(tracksActions.pause())}
              actions={tracksActions}
              onClickTile={(trackId) => {
                onClickTile(trackId, 'more results page')
              }}
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
              {/* Temp spacing improvement until search page redesign */}
              <Box pr={115}>
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
                  playTrack={(uid, trackId) => {
                    onClickTile(trackId, 'search results page')
                    this.props.dispatch(tracksActions.play(uid))
                  }}
                  pauseTrack={(uid) =>
                    this.props.dispatch(tracksActions.pause())
                  }
                  actions={tracksActions}
                  onClickTile={(trackId) => {
                    onClickTile(trackId, 'search results page')
                  }}
                />
              </Box>
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
