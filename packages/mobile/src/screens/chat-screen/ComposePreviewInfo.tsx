import type { ReactNode } from 'react'

import { useGetPlaylistById, useGetTrackById } from '@audius/common/api'
import type { ID, UserMetadata } from '@audius/common/models'
import { SquareSizes } from '@audius/common/models'

import { Flex, Text } from '@audius/harmony-native'
import { CollectionImageV2 } from 'app/components/image/CollectionImageV2'
import { TrackImageV2 } from 'app/components/image/TrackImageV2'
import UserBadges from 'app/components/user-badges'

type ComposePreviewInfoProps = {
  title: string
  name: string
  user: UserMetadata
  image?: ReactNode
}

const ComposePreviewInfo = (props: ComposePreviewInfoProps) => {
  const { title, name, user, image } = props
  return (
    <Flex direction='row' pv='s' gap='s' borderBottom='default'>
      <Flex
        direction='row'
        borderRadius='s'
        h='unit12'
        w='unit12'
        style={{ overflow: 'hidden' }}
      >
        {image}
      </Flex>
      <Flex direction='column' alignItems='flex-start' justifyContent='center'>
        <Text variant='body' strength='strong'>
          {title}
        </Text>
        <Flex direction='row' alignItems='center' gap='xs'>
          <Text variant='body' strength='strong'>
            {name}
          </Text>
          <UserBadges hideName user={user} badgeSize={14} />
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

  const { data: track } = useGetTrackById({ id: trackId }, { force: true })

  if (!track) return null

  return (
    <ComposePreviewInfo
      title={track.title}
      name={track.user.name}
      user={track.user}
      image={
        <TrackImageV2 trackId={trackId} size={SquareSizes.SIZE_150_BY_150} />
      }
    />
  )
}

type ComposerCollectionInfoProps = {
  collectionId: ID
}

export const ComposerCollectionInfo = (props: ComposerCollectionInfoProps) => {
  const { collectionId } = props

  const { data: collection } = useGetPlaylistById(
    { playlistId: collectionId },
    { force: true }
  )

  if (!collection) return null

  return (
    <ComposePreviewInfo
      title={collection.playlist_name}
      name={collection.user.name}
      user={collection.user}
      image={
        <CollectionImageV2
          collectionId={collectionId}
          size={SquareSizes.SIZE_150_BY_150}
        />
      }
    />
  )
}
