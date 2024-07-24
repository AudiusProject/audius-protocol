import { useCallback, useEffect, useMemo, useRef, useState } from 'react'

import type {
  SearchCategory,
  SearchFilters as SearchFiltersType
} from '@audius/common/api'
import { Kind } from '@audius/common/models'
import { searchSelectors } from '@audius/common/store'
import { useFocusEffect } from '@react-navigation/native'
import { createNativeStackNavigator } from '@react-navigation/native-stack'
import type { TextInput } from 'react-native/types'
import { useSelector } from 'react-redux'
import { useEffectOnce } from 'react-use'

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
  useSearchAutoFocus,
  useSearchCategory,
  useSearchFilters,
  useSearchQuery
} from './searchState'

const { getV2SearchHistory } = searchSelectors
const Stack = createNativeStackNavigator()

const itemKindByCategory: Record<SearchCategory, Kind | null> = {
  all: null,
  users: Kind.USERS,
  tracks: Kind.TRACKS,
  playlists: Kind.COLLECTIONS,
  albums: Kind.COLLECTIONS
}

export const SearchScreenV2 = () => {
  const [query] = useSearchQuery()
  const [category] = useSearchCategory()
  const [filters] = useSearchFilters()
  const [autoFocus, setAutoFocus] = useSearchAutoFocus()
  const history = useSelector(getV2SearchHistory)
  const categoryKind: Kind | null = category
    ? itemKindByCategory[category]
    : null

  const filteredSearchItems = useMemo(() => {
    return categoryKind
      ? history.filter((item) => item.kind === categoryKind)
      : history
  }, [categoryKind, history])

  const showRecentSearches = filteredSearchItems.length > 0

  const showSearchResults =
    query || Object.values(filters).some((filter) => filter)

  const searchBarRef = useRef<TextInput>(null)
  const [refsSet, setRefsSet] = useState(false)

  useEffectOnce(() => {
    setRefsSet(true)
  })

  useFocusEffect(
    useCallback(() => {
      if (refsSet && autoFocus) {
        setAutoFocus(false)
        searchBarRef.current?.focus()
      }
    }, [autoFocus, refsSet, setAutoFocus])
  )

  return (
    <Screen
      topbarRight={<SearchBarV2 ref={searchBarRef} autoFocus />}
      headerTitle={null}
      variant='white'
    >
      <SearchCategoriesAndFilters />
      <Flex flex={1}>
        {!showSearchResults ? (
          <Flex direction='column' alignItems='center' gap='xl'>
            {showRecentSearches ? (
              <RecentSearches
                ListHeaderComponent={<SearchCatalogTile />}
                searchItems={filteredSearchItems}
              />
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
  const [autoFocus, setAutoFocus] = useState(params.autoFocus ?? false)
  const [query, setQuery] = useState(params.query ?? '')
  const [category, setCategory] = useState<SearchCategory>(
    params.category ?? 'all'
  )
  const [filters, setFilters] = useState<SearchFiltersType>(
    params.filters ?? {}
  )
  const [bpmType, setBpmType] = useState<'range' | 'target'>('range')

  useEffect(() => {
    setQuery(params.query ?? '')
    setCategory(params.category ?? 'all')
    setFilters(params.filters ?? {})
    setAutoFocus(params.autoFocus ?? false)
  }, [params])

  const screenOptions = useAppScreenOptions()

  return (
    <SearchContext.Provider
      value={{
        autoFocus,
        setAutoFocus,
        query,
        setQuery,
        category,
        setCategory,
        filters,
        setFilters,
        bpmType,
        setBpmType
      }}
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
