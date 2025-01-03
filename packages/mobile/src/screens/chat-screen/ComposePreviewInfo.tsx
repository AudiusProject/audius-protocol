import type { ReactNode } from 'react'

import { useCollection, useTrack } from '@audius/common/api'
import type { ID, UserMetadata } from '@audius/common/models'
import { SquareSizes } from '@audius/common/models'

import { Flex, Text } from '@audius/harmony-native'
import { CollectionImage } from 'app/components/image/CollectionImage'
import { TrackImage } from 'app/components/image/TrackImage'
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
      <Flex
        direction='column'
        alignItems='flex-start'
        justifyContent='center'
        backgroundColor='surface1'
        mr='4xl'
      >
        <Text variant='body' strength='strong' numberOfLines={1}>
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

  const { data: track } = useTrack(trackId)

  if (!track) return null

  return (
    <ComposePreviewInfo
      title={track.title}
      name={track.user.name}
      user={track.user}
      image={
        <TrackImage trackId={trackId} size={SquareSizes.SIZE_150_BY_150} />
      }
    />
  )
}

type ComposerCollectionInfoProps = {
  collectionId: ID
}

export const ComposerCollectionInfo = (props: ComposerCollectionInfoProps) => {
  const { collectionId } = props

  const { data: collection } = useCollection(collectionId)

  if (!collection) return null

  return (
    <ComposePreviewInfo
      title={collection.playlist_name}
      name={collection.user.name}
      user={collection.user}
      image={
        <CollectionImage
          collectionId={collectionId}
          size={SquareSizes.SIZE_150_BY_150}
        />
      }
    />
  )
}
