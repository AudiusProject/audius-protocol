import { useCallback, useContext, useEffect, useMemo, useState } from 'react'

import type {
  SearchCategory,
  SearchFilters as SearchFiltersType
} from '@audius/common/api'
import { useExploreContent, useUsers } from '@audius/common/api'
import { exploreMessages as messages } from '@audius/common/messages'
import { Kind } from '@audius/common/models'
import {
  ExploreCollectionsVariant,
  searchSelectors
} from '@audius/common/store'
import type { Mood } from '@audius/sdk'
import { useNavigation } from '@react-navigation/native'
import { MOODS } from 'pages/search-page/moods'
import type { MoodInfo } from 'pages/search-page/types'
import { ImageBackground, ScrollView, Image } from 'react-native'
import { useSelector } from 'react-redux'
import { useDebounce } from 'react-use'

import {
  Flex,
  IconSearch,
  Paper,
  Text,
  TextInput,
  TextInputSize,
  useTheme
} from '@audius/harmony-native'
import imageSearchHeaderBackground from 'app/assets/images/imageSearchHeaderBackground2x.png'
import { CollectionList } from 'app/components/collection-list'
import { Screen, ScreenContent } from 'app/components/core'
import { UserList } from 'app/components/user-list'
// import { useNavigation } from 'app/hooks/useNavigation'
import { useIsUSDCEnabled } from 'app/hooks/useIsUSDCEnabled'
import { useRoute } from 'app/hooks/useRoute'
import { moodMap } from 'app/utils/moods'

import { AppDrawerContext } from '../app-drawer-screen'
import { AccountPictureHeader } from '../app-screen/AccountPictureHeader'
import { RecentSearches } from '../search-screen/RecentSearches'
import { SearchCatalogTile } from '../search-screen/SearchCatalogTile'
import { SearchCategoriesAndFilters } from '../search-screen/SearchCategoriesAndFilters'
import { SearchResults } from '../search-screen/search-results/SearchResults'
import { SearchContext } from '../search-screen/searchState'

import {
  PREMIUM_TRACKS,
  TRENDING_PLAYLISTS,
  TRENDING_UNDERGROUND
} from './collections'
import { ColorTile } from './components/ColorTile'
import { REMIXABLES } from './smartCollections'

const tiles = [
  TRENDING_PLAYLISTS,
  TRENDING_UNDERGROUND,

  PREMIUM_TRACKS,
  REMIXABLES
]

const itemKindByCategory: Record<SearchCategory, Kind | null> = {
  all: null,
  users: Kind.USERS,
  tracks: Kind.TRACKS,
  playlists: Kind.COLLECTIONS,
  albums: Kind.COLLECTIONS
}

const { getSearchHistory } = searchSelectors

