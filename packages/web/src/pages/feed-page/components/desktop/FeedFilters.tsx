import { FeedFilter } from '@audius/common/models'

import SelectablePills from 'components/selectable-pill/SelectablePills'

type FeedFiltersProps = {
  filter: FeedFilter
  didSelectFilter: (filter: FeedFilter) => void
  initialFilters: FeedFilter[]
}

const messages = {
  allPosts: 'All Posts',
  originalPosts: 'Original Posts',
  reposts: 'Reposts'
}

const filterToTitle = {
  [FeedFilter.ALL]: messages.allPosts,
  [FeedFilter.ORIGINAL]: messages.originalPosts,
  [FeedFilter.REPOST]: messages.reposts
}

/**
 * FeedFilters are the row of selectable pills on the feed for filtering the feed by repost, original, and all.
 */
const FeedFilters = ({
  filter,
  didSelectFilter,
  initialFilters
}: FeedFiltersProps) => {
  const selectedIndex = initialFilters.indexOf(filter)
  const onSelectIndex = (index: number) => {
    if (index === selectedIndex) return
    didSelectFilter(initialFilters[index])
  }

  return (
    <SelectablePills
      content={initialFilters.map((f) => filterToTitle[f])}
      selectedIndex={selectedIndex}
      onClickIndex={onSelectIndex}
    />
  )
}

export default FeedFilters
