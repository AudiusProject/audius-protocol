import type { ReactNode } from 'react'
import { useContext, useEffect, useState } from 'react'

import { Status } from '@audius/common'
import { getSearchStatus } from 'audius-client/src/common/store/pages/search-results/selectors'

import { WithLoader } from 'app/components/with-loader/WithLoader'
import { useSelectorWeb } from 'app/hooks/useSelectorWeb'

import { EmptyResults } from '../EmptyResults'
import { SearchFocusContext } from '../SearchFocusContext'

type SearchResultsTabProps = {
  children: ReactNode
  noResults?: boolean
  status?: Status
}

export const SearchResultsTab = (props: SearchResultsTabProps) => {
  const { children, noResults, status } = props
  const { isFocused } = useContext(SearchFocusContext)
  const searchStatus = useSelectorWeb(getSearchStatus)
  const [isRefreshing, setIsRefreshing] = useState(true)

  useEffect(() => {
    if (!isFocused) {
      // Prevents a large rerender in the middle of a stack navigation.
      // Note: having to manage status with navigation focus may not be needed
      // when move common store into native.
      setTimeout(() => {
        setIsRefreshing(true)
      }, 1000)
    }
    if (searchStatus === Status.LOADING) {
      setIsRefreshing(false)
    }
  }, [isFocused, searchStatus])

  return (
    <WithLoader
      loading={Boolean(
        isRefreshing ||
          searchStatus === Status.LOADING ||
          (status === Status.LOADING && noResults)
      )}
    >
      {noResults ? <EmptyResults /> : <>{children}</>}
    </WithLoader>
  )
}
