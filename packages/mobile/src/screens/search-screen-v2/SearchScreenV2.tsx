import { useState } from 'react'

import type {
  SearchCategory,
  SearchFilters as SearchFiltersType
} from '@audius/common/api'
import { createNativeStackNavigator } from '@react-navigation/native-stack'

import { Flex } from '@audius/harmony-native'
import { Screen } from 'app/components/core'
import { useRoute } from 'app/hooks/useRoute'

import { useAppScreenOptions } from '../app-screen/useAppScreenOptions'

import { RecentSearches } from './RecentSearches'
import { SearchBarV2 } from './SearchBarV2'
import { SearchCatalogTile } from './SearchCatalogTile'
import { SearchCategoriesAndFilters } from './SearchCategoriesAndFilters'
import {
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

const Stack = createNativeStackNavigator()

export const SearchScreenV2 = () => {
  const [query] = useSearchQuery()
  const [category] = useSearchCategory()
  const [filters] = useSearchFilters()
  const showSearchResults =
    query ||
    category !== 'all' ||
    Object.values(filters).some((filter) => filter)

  return (
    <Screen topbarRight={<SearchBarV2 />} headerTitle={null} variant='white'>
      <SearchCategoriesAndFilters />
      {!showSearchResults ? (
        <Flex direction='column' alignItems='center' gap='xl'>
          <SearchCatalogTile />
          <RecentSearches />
        </Flex>
      ) : (
        <SearchResults />
      )}
    </Screen>
  )
}

type SearchScreenProps = {
  Stack: any
}

export const SearchScreen = (props: SearchScreenProps) => {
  const { Stack } = props
  return (
    <Stack.Group>
      <Stack.Screen name='Search' component={SearchScreenV2} />
    </Stack.Group>
  )
}

export const searchScreenStack = (Stack: any) => {
  return (
    <Stack.Group>
      <Stack.Screen name='Search' component={SearchScreenV2} />
    </Stack.Group>
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
        </Stack.Group>
      </Stack.Navigator>
    </SearchContext.Provider>
  )
}
