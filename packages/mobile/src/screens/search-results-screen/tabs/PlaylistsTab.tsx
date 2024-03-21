import { useProxySelector } from '@audius/common/hooks'
import { Status } from '@audius/common/models'
import type { CommonState } from '@audius/common/store'
import { searchResultsPageSelectors, SearchKind } from '@audius/common/store'

import { CollectionList } from 'app/components/collection-list/CollectionList'
import { spacing } from 'app/styles/spacing'

import { EmptyResults } from '../EmptyResults'

import { useFetchTabResultsEffect } from './useFetchTabResultsEffect'
import { useTrackSearchResultSelect } from './useTrackSearchResultSelect'

const { getSearchStatus } = searchResultsPageSelectors

const selectSearchPlaylists = (state: CommonState) => {
  const searchStatus = getSearchStatus(state)
  if (searchStatus === Status.LOADING) return undefined

  return state.pages.searchResults.playlistIds
    ?.map((playlistId) => {
      const playlist = state.collections.entries[playlistId].metadata
      const user = state.users.entries[playlist.playlist_owner_id].metadata
      const trackCount = playlist.playlist_contents.track_ids.length
      return { ...playlist, user, trackCount }
    })
    .filter((playlist) => playlist.user && !playlist.user.is_deactivated)
}

export const PlaylistsTab = () => {
  const onSelectSearchResult = useTrackSearchResultSelect(
    'playlist',
    'more results page'
  )
  const playlists = useProxySelector(selectSearchPlaylists, [])
  useFetchTabResultsEffect(SearchKind.PLAYLISTS)

  return (
    <CollectionList
      style={{ paddingTop: spacing(3) }}
      isLoading={!playlists}
      collection={playlists}
      ListEmptyComponent={<EmptyResults />}
      onCollectionPress={onSelectSearchResult}
    />
  )
}
