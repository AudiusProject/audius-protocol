import { useTrack } from '@audius/common/api'
import { ID } from '@audius/common/models'
import { Flex, Text } from '@audius/harmony'

type Props = {
  trackId: ID
}

export const TestTrack = ({ trackId }: Props) => {
  const { data: track, isLoading, error } = useTrack(trackId)

  if (isLoading) return <Text>Loading...</Text>
  if (error) return <Text>Error loading track: {error.message}</Text>
  if (!track) return null

  return (
    <Flex direction='column' gap='m'>
      <Text variant='heading'>{track.title}</Text>
      <Text>{track.description || 'No description'}</Text>
      <Text>By: {track.user.name}</Text>
      <Text>Bio: {track.user.bio}</Text>
      <Text>
        Duration: {Math.floor(track.duration / 60)}:
        {(track.duration % 60).toString().padStart(2, '0')}
      </Text>
      <Text>Play Count: {track.play_count.toLocaleString()}</Text>
    </Flex>
  )
}
