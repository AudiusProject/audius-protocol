import { useCallback } from 'react'

import { useCurrentUserId, useUserAlbums } from '@audius/common/api'
import { useIsFocused } from '@react-navigation/native'

import { CollectionList } from 'app/components/collection-list/CollectionList'
import { spacing } from 'app/styles/spacing'

import { EmptyProfileTile } from '../EmptyProfileTile'
import { useSelectProfile } from '../selectors'

const emptyAlbums = []

export const AlbumsTab = () => {
  const { album_count, user_id } = useSelectProfile(['album_count', 'user_id'])
  const { data: accountUserId } = useCurrentUserId()
  const isOwner = accountUserId === user_id
  const isFocused = useIsFocused()

  const {
    data: albums,
    isPending,
    hasNextPage,
    fetchNextPage,
    isFetchingNextPage
  } = useUserAlbums({ userId: user_id }, { enabled: isFocused })

  const handleEndReached = useCallback(() => {
    if (!isFetchingNextPage && hasNextPage) {
      fetchNextPage()
    }
  }, [fetchNextPage, hasNextPage, isFetchingNextPage])

  return (
    <CollectionList
      collection={album_count > 0 || isOwner ? albums : emptyAlbums}
      style={{ paddingTop: spacing(3) }}
      ListEmptyComponent={
        <EmptyProfileTile tab='albums' style={{ marginTop: 0 }} />
      }
      disableTopTabScroll
      showsVerticalScrollIndicator={false}
      totalCount={album_count}
      isLoading={isPending}
      onEndReached={handleEndReached}
      isLoadingMore={isFetchingNextPage}
    />
  )
}
