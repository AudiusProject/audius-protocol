import { Flex, Text } from '@audius/harmony-native'

import { useGetSearchResults } from '../searchState'

export const TrackResults = () => {
  const { data } = useGetSearchResults('tracks')
  return (
    <Flex>
      {data?.map((track) => (
        <Text key={track.track_id}>{track.title}</Text>
      ))}
    </Flex>
  )
}
