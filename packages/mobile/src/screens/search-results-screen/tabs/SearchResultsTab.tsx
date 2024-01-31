import { searchResultsPageSelectors } from '@audius/common/store'
import type { ReactNode } from 'react'

import { Status } from '@audius/common/models'
import { useSelector } from 'react-redux'

import { WithLoader } from 'app/components/with-loader/WithLoader'

import { EmptyResults } from '../EmptyResults'
const { getSearchStatus } = searchResultsPageSelectors

type SearchResultsTabProps = {
  children: ReactNode
  noResults?: boolean
  status?: Status
}

export const SearchResultsTab = (props: SearchResultsTabProps) => {
  const { children, noResults, status } = props
  const searchStatus = useSelector(getSearchStatus)

  return (
    <WithLoader
      loading={Boolean(
        searchStatus === Status.LOADING ||
          (status === Status.LOADING && noResults) ||
          noResults === undefined
      )}
    >
      {noResults ? <EmptyResults /> : <>{children}</>}
    </WithLoader>
  )
}
