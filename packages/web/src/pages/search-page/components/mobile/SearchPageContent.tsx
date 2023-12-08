import { memo, useCallback, useContext, useEffect, useMemo } from 'react'

import {
  UID,
  Name,
  UserCollection,
  LineupState,
  Status,
  User,
  searchResultsPageTracksLineupActions as tracksActions,
  trimToAlphaNumeric
} from '@audius/common'
import { matchPath } from 'react-router'
import { Dispatch } from 'redux'

import IconAlbum from 'assets/img/iconAlbum.svg'
import IconBigSearch from 'assets/img/iconBigSearch.svg'
import IconNote from 'assets/img/iconNote.svg'
import IconPlaylists from 'assets/img/iconPlaylists.svg'
import IconUser from 'assets/img/iconUser.svg'
import { make, useRecord } from 'common/store/analytics/actions'
import Card from 'components/card/mobile/Card'
import Header from 'components/header/mobile/Header'
import { HeaderContext } from 'components/header/mobile/HeaderContextProvider'
import CardLineup from 'components/lineup/CardLineup'
import Lineup from 'components/lineup/Lineup'
import LoadingSpinner from 'components/loading-spinner/LoadingSpinner'
import MobilePageContainer from 'components/mobile-page-container/MobilePageContainer'
import NavContext, {
  LeftPreset,
  CenterPreset,
  RightPreset
} from 'components/nav/store/context'
import useTabs from 'hooks/useTabs/useTabs'
import { getCategory } from 'pages/search-page/helpers'
import { getLocationPathname } from 'store/routing/selectors'
import { useSelector } from 'utils/reducer'
import {
  collectionPage,
  profilePage,
  fullSearchResultsPage,
  SEARCH_PAGE
} from 'utils/route'

import styles from './SearchPageContent.module.css'
import { useHistoryContext } from 'app/HistoryProvider'

export type SearchPageContentProps = {
  tracks: LineupState<{}>
  playlists: UserCollection[]
  albums: UserCollection[]
  artists: User[]
  match: any
  searchText: string
  dispatch: Dispatch
  playing: boolean
  buffering: boolean
  containerRef: HTMLElement | null
  currentQueueItem: {
    source: any
    track: any
    user: any
    uid: UID
  }
  search: {
    albumUids: UID[]
    artistUids: UID[]
    playlistUids: UID[]
    trackUids: UID[]
    searchText: string
    status: Status
    tracks: any
  }
  isTagSearch: boolean
  goToRoute: (route: string) => void
}

const TrackSearchPageMessages = {
  title1: "Sorry, we couldn't find anything matching",
  title1Tag: "Sorry, we couldn't find any tags matching",
  title2: 'Please check your spelling or try broadening your search.'
}

const NoResults = ({
  isTagSearch,
  searchText
}: {
  isTagSearch: boolean
  searchText: string
}) => (
  <div className={styles.centeringContainer}>
    <div className={styles.noResults}>
      <IconBigSearch />
      <div>
        {isTagSearch
          ? TrackSearchPageMessages.title1Tag
          : TrackSearchPageMessages.title1}
      </div>
      <span>{`"${searchText}"`}</span>
      <div>{TrackSearchPageMessages.title2}</div>
    </div>
  </div>
)

type SearchStatusWrapperProps = {
  status: Status
  children: JSX.Element
}

const SearchStatusWrapper = memo(
  ({ status, children }: SearchStatusWrapperProps) => {
    switch (status) {
      case Status.IDLE:
      case Status.LOADING:
      case Status.ERROR: // TODO
        return <LoadingSpinner className={styles.spinner} />
      case Status.SUCCESS:
        return children
    }
  }
)

