import { Dimensions } from 'react-native'

import { Flex } from '@audius/harmony-native'
import { Screen } from 'app/components/core'

import { SearchBar } from '../search-screen/SearchBar'

import { RecentSearches } from './RecentSearches'
import { SearchCatalogTile } from './SearchCatalogTile'
import { SearchFilters } from './SearchFilters'

const searchBarWidth = Dimensions.get('window').width - 80

export const SearchScreenV2 = () => {
  const showSearchResults = false
  return (
    <Screen
      topbarRight={<SearchBar style={{ width: searchBarWidth }} />}
      headerTitle={null}
      variant='white'
    >
      <SearchFilters />
      {!showSearchResults ? (
        <Flex direction='column' alignItems='center'>
          <SearchCatalogTile />
          <RecentSearches />
        </Flex>
      ) : null}
    </Screen>
  )
}
