import { useState } from 'react'

import type {
  SearchCategory,
  SearchFilters as SearchFiltersType
} from '@audius/common/api'

import { Flex } from '@audius/harmony-native'
import { Screen } from 'app/components/core'

import { RecentSearches } from './RecentSearches'
import { SearchBarV2 } from './SearchBarV2'
import { SearchCatalogTile } from './SearchCatalogTile'
import { SearchCategoriesAndFilters } from './SearchCategoriesAndFilters'
import { SearchContext } from './searchState'

export const SearchScreenV2 = () => {
  const [query, setQuery] = useState('')
  const [category, setCategory] = useState<SearchCategory>('all')
  const [filters, setFilters] = useState<SearchFiltersType>({})

  const showSearchResults =
    query || Object.values(filters).some((filter) => filter)

  return (
    <Screen topbarRight={<SearchBarV2 />} headerTitle={null} variant='white'>
      <SearchContext.Provider
        value={{ query, setQuery, category, setCategory, filters, setFilters }}
      >
        <SearchCategoriesAndFilters />
        {!showSearchResults ? (
          <Flex direction='column' alignItems='center' gap='xl'>
            <SearchCatalogTile />
            <RecentSearches />
          </Flex>
        ) : null}
      </SearchContext.Provider>
    </Screen>
  )
}