export const SearchExploreScreen = () => {
  const { spacing } = useTheme()
  const { params } = useRoute<'Search'>()
  const { drawerHelpers } = useContext(AppDrawerContext)
  const isUSDCPurchasesEnabled = useIsUSDCEnabled()

  // State
  const [category, setCategory] = useState<SearchCategory>(
    params?.category ?? 'all'
  )
  const [filters, setFilters] = useState<SearchFiltersType>(
    params?.filters ?? {}
  )
  const [bpmType, setBpmType] = useState<'range' | 'target'>('range')
  const [autoFocus, setAutoFocus] = useState(params?.autoFocus ?? false)
  const [searchInput, setSearchInput] = useState(params?.query ?? '')
  const [debouncedQuery, setDebouncedQuery] = useState(searchInput)
  useDebounce(
    () => {
      setDebouncedQuery(searchInput)
    },
    400, // debounce delay in ms
    [searchInput]
  )

  useEffect(() => {
    setSearchInput(params?.query ?? '')
    setCategory(params?.category ?? 'all')
    setFilters(params?.filters ?? {})
    setAutoFocus(params?.autoFocus ?? false)
  }, [params])

  // Data fetching
  const { data: exploreContent } = useExploreContent()
  const { data: featuredArtists } = useUsers(exploreContent?.featuredProfiles)
  const { data: featuredLabels } = useUsers(exploreContent?.featuredLabels)

  // Derived data
  const filteredTiles = useMemo(
    () =>
      tiles.filter((tile) => {
        const isPremiumTracksTile =
          tile.variant === ExploreCollectionsVariant.DIRECT_LINK &&
          tile.title === PREMIUM_TRACKS.title
        return !isPremiumTracksTile || isUSDCPurchasesEnabled
      }),
    [isUSDCPurchasesEnabled]
  )

  const history = useSelector(getSearchHistory)
  const categoryKind: Kind | null = category
    ? itemKindByCategory[category]
    : null
  const filteredSearchItems = useMemo(
    () =>
      categoryKind
        ? history.filter((item) => item.kind === categoryKind)
        : history,
    [categoryKind, history]
  )

  // Handlers
  const handleOpenLeftNavDrawer = useCallback(() => {
    drawerHelpers?.openDrawer()
  }, [drawerHelpers])

  const handleMoodPress = useCallback((moodLabel: Mood) => {
    setCategory('tracks')
    setFilters({ mood: moodLabel })
  }, [])

  const moodEntries = useMemo(
    () => Object.entries(MOODS) as [string, MoodInfo][],
    []
  )
  return (
    <SearchContext.Provider
      value={{
        query: debouncedQuery,
        setQuery: setSearchInput,
        category,
        setCategory,
        filters,
        setFilters,
        bpmType,
        setBpmType,
        autoFocus,
        setAutoFocus,
        active: true
      }}
    >
      <Screen url='Explore' header={() => <></>}>
        <ScreenContent>
          <Flex>
            <ImageBackground source={imageSearchHeaderBackground}>
              <Flex pt='unit14' ph='l' pb='l' gap='l'>
                <Flex direction='row' gap='m'>
                  <AccountPictureHeader onPress={handleOpenLeftNavDrawer} />
                  <Text variant='heading' color='staticWhite'>
                    {messages.explore}
                  </Text>
                </Flex>
                <Text variant='title' color='staticWhite'>
                  {messages.description}
                </Text>
                <Flex>
                  <TextInput
                    label='Search'
                    placeholder={messages.searchPlaceholder}
                    size={TextInputSize.SMALL}
                    startIcon={IconSearch}
                    onChangeText={setSearchInput}
                    value={searchInput}
                  />
                </Flex>
              </Flex>
            </ImageBackground>
          </Flex>
          <SearchCategoriesAndFilters />

          <ScrollView>
            {category !== 'all' || searchInput ? (
              <>
                {searchInput || filteredSearchItems.length === 0 ? (
                  <SearchResults />
                ) : (
                  <RecentSearches
                    ListHeaderComponent={<SearchCatalogTile />}
                    searchItems={filteredSearchItems}
                  />
                )}
              </>
            ) : (
              <Flex direction='column' ph='l' pt='xl' pb='3xl' gap='2xl'>
                <Flex gap='l'>
                  <Text variant='title' size='l'>
                    {messages.featuredPlaylists}
                  </Text>
                  <CollectionList
                    horizontal
                    collectionIds={exploreContent?.featuredPlaylists || []}
                    carouselSpacing={spacing.l}
                  />
                </Flex>

                <Flex gap='l'>
                  <Text variant='title' size='l'>
                    {messages.artistSpotlight}
                  </Text>
                  <UserList
                    horizontal
                    profiles={featuredArtists}
                    carouselSpacing={spacing.l}
                  />
                </Flex>

                <Flex gap='l'>
                  <Text variant='title' size='l'>
                    {messages.labelSpotlight}
                  </Text>
                  <UserList
                    horizontal
                    profiles={featuredLabels}
                    carouselSpacing={spacing.l}
                  />
                </Flex>

                <Flex justifyContent='center' gap='l'>
                  <Text variant='title' size='l' textAlign='center'>
                    {messages.exploreByMood}
                  </Text>
                  <Flex
                    wrap='wrap'
                    direction='row'
                    justifyContent='center'
                    gap='s'
                  >
                    {moodEntries.sort().map(([_, moodInfo]) => (
                      <Paper
                        direction='row'
                        key={moodInfo.label}
                        pv='l'
                        ph='xl'
                        gap='m'
                        borderRadius='m'
                        border='default'
                        backgroundColor='white'
                        onPress={() => {
                          handleMoodPress(moodInfo.label)
                        }}
                      >
                        <Image
                          source={moodMap[moodInfo.label]}
                          style={{
                            height: spacing.unit5,
                            width: spacing.unit5
                          }}
                        />

                        <Text variant='title' size='s'>
                          {moodInfo.label}
                        </Text>
                      </Paper>
                    ))}
                  </Flex>
                </Flex>

                <Flex gap='l'>
                  <Text variant='title' size='l'>
                    {messages.bestOfAudius}
                  </Text>
                  <Flex gap='s'>
                    {filteredTiles.map((tile) => (
                      <ColorTile
                        style={{ flex: 1, flexBasis: '100%' }}
                        key={tile.title}
                        {...tile}
                      />
                    ))}
                  </Flex>
                </Flex>
              </Flex>
            )}
          </ScrollView>
        </ScreenContent>
      </Screen>
    </SearchContext.Provider>
  )
}
