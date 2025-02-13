import { useUserAlbums } from '@audius/common/api'
import { CreatePlaylistSource, ID, User } from '@audius/common/models'
import {
  profilePageSelectors,
  CommonState,
  CollectionSortMode
} from '@audius/common/store'
import { Box, Flex, LoadingSpinner } from '@audius/harmony'
import { GetAlbumsByUserSortMethodEnum } from '@audius/sdk'
import { useSelector } from 'react-redux'

import { CollectionCard } from 'components/collection'
import CardLineup from 'components/lineup/CardLineup'
import UploadChip from 'components/upload/UploadChip'
import EmptyTab from 'pages/profile-page/components/EmptyTab'

import styles from './ProfilePage.module.css'

const { getProfileCollectionSortMode } = profilePageSelectors

const mapSortMode = (mode: CollectionSortMode | undefined) => {
  if (mode === CollectionSortMode.SAVE_COUNT)
    return GetAlbumsByUserSortMethodEnum.Popular
  return GetAlbumsByUserSortMethodEnum.Recent
}

const messages = {
  emptyAlbums: 'created any albums'
}

type AlbumTabProps = {
  userId: ID | null
  profile: User
  isOwner: boolean
}

export const AlbumTab = ({ userId, profile, isOwner }: AlbumTabProps) => {
  const sortMode = useSelector((state: CommonState) =>
    getProfileCollectionSortMode(state, profile?.handle ?? '')
  )
  const { data: albums, isPending } = useUserAlbums({
    userId,
    sortMethod: mapSortMode(sortMode)
  })

  const albumCards = albums?.map((album) => {
    return (
      <CollectionCard key={album.playlist_id} id={album.playlist_id} size='m' />
    )
  })

  if (isOwner) {
    albumCards?.unshift(
      <UploadChip
        key='upload-chip'
        type='album'
        variant='card'
        isFirst={albumCards && albumCards.length === 0}
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

  if (!albumCards?.length) {
    return (
      <EmptyTab
        isOwner={isOwner}
        name={profile?.name}
        text={messages.emptyAlbums}
      />
    )
  }

  return <CardLineup cardsClassName={styles.cardLineup} cards={albumCards} />
}
