import { useCurrentCommentSection } from '@audius/common/context'
import { Flex, SelectablePill } from '@audius/harmony'
import { TrackCommentsSortMethodEnum } from '@audius/sdk'

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
        isSelected={currentSort === TrackCommentsSortMethodEnum.Top}
        onClick={() => setCurrentSort(TrackCommentsSortMethodEnum.Top)}
      />
      <SelectablePill
        label={messages.newest}
        isSelected={currentSort === TrackCommentsSortMethodEnum.Newest}
        onClick={() => setCurrentSort(TrackCommentsSortMethodEnum.Newest)}
      />
      <SelectablePill
        label={messages.timestamp}
        isSelected={currentSort === TrackCommentsSortMethodEnum.Timestamp}
        onClick={() => setCurrentSort(TrackCommentsSortMethodEnum.Timestamp)}
      />
    </Flex>
  )
}
