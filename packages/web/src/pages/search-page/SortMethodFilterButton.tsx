import { FilterButton } from '@audius/harmony'

import { useSearchParams, useUpdateSearchParams } from './hooks'

const messages = {
  sortOptionsLabel: 'Sort By'
}

export const SortMethodFilterButton = () => {
  const searchParams = useSearchParams()
  const { sortMethod } = searchParams
  const updateSortParam = useUpdateSearchParams('sortMethod')

  return (
    <FilterButton
      value={sortMethod ?? 'relevant'}
      variant='replaceLabel'
      optionsLabel={messages.sortOptionsLabel}
      onChange={updateSortParam}
      options={[
        { label: 'Most Relevant', value: 'relevant' },
        { label: 'Most Popular', value: 'popular' },
        { label: 'Most Recent', value: 'recent' }
      ]}
    />
  )
}
