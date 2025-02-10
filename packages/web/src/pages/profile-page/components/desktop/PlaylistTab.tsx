import { useUserPlaylists } from '@audius/common/api'
import { CreatePlaylistSource, ID, User } from '@audius/common/models'
import {
  profilePageSelectors,
  CommonState,
  CollectionSortMode
} from '@audius/common/store'
import { Box, Flex, LoadingSpinner } from '@audius/harmony'
import { useSelector } from 'react-redux'

import { CollectionCard } from 'components/collection'
import CardLineup from 'components/lineup/CardLineup'
import UploadChip from 'components/upload/UploadChip'
import EmptyTab from 'pages/profile-page/components/EmptyTab'

import styles from './ProfilePage.module.css'

const { getProfileCollectionSortMode } = profilePageSelectors

const mapSortMode = (
  mode: CollectionSortMode | undefined
): 'recent' | 'save_count' => {
  if (mode === CollectionSortMode.SAVE_COUNT) return 'save_count'
  return 'recent'
}

const messages = {
  emptyPlaylists: 'created any playlists'
}

type PlaylistTabProps = {
  userId: ID | null
  profile: User
  isOwner: boolean
}

export const PlaylistTab = ({ userId, profile, isOwner }: PlaylistTabProps) => {
  const sortMode = useSelector((state: CommonState) =>
    getProfileCollectionSortMode(state, profile?.handle ?? '')
  )
  const { data: playlists, isPending } = useUserPlaylists({
    userId,
    sortMethod: mapSortMode(sortMode)
  })

  const playlistCards = playlists?.map((playlist) => {
    return (
      <CollectionCard
        key={playlist.playlist_id}
        id={playlist.playlist_id}
        size='m'
      />
    )
  })

  if (isOwner) {
    playlistCards?.unshift(
      <UploadChip
        key='upload-chip'
        type='playlist'
        variant='card'
        isFirst={playlistCards.length === 0}
        source={CreatePlaylistSource.PROFILE_PAGE}
      />
    )
  }

  if (isPending) {
    return (
      <Flex justifyContent='center' mt='2xl'>
        <Box w={24}>
          <LoadingSpinner />
        </Box>
      </Flex>
    )
  }

  if (!playlistCards?.length) {
    return (
      <EmptyTab
        isOwner={isOwner}
        name={profile?.name}
        text={messages.emptyPlaylists}
      />
    )
  }

  return <CardLineup cardsClassName={styles.cardLineup} cards={playlistCards} />
}
