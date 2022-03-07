import { useSelector } from 'react-redux'

import { Screen } from 'app/components/core'
import { Header } from 'app/components/header'
import {
  getSearchQuery,
  getSearchResultQuery,
  getSearchResults
} from 'app/store/search/selectors'
import { makeStyles } from 'app/styles'

import { SearchBar } from './SearchBar'
import SearchHistory from './SearchHistory'
import SearchResults from './SearchResults'
import EmptySearch from './content/EmptySearch'

const useStyles = makeStyles(({ spacing }) => ({
  topbarLeft: {
    flexGrow: 0,
    flexBasis: 0,
    paddingTop: spacing(2) + 1,
    paddingHorizontal: spacing(2)
  },
  topbarRight: {
    width: '100%',
    paddingRight: spacing(2)
  }
}))

export const SearchScreen = () => {
  const styles = useStyles()
  const searchQuery = useSelector(getSearchQuery)
  const searchResultQuery = useSelector(getSearchResultQuery)
  const searchResults = useSelector(getSearchResults)
  const hasResults = Object.values(searchResults).some(
    result => result && result.length > 0
  )

  const renderBody = () => {
    if (searchQuery && hasResults) {
      return <SearchResults />
    }
    if (searchQuery && searchResultQuery && !hasResults) {
      return <EmptySearch query={searchResultQuery} />
    }
    return <SearchHistory />
  }

  return (
    <Screen
      topbarRight={<SearchBar />}
      topbarRightStyle={styles.topbarRight}
      topbarLeftStyle={styles.topbarLeft}
      variant='white'
      title='none'
    >
      <Header text='Search' />
      {renderBody()}
    </Screen>
  )
}
