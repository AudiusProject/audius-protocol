import { useCollection } from '@audius/common/api'
import { ID } from '@audius/common/models'
import { Flex, Text } from '@audius/harmony'

type Props = {
  playlistId: ID
}

export const TestCollection = ({ playlistId }: Props) => {
  const { data: collection, isLoading, error } = useCollection(playlistId)

  if (isLoading) return <Text>Loading...</Text>
  if (error) return <Text>Error loading collection: {error.message}</Text>
  if (!collection) return null

  return (
    <Flex direction='column' gap='m'>
      <Text variant='heading'>{collection.playlist_name}</Text>
      <Text>{collection.description || 'No description'}</Text>
      <Text>By: {collection.user.name}</Text>
      <Text>Bio: {collection.user.bio}</Text>
      <Text>
        Track Count: {collection.playlist_contents?.track_ids?.length}
      </Text>
      <Text>Repost Count: {collection.repost_count}</Text>
      <Text>Track 1: {collection.tracks?.[0].title}</Text>
      <Text>Track 1 User: {collection.tracks?.[0].user.name}</Text>
      <Text>Track 1 User Bio: {collection.tracks?.[0].user.bio}</Text>
    </Flex>
  )
}
