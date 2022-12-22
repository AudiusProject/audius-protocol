import { useCallback, useMemo, useState } from 'react'

import type { CommonState } from '@audius/common'
import { accountActions } from '@audius/common'
import { View } from 'react-native'
import { useDispatch, useSelector } from 'react-redux'
import { useEffectOnce } from 'react-use'

import IconAlbum from 'app/assets/images/iconAlbum.svg'
import IconFavorite from 'app/assets/images/iconFavorite.svg'
import IconNote from 'app/assets/images/iconNote.svg'
import IconPlaylists from 'app/assets/images/iconPlaylists.svg'
import { Screen, ScreenContent, ScreenHeader } from 'app/components/core'
import type { TrackForDownload } from 'app/components/offline-downloads'
import { DownloadToggle } from 'app/components/offline-downloads'
import { TopTabNavigator } from 'app/components/top-tab-bar'
import { useAppTabScreen } from 'app/hooks/useAppTabScreen'
import { useFetchAllFavoritedTracks } from 'app/hooks/useFetchAllFavoritedTracks'
import {
  toggleLocalOfflineModeOverride,
  useIsOfflineModeEnabled,
  useReadOfflineOverride
} from 'app/hooks/useIsOfflineModeEnabled'
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
  useAppTabScreen()
  const dispatch = useDispatch()
  const [clickCount, setClickCount] = useState(0)
  const isOfflineModeEnabled = useIsOfflineModeEnabled()

  const { value: allFavoritedTrackIds } = useFetchAllFavoritedTracks()

  useReadOfflineOverride()
  const handleHeaderClick = useCallback(() => {
    if (clickCount >= 10) {
      toggleLocalOfflineModeOverride()
    } else {
      setClickCount(clickCount + 1)
    }
  }, [clickCount])

  useEffectOnce(() => {
    dispatch(fetchSavedPlaylists())
    dispatch(fetchSavedAlbums())
  })

  const userCollections = useSelector((state: CommonState) =>
    getAccountCollections(state, '')
  )

  const tracksForDownload: TrackForDownload[] = useMemo(() => {
    const trackFavoritesToDownload: TrackForDownload[] = (
      allFavoritedTrackIds ?? []
    ).map(({ trackId, favoriteCreatedAt }) => ({
      trackId,
      downloadReason: {
        is_from_favorites: true,
        collection_id: DOWNLOAD_REASON_FAVORITES,
        favorite_created_at: favoriteCreatedAt
      }
    }))
    const collectionFavoritesToDownload: TrackForDownload[] =
      userCollections.flatMap((collection) =>
        collection.playlist_contents.track_ids.map(({ track: trackId }) => ({
          trackId,
          downloadReason: {
            is_from_favorites: true,
            collection_id: collection.playlist_id.toString()
          }
          // TODO: include a favorite_created_at timestamp for sorting offline collections
        }))
      )

    return trackFavoritesToDownload.concat(collectionFavoritesToDownload)
  }, [allFavoritedTrackIds, userCollections])

  return (
    <Screen>
      <View onTouchStart={clickCount < 10 ? handleHeaderClick : undefined}>
        <ScreenHeader
          text={messages.header}
          icon={IconFavorite}
          styles={{ icon: { marginLeft: 3 } }}
        >
          {isOfflineModeEnabled && (
            <DownloadToggle
              tracksForDownload={tracksForDownload}
              isFavoritesDownload
            />
          )}
        </ScreenHeader>
      </View>
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
