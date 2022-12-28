import type { CommonState } from '@audius/common'
import {
  searchResultsPageSelectors,
  Status,
  useProxySelector,
  SearchKind
} from '@audius/common'

import { CollectionList } from 'app/components/collection-list/CollectionList'

import { EmptyResults } from '../EmptyResults'

import { useFetchTabResultsEffect } from './useFetchTabResultsEffect'

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
  const playlists = useProxySelector(selectSearchPlaylists, [])
  useFetchTabResultsEffect(SearchKind.PLAYLISTS)

  return (
    <CollectionList
      isLoading={!playlists}
      collection={playlists}
      ListEmptyComponent={<EmptyResults />}
    />
  )
}
