import { useCallback, useMemo, useRef, useState } from 'react'

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
import { MOODS } from 'pages/search-page/moods'
import type { MoodInfo } from 'pages/search-page/types'
import { Image } from 'react-native'
import Animated, {
  useAnimatedScrollHandler,
  useSharedValue,
  interpolate,
  useAnimatedStyle,
  Extrapolation,
  withTiming,
  useDerivedValue
} from 'react-native-reanimated'
import { useSelector } from 'react-redux'
import { useDebounce } from 'react-use'

import { Flex, Paper, Text, useTheme } from '@audius/harmony-native'
import { CollectionList } from 'app/components/collection-list'
import { Screen, ScreenContent } from 'app/components/core'
import { RemixCarousel } from 'app/components/remix-carousel/RemixCarousel'
import { UserList } from 'app/components/user-list'
import { useIsUSDCEnabled } from 'app/hooks/useIsUSDCEnabled'
import { useRoute } from 'app/hooks/useRoute'
import { useScrollToTop } from 'app/hooks/useScrollToTop'
import { moodMap } from 'app/utils/moods'

import { RecentSearches } from '../search-screen/RecentSearches'
import { SearchCatalogTile } from '../search-screen/SearchCatalogTile'
import { SearchResults } from '../search-screen/search-results/SearchResults'
import { SearchContext } from '../search-screen/searchState'

import {
  PREMIUM_TRACKS,
  TRENDING_PLAYLISTS,
  TRENDING_UNDERGROUND,
  DOWNLOADS_AVAILABLE
} from './collections'
import { ColorTile } from './components/ColorTile'
import { SearchExploreHeader } from './components/SearchExploreHeader'

const tiles = [
  TRENDING_PLAYLISTS,
  TRENDING_UNDERGROUND,

  PREMIUM_TRACKS,
  DOWNLOADS_AVAILABLE
]

const itemKindByCategory: Record<SearchCategory, Kind | null> = {
  all: null,
  users: Kind.USERS,
  tracks: Kind.TRACKS,
  playlists: Kind.COLLECTIONS,
  albums: Kind.COLLECTIONS
}

const { getSearchHistory } = searchSelectors

// Animation parameters
const HEADER_SLIDE_HEIGHT = 46
const FILTER_SCROLL_THRESHOLD = 300
const HEADER_COLLAPSE_THRESHOLD = 50

