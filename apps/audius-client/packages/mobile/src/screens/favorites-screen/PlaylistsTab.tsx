import { useCallback, useState } from 'react'

import {
  CreatePlaylistSource,
  FeatureFlags,
  reachabilitySelectors
} from '@audius/common'
import Animated, { FadeIn, FadeOut, Layout } from 'react-native-reanimated'
import { useSelector } from 'react-redux'

import { CollectionList } from 'app/components/collection-list'
import { Button, VirtualizedScrollView } from 'app/components/core'
import { EmptyTileCTA } from 'app/components/empty-tile-cta'
import { useIsOfflineModeEnabled } from 'app/hooks/useIsOfflineModeEnabled'
import { useNavigation } from 'app/hooks/useNavigation'
import { useFeatureFlag } from 'app/hooks/useRemoteConfig'

import type { FavoritesTabScreenParamList } from '../app-screen/FavoritesTabScreen'

import { FilterInput } from './FilterInput'
import { NoTracksPlaceholder } from './NoTracksPlaceholder'
import { OfflineContentBanner } from './OfflineContentBanner'
import { useCollectionScreenData } from './useCollectionScreenData'

const { getIsReachable } = reachabilitySelectors

const messages = {
  emptyTabText: "You haven't favorited any playlists yet.",
  inputPlaceholder: 'Filter Playlists'
}

export const PlaylistsTab = () => {
  const navigation = useNavigation<FavoritesTabScreenParamList>()
  const handleNavigateToNewPlaylist = useCallback(() => {
    navigation.push('CreatePlaylist')
  }, [navigation])
  const { isEnabled: isPlaylistUpdatesEnabled } = useFeatureFlag(
    FeatureFlags.PLAYLIST_UPDATES_PRE_QA
  )

  const [filterValue, setFilterValue] = useState('')
  const { filteredCollections: userPlaylists, collectionIdsToNumTracks } =
    useCollectionScreenData(filterValue, 'playlists')
  const isOfflineModeEnabled = useIsOfflineModeEnabled()
  const isReachable = useSelector(getIsReachable)

  return (
    <VirtualizedScrollView>
      {!userPlaylists?.length && !filterValue ? (
        isOfflineModeEnabled && !isReachable ? (
          <NoTracksPlaceholder />
        ) : (
          <EmptyTileCTA message={messages.emptyTabText} />
        )
      ) : (
        <>
          <OfflineContentBanner />
          <FilterInput
            value={filterValue}
            placeholder={messages.inputPlaceholder}
            onChangeText={setFilterValue}
          />
          {(!isReachable && isOfflineModeEnabled) ||
          isPlaylistUpdatesEnabled ? null : (
            <Animated.View layout={Layout} entering={FadeIn} exiting={FadeOut}>
              <Button
                title='Create a New Playlist'
                variant='commonAlt'
                onPress={handleNavigateToNewPlaylist}
              />
            </Animated.View>
          )}
          <Animated.View layout={Layout}>
            <CollectionList
              scrollEnabled={false}
              collection={userPlaylists}
              collectionIdsToNumTracks={collectionIdsToNumTracks}
              showCreatePlaylistTile={isPlaylistUpdatesEnabled && !!isReachable}
              createPlaylistSource={CreatePlaylistSource.FAVORITES_PAGE}
            />
          </Animated.View>
        </>
      )}
    </VirtualizedScrollView>
  )
}
