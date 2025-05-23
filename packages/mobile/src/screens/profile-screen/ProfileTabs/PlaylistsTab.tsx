import { useCallback } from 'react'

import { useCurrentUserId, useUserPlaylists } from '@audius/common/api'
import { CreatePlaylistSource } from '@audius/common/models'
import { useIsFocused } from '@react-navigation/native'

import { CollectionList } from 'app/components/collection-list'
import { spacing } from 'app/styles/spacing'

import { EmptyProfileTile } from '../EmptyProfileTile'
import { useSelectProfile } from '../selectors'

const emptyPlaylists = []

export const PlaylistsTab = () => {
  const { playlist_count, user_id } = useSelectProfile([
    'handle',
    'playlist_count',
    'user_id'
  ])
  const { data: accountUserId } = useCurrentUserId()
  const isOwner = accountUserId === user_id
  const isFocused = useIsFocused()

  const {
    data: playlists,
    isPending,
    hasNextPage,
    fetchNextPage,
    isFetchingNextPage
  } = useUserPlaylists({ userId: user_id }, { enabled: isFocused })

  const handleEndReached = useCallback(() => {
    if (!isFetchingNextPage && hasNextPage) {
      fetchNextPage()
    }
  }, [fetchNextPage, hasNextPage, isFetchingNextPage])

  return (
    <CollectionList
      collection={playlist_count > 0 || isOwner ? playlists : emptyPlaylists}
      style={{ paddingTop: spacing(3) }}
      ListEmptyComponent={
        <EmptyProfileTile tab='playlists' style={{ marginTop: 0 }} />
      }
      disableTopTabScroll
      showsVerticalScrollIndicator={false}
      totalCount={playlist_count}
      showCreateCollectionTile={isOwner}
      createPlaylistSource={CreatePlaylistSource.PROFILE_PAGE}
      isLoading={isPending}
      onEndReached={handleEndReached}
      isLoadingMore={isFetchingNextPage}
    />
  )
}
