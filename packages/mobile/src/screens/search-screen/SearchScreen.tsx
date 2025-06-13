import { useCallback, useMemo, useRef, useState } from 'react'

import type { SearchCategory } from '@audius/common/api'
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
import { SearchBar } from './SearchBar'
import { SearchCatalogTile } from './SearchCatalogTile'
import { SearchCategoriesAndFilters } from './SearchCategoriesAndFilters'
import { SearchResults } from './search-results/SearchResults'
import {
  SearchProvider,
  useSearchAutoFocus,
  useSearchCategory,
  useSearchFilters,
  useSearchQuery
} from './searchState'

const { getSearchHistory } = searchSelectors

const itemKindByCategory: Record<SearchCategory, Kind | null> = {
  all: null,
  users: Kind.USERS,
  tracks: Kind.TRACKS,
  playlists: Kind.COLLECTIONS,
  albums: Kind.COLLECTIONS
}

const SearchScreen = () => {
  const [query] = useSearchQuery()
  const [category] = useSearchCategory()
  const [filters] = useSearchFilters()
  const [autoFocus, setAutoFocus] = useSearchAutoFocus()

  const history = useSelector(getSearchHistory)
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
      topbarRight={<SearchBar ref={searchBarRef} autoFocus />}
      headerTitle={null}
      variant='white'
    >
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

const Stack = createNativeStackNavigator()

export const SearchScreenStack = () => {
  const { params } = useRoute<'Search'>()

  const screenOptions = useAppScreenOptions()

  return (
    <SearchProvider
      initialCategory={params?.category ?? 'all'}
      initialFilters={params?.filters ?? {}}
      initialAutoFocus={params?.autoFocus ?? false}
      initialQuery={params?.query ?? ''}
    >
      <Stack.Navigator screenOptions={screenOptions}>
        <Stack.Screen name='SearchResults' component={SearchScreen} />
      </Stack.Navigator>
    </SearchProvider>
  )
}
