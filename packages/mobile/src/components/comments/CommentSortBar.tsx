import { useCurrentCommentSection } from '@audius/common/context'
import { TrackCommentsSortMethodEnum } from '@audius/sdk'

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
        isSelected={currentSort === TrackCommentsSortMethodEnum.Top}
        onPress={() => setCurrentSort(TrackCommentsSortMethodEnum.Top)}
      />
      <SelectablePill
        type='radio'
        label={messages.newest}
        isSelected={currentSort === TrackCommentsSortMethodEnum.Newest}
        onPress={() => setCurrentSort(TrackCommentsSortMethodEnum.Newest)}
      />
      <SelectablePill
        type='radio'
        label={messages.timestamp}
        isSelected={currentSort === TrackCommentsSortMethodEnum.Timestamp}
        onPress={() => setCurrentSort(TrackCommentsSortMethodEnum.Timestamp)}
      />
    </Flex>
  )
}
