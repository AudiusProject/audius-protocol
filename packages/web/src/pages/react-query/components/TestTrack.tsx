import { Flex, Text } from '@audius/harmony'

import { useTrack } from 'hooks/useTrack'

type Props = {
  trackId: string
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
      <Text>Play Count: {track.playCount.toLocaleString()}</Text>
    </Flex>
  )
}