const TracksSearchPage = ({
  search,
  searchText,
  tracks,
  dispatch,
  buffering,
  playing,
  currentQueueItem,
  containerRef,
  isTagSearch
}: SearchPageContentProps) => {
  const { history } = useHistoryContext()
  const numTracks = Object.keys(tracks.entries).length
  const loadingStatus = (() => {
    // We need to account for the odd case where search.status === success but
    // the tracks are still loading in (tracks.status === loading && tracks.entries === 0),
    // and in this case still show a loading screen.
    const searchAndTracksSuccess =
      search.status === Status.SUCCESS && tracks.status === Status.SUCCESS
    const searchSuccessTracksLoadingMore =
      search.status === Status.SUCCESS &&
      tracks.status === Status.LOADING &&
      numTracks > 0

    if (searchAndTracksSuccess || searchSuccessTracksLoadingMore) {
      return Status.SUCCESS
    } else if (search.status === Status.ERROR) {
      return Status.ERROR
    } else {
      return Status.LOADING
    }
  })()

  return (
    <SearchStatusWrapper status={loadingStatus}>
      {numTracks ? (
        <div className={styles.lineupContainer}>
          <Lineup
            selfLoad
            lineup={tracks}
            playingSource={currentQueueItem.source}
            playingUid={currentQueueItem.uid}
            playingTrackId={
              currentQueueItem.track && currentQueueItem.track.track_id
            }
            playing={playing}
            buffering={buffering}
            scrollParent={containerRef}
            loadMore={(offset: number, limit: number) =>
              dispatch(
                tracksActions.fetchLineupMetadatas(offset, limit, false, {
                  category: getCategory(history.location.pathname),
                  query: trimToAlphaNumeric(searchText),
                  isTagSearch
                })
              )
            }
            playTrack={(uid: UID) => dispatch(tracksActions.play(uid))}
            pauseTrack={() => dispatch(tracksActions.pause())}
            actions={tracksActions}
          />
        </div>
      ) : (
        <NoResults searchText={searchText} isTagSearch={isTagSearch} />
      )}
    </SearchStatusWrapper>
  )
}

const ALBUM_CATEGORY_NAME = 'Artists'

enum CardType {
  ALBUM = 'ALBUM',
  PLAYLIST = 'PLAYLIST',
  USER = 'USER'
}

type CardSearchPageProps = { cardType: CardType } & SearchPageContentProps

const cardSearchPageMessages = {
  followers: 'Followers'
}

/*
 * Component capable of rendering albums/playlists/people
 */
const CardSearchPage = ({
  albums,
  playlists,
  artists,
  goToRoute,
  cardType,
  search,
  isTagSearch,
  searchText
}: CardSearchPageProps) => {
  const entities: Array<UserCollection | User> = (() => {
    switch (cardType) {
      case CardType.ALBUM:
        return albums
      case CardType.PLAYLIST:
        return playlists
      case CardType.USER:
        return artists
    }
  })()

  const cards = entities.map((e) => {
    const { id, userId, route, primaryText, secondaryText, imageSize } =
      (() => {
        switch (cardType) {
          case CardType.USER: {
            const user = e as User
            const followers = `${user.follower_count} ${cardSearchPageMessages.followers}`
            return {
              id: user.user_id,
              userId: user.user_id,
              route: profilePage(user.handle),
              primaryText: user.name,
              secondaryText: followers,
              imageSize: user._profile_picture_sizes
            }
          }
          case CardType.ALBUM:
          case CardType.PLAYLIST: {
            const collection = e as UserCollection
            return {
              userId: collection.playlist_owner_id,
              id: collection.playlist_id,
              route: collectionPage(
                collection.user.handle,
                collection.playlist_name,
                collection.playlist_id,
                collection.permalink,
                cardType === CardType.ALBUM
              ),
              primaryText: collection.playlist_name,
              secondaryText: collection.user.handle,
              imageSize: collection._cover_art_sizes
            }
          }
        }
      })()

    return (
      <Card
        key={id}
        id={id}
        userId={userId}
        isUser={cardType === CardType.USER}
        imageSize={imageSize}
        primaryText={primaryText}
        secondaryText={secondaryText}
        onClick={() => goToRoute(route)}
        className=''
      />
    )
  })

  return (
    <SearchStatusWrapper status={search.status}>
      {entities.length ? (
        <div className={styles.lineupContainer}>
          <CardLineup categoryName={ALBUM_CATEGORY_NAME} cards={cards} />
        </div>
      ) : (
        <NoResults searchText={searchText} isTagSearch={isTagSearch} />
      )}
    </SearchStatusWrapper>
  )
}