export const SearchExploreScreen = () => {
  const { spacing } = useTheme()
  const { params } = useRoute<'Search'>()
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
    200, // debounce delay in ms
    [searchInput]
  )
  const scrollY = useSharedValue(0)
  const filterTranslateY = useSharedValue(0)
  const prevScrollY = useSharedValue(0)
  const scrollDirection = useSharedValue<'up' | 'down'>('down')
  const scrollRef = useRef<Animated.ScrollView>(null)
  // Data fetching
  const { data: exploreContent, isLoading: isExploreContentLoading } =
    useExploreContent()
  const { data: featuredArtists, isLoading: isFeaturedArtistsLoading } =
    useUsers(exploreContent?.featuredProfiles)
  const { data: featuredLabels, isLoading: isFeaturedLabelsLoading } = useUsers(
    exploreContent?.featuredLabels
  )
  const animatedFilterPaddingVertical = useSharedValue(spacing.l)

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
  const hasAnyFilter = Object.values(filters).some(
    (value) => value !== undefined
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
  const handleMoodPress = useCallback((moodLabel: Mood) => {
    setCategory('tracks')
    setFilters({ mood: moodLabel })
    scrollRef.current?.scrollTo({
      y: 0,
      animated: false
    })
  }, [])
  const handleClearSearch = useCallback(() => {
    setSearchInput('')
    scrollRef.current?.scrollTo({
      y: 0,
      animated: false
    })
  }, [])

  const handleSearchInputChange = useCallback((text: string) => {
    setSearchInput(text)
    if (text === '') {
      scrollRef.current?.scrollTo?.({ y: 0, animated: false })
    }
  }, [])

  const moodEntries = useMemo(
    () => Object.entries(MOODS) as [string, MoodInfo][],
    []
  )
  useScrollToTop(() => {
    scrollRef.current?.scrollTo({
      y: 0,
      animated: false
    })
    setCategory('all')
    setFilters({})
    setSearchInput('')
  })

  // Animations
  const scrollHandler = useAnimatedScrollHandler({
    onScroll: (event) => {
      const y = event.contentOffset.y
      const contentHeight = event.contentSize.height
      const layoutHeight = event.layoutMeasurement.height
      const isAtBottom = y + layoutHeight >= contentHeight

      // Only update scroll direction if we're not at the bottom
      // to prevent bounce from interfering
      if (!isAtBottom) {
        if (y > prevScrollY.value) {
          scrollDirection.value = 'down'
        } else if (y < prevScrollY.value) {
          scrollDirection.value = 'up'
        }
      }
      prevScrollY.value = y
      scrollY.value = y

      // Handle filter animation
      if (y > FILTER_SCROLL_THRESHOLD && scrollDirection.value === 'down') {
        filterTranslateY.value = withTiming(-spacing['4xl'])
      } else if (
        y < FILTER_SCROLL_THRESHOLD ||
        scrollDirection.value === 'up'
      ) {
        filterTranslateY.value = withTiming(0)
      }
    }
  })

  useDerivedValue(() => {
    animatedFilterPaddingVertical.value =
      scrollY.value === 0
        ? spacing.l
        : interpolate(
            scrollY.value,
            [0, HEADER_COLLAPSE_THRESHOLD],
            [spacing.l, spacing.m],
            Extrapolation.CLAMP
          )
  })

  // content margin expands when header / filter collapses
  const contentSlideAnimatedStyle = useAnimatedStyle(() => ({
    marginTop:
      scrollY.value === 0
        ? withTiming(0)
        : interpolate(
            scrollY.value,
            [0, HEADER_COLLAPSE_THRESHOLD],
            [0, -HEADER_SLIDE_HEIGHT],
            Extrapolation.CLAMP
          ) +
          interpolate(
            scrollY.value,
            [FILTER_SCROLL_THRESHOLD - 50, FILTER_SCROLL_THRESHOLD],
            [0, -spacing['4xl']],
            Extrapolation.CLAMP
          )
  }))

  // Temporary, all these tiles will be replaced in milestone 2
  const handleBestOfAudiusPress = useCallback((title) => {
    if (title === PREMIUM_TRACKS.title) {
      setCategory('tracks')
      setFilters({ isPremium: true })
      scrollRef.current?.scrollTo({
        y: 0,
        animated: false
      })
    } else if (title === DOWNLOADS_AVAILABLE.title) {
      setCategory('tracks')
      setFilters({ hasDownloads: true })
      scrollRef.current?.scrollTo({
        y: 0,
        animated: false
      })
    }
  }, [])

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
          <SearchExploreHeader
            scrollY={scrollY}
            filterTranslateY={filterTranslateY}
            searchInput={searchInput}
            handleClearSearch={handleClearSearch}
            handleSearchInputChange={handleSearchInputChange}
          />

          <Animated.ScrollView
            ref={scrollRef}
            onScroll={scrollHandler}
            style={[contentSlideAnimatedStyle]}
          >
            {category !== 'all' || searchInput ? (
              <>
                {searchInput || hasAnyFilter ? (
                  <SearchResults />
                ) : filteredSearchItems.length > 0 ? (
                  <RecentSearches
                    ListHeaderComponent={<SearchCatalogTile />}
                    searchItems={filteredSearchItems}
                  />
                ) : (
                  <SearchCatalogTile />
                )}
              </>
            ) : (
              <Flex direction='column' ph='l' pt='xl' pb='3xl'>
                <Flex mb='l'>
                  <Text variant='title' size='l'>
                    {messages.featuredPlaylists}
                  </Text>
                  <CollectionList
                    horizontal
                    collectionIds={exploreContent?.featuredPlaylists ?? []}
                    carouselSpacing={spacing.l}
                    isLoading={isExploreContentLoading}
                  />
                </Flex>
                <Flex mb='l'>
                  <Text variant='title' size='l'>
                    {messages.featuredRemixContests}
                  </Text>
                  <RemixCarousel
                    trackIds={exploreContent?.featuredRemixContests}
                    carouselSpacing={spacing.l}
                    isLoading={isExploreContentLoading}
                  />
                </Flex>
                <Flex mb='l'>
                  <Text variant='title' size='l'>
                    {messages.artistSpotlight}
                  </Text>
                  <UserList
                    horizontal
                    profiles={featuredArtists}
                    carouselSpacing={spacing.l}
                    isLoading={
                      isExploreContentLoading || isFeaturedArtistsLoading
                    }
                  />
                </Flex>
                <Flex mb='l'>
                  <Text variant='title' size='l'>
                    {messages.labelSpotlight}
                  </Text>
                  <UserList
                    horizontal
                    profiles={featuredLabels}
                    carouselSpacing={spacing.l}
                    isLoading={
                      isExploreContentLoading || isFeaturedLabelsLoading
                    }
                  />
                </Flex>

                <Flex gap='l' mb='l'>
                  <Text variant='title' size='l'>
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

                <Flex gap='l' mt='l'>
                  <Text variant='title' size='l'>
                    {messages.bestOfAudius}
                  </Text>
                  <Flex gap='s'>
                    {filteredTiles.map((tile) => (
                      <ColorTile
                        style={{ flex: 1, flexBasis: '100%' }}
                        key={tile.title}
                        onPress={() => handleBestOfAudiusPress(tile.title)}
                        {...tile}
                      />
                    ))}
                  </Flex>
                </Flex>
              </Flex>
            )}
          </Animated.ScrollView>
        </ScreenContent>
      </Screen>
    </SearchContext.Provider>
  )
}
