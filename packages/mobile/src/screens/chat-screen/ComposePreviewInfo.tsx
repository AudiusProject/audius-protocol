import type { ReactNode } from 'react'

import { useCollection, useTrack, useUser } from '@audius/common/api'
import type { ID, UserMetadata } from '@audius/common/models'
import { SquareSizes } from '@audius/common/models'
import { pick } from 'lodash'

import { Flex, Text } from '@audius/harmony-native'
import { CollectionImage } from 'app/components/image/CollectionImage'
import { TrackImage } from 'app/components/image/TrackImage'
import { UserBadges } from 'app/components/user-badges'

type ComposePreviewInfoProps = {
  title?: string
  name?: string
  user?: UserMetadata
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
          {user ? <UserBadges userId={user.user_id} badgeSize='xs' /> : null}
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

  const { data: partialTrack } = useTrack(trackId, {
    select: (track) => pick(track, ['title', 'owner_id'])
  })
  const { data: user } = useUser(partialTrack?.owner_id)

  if (!partialTrack) return null

  return (
    <ComposePreviewInfo
      title={partialTrack.title}
      name={user?.name ?? ''}
      user={user}
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

  const { data: partialCollection } = useCollection(collectionId, {
    select: (collection) =>
      pick(collection, ['playlist_name', 'playlist_owner_id'])
  })
  const { playlist_name: albumTitle, playlist_owner_id: albumOwnerId } =
    partialCollection ?? {}
  const { data: user } = useUser(albumOwnerId)

  if (!partialCollection) return null

  return (
    <ComposePreviewInfo
      title={albumTitle}
      name={user?.name ?? ''}
      user={user}
      image={
        <CollectionImage
          collectionId={collectionId}
          size={SquareSizes.SIZE_150_BY_150}
        />
      }
    />
  )
}
