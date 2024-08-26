import {
  CommentSortMethod,
  useCurrentCommentSection
} from '@audius/common/context'
import { Flex, SelectablePill } from '@audius/harmony'

const messages = {
  top: 'Top',
  newest: 'Newest',
  timestamp: 'Timestamp'
}

export const CommentSortBar = () => {
  const { currentSort, setCurrentSort } = useCurrentCommentSection()
  return (
    <Flex gap='s'>
      <SelectablePill
        label={messages.top}
        isSelected={currentSort === CommentSortMethod.top}
        onClick={() => setCurrentSort(CommentSortMethod.top)}
      />
      <SelectablePill
        label={messages.newest}
        isSelected={currentSort === CommentSortMethod.newest}
        onClick={() => setCurrentSort(CommentSortMethod.newest)}
      />
      <SelectablePill
        label={messages.timestamp}
        isSelected={currentSort === CommentSortMethod.timestamp}
        onClick={() => setCurrentSort(CommentSortMethod.timestamp)}
      />
    </Flex>
  )
}
