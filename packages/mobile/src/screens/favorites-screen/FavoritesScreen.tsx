import { useMemo } from 'react'

import type { CommonState } from '@audius/common'
import { accountActions } from '@audius/common'
import { useDispatch, useSelector } from 'react-redux'
import { useEffectOnce } from 'react-use'

import IconAlbum from 'app/assets/images/iconAlbum.svg'
import IconFavorite from 'app/assets/images/iconFavorite.svg'
import IconNote from 'app/assets/images/iconNote.svg'
import IconPlaylists from 'app/assets/images/iconPlaylists.svg'
import { Screen, ScreenContent, ScreenHeader } from 'app/components/core'
import { DownloadToggle } from 'app/components/offline-downloads'
import { TopTabNavigator } from 'app/components/top-tab-bar'
import { useFetchAllFavoritedTrackIds } from 'app/hooks/useFetchAllFavoritedTrackIds'
import { useIsOfflineModeEnabled } from 'app/hooks/useIsOfflineModeEnabled'
import { useLoadOfflineTracks } from 'app/hooks/useLoadOfflineTracks'
import { usePopToTopOnDrawerOpen } from 'app/hooks/usePopToTopOnDrawerOpen'
import { DOWNLOAD_REASON_FAVORITES } from 'app/services/offline-downloader'

import { AlbumsTab } from './AlbumsTab'
import { PlaylistsTab } from './PlaylistsTab'
import { TracksTab } from './TracksTab'
import { getAccountCollections } from './selectors'
const { fetchSavedPlaylists, fetchSavedAlbums } = accountActions

const messages = {
  header: 'Favorites'
}

const favoritesScreens = [
  {
    name: 'tracks',
    Icon: IconNote,
    component: TracksTab
  },
  {
    name: 'albums',
    Icon: IconAlbum,
    component: AlbumsTab
  },
  {
    name: 'playlists',
    Icon: IconPlaylists,
    component: PlaylistsTab
  }
]

export const FavoritesScreen = () => {
  usePopToTopOnDrawerOpen()
  const dispatch = useDispatch()
  const isOfflineModeEnabled = useIsOfflineModeEnabled()

  const { value: allFavoritedTrackIds } = useFetchAllFavoritedTrackIds()

  useEffectOnce(() => {
    dispatch(fetchSavedPlaylists())
    dispatch(fetchSavedAlbums())
  })
  useLoadOfflineTracks(DOWNLOAD_REASON_FAVORITES)

  const userCollections = useSelector((state: CommonState) =>
    getAccountCollections(state, '')
  )

  const allSavesTrackIds = useMemo(() => {
    const allIds = (allFavoritedTrackIds ?? []).concat(
      userCollections.flatMap((collection) =>
        collection.playlist_contents.track_ids.map((trackId) => trackId.track)
      )
    )
    return allIds
  }, [allFavoritedTrackIds, userCollections])

  return (
    <Screen>
      <ScreenHeader
        text={messages.header}
        icon={IconFavorite}
        styles={{ icon: { marginLeft: 3 } }}
      >
        {isOfflineModeEnabled && (
          <DownloadToggle
            collection={DOWNLOAD_REASON_FAVORITES}
            trackIds={allSavesTrackIds}
          />
        )}
      </ScreenHeader>
      {
        // ScreenContent handles the offline indicator.
        // Show favorites screen anyway when offline so users can see their downloads
        isOfflineModeEnabled ? (
          <TopTabNavigator screens={favoritesScreens} />
        ) : (
          <ScreenContent>
            <TopTabNavigator screens={favoritesScreens} />
          </ScreenContent>
        )
      }
    </Screen>
  )
}
