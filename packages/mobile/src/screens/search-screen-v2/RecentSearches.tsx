import { recentSearchMessages as messages } from '@audius/common/messages'
import { searchSelectors } from '@audius/common/store'
import { useSelector } from 'react-redux'

import { Flex, Text } from '@audius/harmony-native'

const { getV2SearchHistory } = searchSelectors

export const RecentSearches = () => {
  const history = useSelector(getV2SearchHistory)

  return (
    <Flex gap='l'>
      <Text variant='title'>{messages.title}</Text>
      {history.map((item) => (
        <Text key={item.id}>{item.id}</Text>
      ))}
    </Flex>
  )
}
