import { useEffect, useState } from 'react'

import type {
  SearchCategory,
  SearchFilters as SearchFiltersType
} from '@audius/common/api'
import { searchSelectors } from '@audius/common/store'
import { createNativeStackNavigator } from '@react-navigation/native-stack'
import { useSelector } from 'react-redux'

import { Flex } from '@audius/harmony-native'
import { Screen } from 'app/components/core'
import { useRoute } from 'app/hooks/useRoute'

import { useAppScreenOptions } from '../app-screen/useAppScreenOptions'

import { RecentSearches } from './RecentSearches'
import { SearchBarV2 } from './SearchBarV2'
import { SearchCatalogTile } from './SearchCatalogTile'
import { SearchCategoriesAndFilters } from './SearchCategoriesAndFilters'
import {
  FilterBpmScreen,
  FilterGenreScreen,
  FilterMoodScreen,
  FilterMusicalKeyScreen
} from './screens'
import { SearchResults } from './search-results/SearchResults'
import {
  SearchContext,
  useSearchCategory,
  useSearchFilters,
  useSearchQuery
} from './searchState'

const { getV2SearchHistory } = searchSelectors
const Stack = createNativeStackNavigator()

export const SearchScreenV2 = () => {
  const [query] = useSearchQuery()
  const [category] = useSearchCategory()
  const [filters] = useSearchFilters()

  const history = useSelector(getV2SearchHistory)
  const showRecentSearches = history.length > 0

  const showSearchResults =
    query ||
    category !== 'all' ||
    Object.values(filters).some((filter) => filter)

  return (
    <Screen topbarRight={<SearchBarV2 />} headerTitle={null} variant='white'>
      <SearchCategoriesAndFilters />
      <Flex flex={1}>
        {!showSearchResults ? (
          <Flex direction='column' alignItems='center' gap='xl'>
            {showRecentSearches ? (
              <RecentSearches ListHeaderComponent={<SearchCatalogTile />} />
            ) : (
              <SearchCatalogTile />
            )}
          </Flex>
        ) : (
          <SearchResults />
        )}
      </Flex>
    </Screen>
  )
}

export const SearchScreenStack = () => {
  const { params = {} } = useRoute<'Search'>()
  const [query, setQuery] = useState(params.query ?? '')
  const [category, setCategory] = useState<SearchCategory>(
    params.category ?? 'all'
  )
  const [filters, setFilters] = useState<SearchFiltersType>(
    params.filters ?? {}
  )

  useEffect(() => {
    setQuery(params.query ?? '')
    setCategory(params.category ?? 'all')
    setFilters(params.filters ?? {})
  }, [params])

  const screenOptions = useAppScreenOptions()

  return (
    <SearchContext.Provider
      value={{ query, setQuery, category, setCategory, filters, setFilters }}
    >
      <Stack.Navigator screenOptions={screenOptions}>
        <Stack.Screen name='SearchResults' component={SearchScreenV2} />
        <Stack.Group screenOptions={{ presentation: 'fullScreenModal' }}>
          <Stack.Screen name='FilterMood' component={FilterMoodScreen} />
          <Stack.Screen name='FilterGenre' component={FilterGenreScreen} />
          <Stack.Screen name='FilterKey' component={FilterMusicalKeyScreen} />
          <Stack.Screen name='FilterBpm' component={FilterBpmScreen} />
        </Stack.Group>
      </Stack.Navigator>
    </SearchContext.Provider>
  )
}
