import { Flex, Text } from '@audius/harmony-native'
import { useGetSearchResults } from '../searchState'

export const TrackResults = () => {
  const { data } = useGetSearchResults('tracks')
  return (
    <Flex>
      {data?.map((track) => (
        <Text>{track.title}</Text>
      ))}
    </Flex>
  )
}
