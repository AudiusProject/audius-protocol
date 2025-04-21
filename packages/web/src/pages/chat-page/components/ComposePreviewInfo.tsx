import { useGetPlaylistById, useGetTrackById } from '@audius/common/api'
import { SquareSizes, ID } from '@audius/common/models'
import { Flex, Text } from '@audius/harmony'

import DynamicImage from 'components/dynamic-image/DynamicImage'
import { UserLink } from 'components/link/UserLink'
import { useCollectionCoverArt } from 'hooks/useCollectionCoverArt'
import { useTrackCoverArt } from 'hooks/useTrackCoverArt'

type ComposePreviewInfoProps = {
  title: string
  userId: ID
  image?: string
}

const ComposePreviewInfo = (props: ComposePreviewInfoProps) => {
  const { title, userId, image } = props
  return (
    <Flex ph='l' pv='s' gap='m' borderBottom='default'>
      <Flex
        borderRadius='s'
        h='unit12'
        w='unit12'
        style={{ overflow: 'hidden' }}
      >
        <DynamicImage style={{ height: '100%', width: '100%' }} image={image} />
      </Flex>
      <Flex direction='column' alignItems='flex-start' justifyContent='center'>
        <Text variant='body' strength='strong'>
          {title}
        </Text>
        <Flex alignItems='center' gap='xs'>
          <UserLink userId={userId} popover />
        </Flex>
      </Flex>
    </Flex>
  )
}

type ComposerTrackInfoProps = {
  trackId: ID
}

export const ComposerTrackInfo = (props: ComposerTrackInfoProps) => {
  const { trackId } = props
  const image = useTrackCoverArt({
    trackId,
    size: SquareSizes.SIZE_150_BY_150
  })

  const { data: track } = useGetTrackById({ id: trackId }, { force: true })

  if (!track) return null

  return (
    <ComposePreviewInfo
      title={track.title}
      userId={track.user.user_id}
      image={image}
    />
  )
}

type ComposerCollectionInfoProps = {
  collectionId: ID
}

export const ComposerCollectionInfo = (props: ComposerCollectionInfoProps) => {
  const { collectionId } = props
  const image = useCollectionCoverArt({
    collectionId,
    size: SquareSizes.SIZE_150_BY_150
  })

  const { data: collection } = useGetPlaylistById(
    { playlistId: collectionId },
    { force: true }
  )

  if (!collection) return null

  return (
    <ComposePreviewInfo
      title={collection.playlist_name}
      userId={collection.user.user_id}
      image={image}
    />
  )
}