const messages = {
  title: 'More Results',
  tagSearchTitle: 'Tag Search',
  tracksTitle: 'Tracks',
  albumsTitle: 'Albums',
  playlistsTitle: 'Playlists',
  peopleTitle: 'Profiles'
}

enum Tabs {
  TRACKS = 'TRACKS',
  ALBUMS = 'ALBUMS',
  PLAYLISTS = 'PLAYLISTS',
  PEOPLE = 'PEOPLE'
}

const SearchPageContent = (props: SearchPageContentProps) => {
  const searchTitle = props.isTagSearch ? 'Tag Search' : 'Search'

  // Set nav header
  const { setLeft, setCenter, setRight } = useContext(NavContext)!
  useEffect(() => {
    setLeft(LeftPreset.NOTIFICATION)
    setCenter(CenterPreset.LOGO)
    setRight(RightPreset.SEARCH)
  }, [setLeft, setCenter, setRight])

  const record = useRecord()
  const { searchText } = props
  const didChangeTabsFrom = useCallback(
    (from: string, to: string) => {
      if (from !== to)
        record(
          make(Name.SEARCH_TAB_CLICK, {
            term: searchText,
            tab: to.toLowerCase() as
              | 'people'
              | 'tracks'
              | 'albums'
              | 'playlists'
          })
        )
    },
    [record, searchText]
  )
  const { isTagSearch } = props
  // Show fewer tabs if this is a tagSearch
  const computedTabs = useMemo(() => {
    return isTagSearch
      ? {
          didChangeTabsFrom,
          tabs: [
            {
              icon: <IconNote />,
              text: messages.tracksTitle,
              label: Tabs.TRACKS
            },
            {
              icon: <IconUser />,
              text: messages.peopleTitle,
              label: Tabs.PEOPLE
            }
          ],
          elements: [
            <TracksSearchPage key='tagTrackSearch' {...props} />,
            <CardSearchPage
              key='tagUserSearch'
              {...props}
              cardType={CardType.USER}
            />
          ]
        }
      : {
          didChangeTabsFrom,
          tabs: [
            {
              icon: <IconUser />,
              text: messages.peopleTitle,
              label: Tabs.PEOPLE
            },
            {
              icon: <IconNote />,
              text: messages.tracksTitle,
              label: Tabs.TRACKS
            },
            {
              icon: <IconAlbum />,
              text: messages.albumsTitle,
              label: Tabs.ALBUMS
            },
            {
              icon: <IconPlaylists />,
              text: messages.playlistsTitle,
              label: Tabs.PLAYLISTS
            }
          ],
          elements: [
            <CardSearchPage
              key='userSearch'
              {...props}
              cardType={CardType.USER}
            />,
            <TracksSearchPage key='trackSearch' {...props} />,
            <CardSearchPage
              key='albumSearch'
              {...props}
              cardType={CardType.ALBUM}
            />,
            <CardSearchPage
              key='playlistSearch'
              {...props}
              cardType={CardType.PLAYLIST}
            />
          ]
        }
  }, [isTagSearch, props, didChangeTabsFrom])

  const { tabs, body } = useTabs(computedTabs)
  const { setHeader } = useContext(HeaderContext)
  const pathname = useSelector(getLocationPathname)
  useEffect(() => {
    const isSearchPage = matchPath(pathname, {
      path: SEARCH_PAGE
    })
    if (!isSearchPage) return
    setHeader(
      <>
        <Header
          className={styles.header}
          title={isTagSearch ? messages.tagSearchTitle : messages.title}
        />
        <div className={styles.tabBar}>{tabs}</div>
      </>
    )
  }, [setHeader, tabs, pathname, isTagSearch])

  return (
    <MobilePageContainer
      title={`${searchTitle} ${searchText}`}
      description={`Search results for ${searchText}`}
      canonicalUrl={fullSearchResultsPage(searchText)}
    >
      <div className={styles.tabContainer}>
        <div className={styles.pageContainer}>{body}</div>
      </div>
    </MobilePageContainer>
  )
}

export default SearchPageContent
