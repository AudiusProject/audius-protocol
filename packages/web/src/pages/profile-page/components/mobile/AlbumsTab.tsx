import { useCallback } from 'react'

import { useUserAlbums } from '@audius/common/api'
import { ID, User } from '@audius/common/models'
import { Box, Flex, LoadingSpinner } from '@audius/harmony'

import { CollectionCard } from 'components/collection'
import { InfiniteCardLineup } from 'components/lineup/InfiniteCardLineup'

import { EmptyTab } from './EmptyTab'
import styles from './ProfilePage.module.css'

type AlbumsTabProps = {
  isOwner: boolean
  profile: User
  userId: ID | null
}

export const AlbumsTab = ({ isOwner, profile, userId }: AlbumsTabProps) => {
  const {
    data: albums,
    isPending,
    hasNextPage,
    fetchNextPage,
    isFetchingNextPage
  } = useUserAlbums({ userId, pageSize: 20 })

  const handleLoadMore = useCallback(() => {
    if (!isFetchingNextPage && hasNextPage) {
      fetchNextPage()
    }
  }, [fetchNextPage, hasNextPage, isFetchingNextPage])

  const albumCards =
    albums?.map((album) => (
      <CollectionCard
        key={album.playlist_id}
        id={album.playlist_id}
        size='xs'
      />
    )) || []

  if (isPending) {
    return (
      <Flex justifyContent='center' mt='l'>
        <Box w={24}>
          <LoadingSpinner />
        </Box>
      </Flex>
    )
  }

  if (!albums?.length && !isOwner) {
    return (
      <EmptyTab
        message={`${isOwner ? 'You' : profile.name} haven't created any albums yet`}
      />
    )
  }

  return (
    <InfiniteCardLineup
      cardsClassName={styles.cardLineup}
      cards={albumCards}
      hasMore={!!hasNextPage}
      loadMore={handleLoadMore}
      isLoadingMore={isFetchingNextPage}
    />
  )
}
