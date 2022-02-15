import FeedFilter from 'audius-client/src/common/models/FeedFilter'

import { messages } from 'app/components/feed-filter-drawer'
import { HeaderButton } from 'app/components/header-button'

const messageMap = {
  [FeedFilter.ALL]: messages.filterAll,
  [FeedFilter.ORIGINAL]: messages.filterOriginal,
  [FeedFilter.REPOST]: messages.filterReposts
}

// HeaderButton for filtering feed by All/Original/Repost
type FeedFilterButtonProps = {
  currentFilter: FeedFilter
  onPress: () => void
}

export const FeedFilterButton = ({
  currentFilter,
  onPress
}: FeedFilterButtonProps) => {
  return <HeaderButton onPress={onPress} text={messageMap[currentFilter]} />
}
