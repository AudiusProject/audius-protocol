import { useMemo } from 'react'

import type { ID } from '@audius/common'
import { useIsFocused } from '@react-navigation/native'
import { getSearchBarText } from 'audius-client/src/common/store/search-bar/selectors'
import { useSelector } from 'react-redux'

import {
  IconAlbum,
  IconNote,
  IconPlaylists,
  IconUser
} from '@audius/harmony-native'
import { Screen, ScreenContent, ScreenHeader } from 'app/components/core'
import {
  TabNavigator,
  tabScreen
} from 'app/components/top-tab-bar/TopTabNavigator'
import { useRoute } from 'app/hooks/useRoute'
import { make, track } from 'app/services/analytics'
import { EventNames } from 'app/types/analytics'

import { SearchFocusContext } from './SearchFocusContext'
import { SearchQueryContext } from './SearchQueryContext'
import { AlbumsTab } from './tabs/AlbumsTab'
import { PlaylistsTab } from './tabs/PlaylistsTab'
import { ProfilesTab } from './tabs/ProfilesTab'
import { TracksTab } from './tabs/TracksTab'

const messages = {
  header: 'More Results'
}

export const SearchResultsScreen = () => {
  const { params } = useRoute<'SearchResults'>()
  const { query } = params
  const isFocused = useIsFocused()
  const focusContext = useMemo(() => ({ isFocused }), [isFocused])
  const searchQueryContext = useMemo(
    () => ({ isTagSearch: false, query }),
    [query]
  )
  const searchQuery = useSelector(getSearchBarText)
  const trackSearchResultSelect = (
    id: ID,
    kind: 'track' | 'profile' | 'playlist' | 'album'
  ) => {
    track(
      make({
        eventName: EventNames.SEARCH_RESULT_SELECT,
        term: searchQuery,
        source: 'more results page',
        kind,
        id
      })
    )
  }
  const profilesScreen = tabScreen({
    name: 'Profiles',
    Icon: IconUser,
    component: ProfilesTab,
    initialParams: {
      onCardPress: (id) => trackSearchResultSelect(id, 'profile')
    }
  })

  const tracksScreen = tabScreen({
    name: 'Tracks',
    Icon: IconNote,
    component: TracksTab,
    initialParams: {
      trackSearchResultSelect: (id) => trackSearchResultSelect(id, 'track')
    }
  })

  const albumsScreen = tabScreen({
    name: 'Albums',
    Icon: IconAlbum,
    component: AlbumsTab,
    initialParams: {
      trackSearchResultSelect: (id) => trackSearchResultSelect(id, 'playlist')
    }
  })

  const playlistsScreen = tabScreen({
    name: 'Playlists',
    Icon: IconPlaylists,
    component: PlaylistsTab,
    initialParams: {
      trackSearchResultSelect: (id) => trackSearchResultSelect(id, 'playlist')
    }
  })

  return (
    <Screen topbarRight={null}>
      <ScreenHeader text={messages.header} />
      <ScreenContent unboxed>
        <SearchFocusContext.Provider value={focusContext}>
          <SearchQueryContext.Provider value={searchQueryContext}>
            <TabNavigator initialScreenName='Profiles'>
              {profilesScreen}
              {tracksScreen}
              {albumsScreen}
              {playlistsScreen}
            </TabNavigator>
          </SearchQueryContext.Provider>
        </SearchFocusContext.Provider>
      </ScreenContent>
    </Screen>
  )
}
