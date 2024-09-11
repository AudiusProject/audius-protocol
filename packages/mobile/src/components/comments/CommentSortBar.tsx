import {
  CommentSortMethod,
  useCurrentCommentSection
} from '@audius/common/context'

import { Flex, SelectablePill } from '@audius/harmony-native'

const messages = {
  top: 'Top',
  newest: 'Newest',
  timestamp: 'Timestamp'
}

export const CommentSortBar = () => {
  const { currentSort, setCurrentSort } = useCurrentCommentSection()
  return (
    <Flex gap='s' direction='row'>
      <SelectablePill
        type='radio'
        label={messages.top}
        isSelected={currentSort === CommentSortMethod.top}
        onPress={() => setCurrentSort(CommentSortMethod.top)}
      />
      <SelectablePill
        type='radio'
        label={messages.newest}
        isSelected={currentSort === CommentSortMethod.newest}
        onPress={() => setCurrentSort(CommentSortMethod.newest)}
      />
      <SelectablePill
        type='radio'
        label={messages.timestamp}
        isSelected={currentSort === CommentSortMethod.timestamp}
        onPress={() => setCurrentSort(CommentSortMethod.timestamp)}
      />
    </Flex>
  )
}
