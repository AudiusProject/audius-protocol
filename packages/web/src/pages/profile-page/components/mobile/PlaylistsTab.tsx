import { useCallback } from 'react'

import { useUserPlaylists } from '@audius/common/api'
import { ID, User } from '@audius/common/models'
import { Box, Flex, LoadingSpinner } from '@audius/harmony'

import { CollectionCard } from 'components/collection'
import { InfiniteCardLineup } from 'components/lineup/InfiniteCardLineup'

import EmptyTab from '../EmptyTab'

import styles from './ProfilePage.module.css'

type PlaylistsTabProps = {
  isOwner: boolean
  profile: User
  userId: ID | null
}

export const PlaylistsTab = ({
  isOwner,
  profile,
  userId
}: PlaylistsTabProps) => {
  const {
    data: playlists,
    isPending,
    hasNextPage,
    fetchNextPage,
    isFetchingNextPage
  } = useUserPlaylists({ userId, pageSize: 20 })

  const handleLoadMore = useCallback(() => {
    if (!isFetchingNextPage && hasNextPage) {
      fetchNextPage()
    }
  }, [fetchNextPage, hasNextPage, isFetchingNextPage])

  const playlistCards =
    playlists?.map((playlist) => (
      <CollectionCard
        key={playlist.playlist_id}
        id={playlist.playlist_id}
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

  if (!playlists?.length && !isOwner) {
    return (
      <EmptyTab
        isOwner={isOwner}
        name={profile.name}
        text={`${isOwner ? 'You' : profile.name} haven't created any playlists yet`}
        css={{ marginTop: 0 }}
      />
    )
  }

  return (
    <InfiniteCardLineup
      cardsClassName={styles.cardLineup}
      cards={playlistCards}
      hasMore={!!hasNextPage}
      loadMore={handleLoadMore}
      isLoadingMore={isFetchingNextPage}
    />
  )
}
