import { ReactNode } from 'react'

import Status from 'audius-client/src/common/models/Status'
import { getSearchStatus } from 'audius-client/src/common/store/pages/search-results/selectors'

import LoadingSpinner from 'app/components/loading-spinner'
import { useSelectorWeb } from 'app/hooks/useSelectorWeb'
import { makeStyles } from 'app/styles'

import { EmptyResults } from '../EmptyResults'

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
}

export const SearchResultsTab = (props: SearchResultsTabProps) => {
  const { children, noResults } = props
  const styles = useStyles()
  const status = useSelectorWeb(getSearchStatus)

  if (status === Status.LOADING) {
    return <LoadingSpinner style={styles.spinner} />
  }

  if (noResults) return <EmptyResults />

  return <>{children}</>
}
