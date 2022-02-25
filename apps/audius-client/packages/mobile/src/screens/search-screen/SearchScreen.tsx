import { useSelector } from 'react-redux'

import { Screen } from 'app/components/core'
import { Header } from 'app/components/header'
import {
  getSearchQuery,
  getSearchResultQuery,
  getSearchResults
} from 'app/store/search/selectors'

import { SearchBar } from './SearchBar'
import SearchHistory from './SearchHistory'
import SearchResults from './SearchResults'
import EmptySearch from './content/EmptySearch'

export const SearchScreen = () => {
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
      topbarRightStyle={{ flex: 1, width: '100%', paddingLeft: 16 }}
      variant='white'
      title={null}
      noPadding
    >
      <Header text='Search' />
      {renderBody()}
    </Screen>
  )
}
