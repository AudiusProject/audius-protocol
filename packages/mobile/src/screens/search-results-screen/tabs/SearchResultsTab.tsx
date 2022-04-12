import { ReactNode, useContext, useEffect, useState } from 'react'

import Status from 'audius-client/src/common/models/Status'
import { getSearchStatus } from 'audius-client/src/common/store/pages/search-results/selectors'

import LoadingSpinner from 'app/components/loading-spinner'
import { useSelectorWeb } from 'app/hooks/useSelectorWeb'
import { makeStyles } from 'app/styles'

import { EmptyResults } from '../EmptyResults'
import { SearchFocusContext } from '../SearchFocusContext'

const useStyles = makeStyles(({ spacing }) => ({
  spinner: {
    marginTop: spacing(6),
    alignSelf: 'center',
    height: spacing(10),
    width: spacing(10)
  }
}))

type SearchResultsTabProps = {
  children: ReactNode
  noResults?: boolean
  status?: Status
}

export const SearchResultsTab = (props: SearchResultsTabProps) => {
  const { children, noResults, status } = props
  const { isFocused } = useContext(SearchFocusContext)
  const styles = useStyles()
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

  if (
    isRefreshing ||
    searchStatus === Status.LOADING ||
    (status === Status.LOADING && noResults)
  ) {
    return <LoadingSpinner style={styles.spinner} />
  }

  if (noResults) return <EmptyResults />

  return <>{children}</>
}
