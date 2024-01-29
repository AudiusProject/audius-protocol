import { useMemo } from 'react'

import { useIsFocused } from '@react-navigation/native'

import { IconAlbum } from '@audius/harmony-native'
import IconNote from 'app/assets/images/iconNote.svg'
import IconPlaylists from 'app/assets/images/iconPlaylists.svg'
import IconUser from 'app/assets/images/iconUser.svg'
import { Screen, ScreenContent, ScreenHeader } from 'app/components/core'
import {
  TabNavigator,
  tabScreen
} from 'app/components/top-tab-bar/TopTabNavigator'
import { useRoute } from 'app/hooks/useRoute'

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

  const profilesScreen = tabScreen({
    name: 'Profiles',
    Icon: IconUser,
    component: ProfilesTab
  })

  const tracksScreen = tabScreen({
    name: 'Tracks',
    Icon: IconNote,
    component: TracksTab
  })

  const albumsScreen = tabScreen({
    name: 'Albums',
    Icon: IconAlbum,
    component: AlbumsTab
  })

  const playlistsScreen = tabScreen({
    name: 'Playlists',
    Icon: IconPlaylists,
    component: PlaylistsTab
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
