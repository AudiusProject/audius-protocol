import { useCallback, useContext, useMemo, useState } from 'react'

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
import { filter } from 'lodash'
import { MOODS } from 'pages/search-page/moods'
import type { MoodInfo } from 'pages/search-page/types'
import { ImageBackground, ScrollView, Image } from 'react-native'
import Animated, {
  useAnimatedScrollHandler,
  useSharedValue,
  interpolate,
  useAnimatedStyle,
  interpolateColor,
  Extrapolate,
  Extrapolation,
  withTiming
} from 'react-native-reanimated'
import { useSelector } from 'react-redux'
import { useDebounce } from 'react-use'

import {
  Flex,
  IconButton,
  IconCloseAlt,
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
import { RemixCarousel } from 'app/components/remix-carousel/RemixCarousel'
import { UserList } from 'app/components/user-list'
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
const AnimatedFlex = Animated.createAnimatedComponent(Flex)
const AnimatedText = Animated.createAnimatedComponent(Text)

const HEADER_SLIDE_HEIGHT = 46

export const SearchExploreScreen = () => {
  const { spacing, color } = useTheme()
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
  const scrollY = useSharedValue(0)
  const [showFullHeader, setShowFullHeader] = useState(true)
  const headerHeight = useSharedValue(1) // 1 for full height, 0 for collapsed
  const filterTranslateY = useSharedValue(0)

  // Data fetching
  const { data: exploreContent, isLoading: isExploreContentLoading } =
    useExploreContent()
  const { data: featuredArtists, isLoading: isFeaturedArtistsLoading } =
    useUsers(exploreContent?.featuredProfiles)
  const { data: featuredLabels, isLoading: isFeaturedLabelsLoading } = useUsers(
    exploreContent?.featuredLabels
  )
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
  const handleOpenLeftNavDrawer = useCallback(() => {
    drawerHelpers?.openDrawer()
  }, [drawerHelpers])

  const handleMoodPress = useCallback((moodLabel: Mood) => {
    setCategory('tracks')
    setFilters({ mood: moodLabel })
  }, [])
  const handleClearSearch = useCallback(() => {
    setSearchInput('')
  }, [])

  const moodEntries = useMemo(
    () => Object.entries(MOODS) as [string, MoodInfo][],
    []
  )

  // Define the scroll threshold for when to hide/show filters
  const FILTER_SCROLL_THRESHOLD = 300
  const HEADER_COLLAPSE_THRESHOLD = 20

  const scrollHandler = useAnimatedScrollHandler({
    onScroll: (event) => {
      scrollY.value = event.contentOffset.y
      // headerHeight.value = scrollY.value <= 0 ? 1 : 0
      console.log('asdf scrollY.value', scrollY.value, headerHeight.value)
    }
  })

  const headerTextAnimatedStyle = useAnimatedStyle(() => ({
    opacity: interpolate(
      scrollY.value,
      [0, HEADER_COLLAPSE_THRESHOLD],
      [1, 0],
      Extrapolation.CLAMP
    ),
    height: interpolate(
      scrollY.value,
      [HEADER_COLLAPSE_THRESHOLD, HEADER_COLLAPSE_THRESHOLD + 30],
      [48, 0],
      Extrapolation.CLAMP
    )
  }))

  const inputAnimatedStyle = useAnimatedStyle(() => ({
    transform: [
      {
        scale: interpolate(
          scrollY.value,
          [0, HEADER_COLLAPSE_THRESHOLD], // scroll range
          [1, 0.83], // scale range
          Extrapolation.CLAMP
        )
      },
      {
        translateX: interpolate(
          scrollY.value,
          [0, HEADER_COLLAPSE_THRESHOLD], // scroll range
          [0, 30],
          Extrapolation.CLAMP
        )
      }
    ]
  }))

  const headerSlideAnimatedStyle = useAnimatedStyle(() => ({
    transform: [
      {
        translateY: interpolate(
          scrollY.value,
          [0, HEADER_COLLAPSE_THRESHOLD], // adjust as needed
          [0, -HEADER_SLIDE_HEIGHT], // slide up by HEADER_SLIDE_HEIGHT
          Extrapolation.CLAMP
        )
      }
    ]
  }))
  const avatarSlideAnimatedStyle = useAnimatedStyle(() => ({
    transform: [
      {
        translateY: interpolate(
          scrollY.value,
          [0, HEADER_COLLAPSE_THRESHOLD], // adjust as needed
          [0, HEADER_SLIDE_HEIGHT], // slide up by 30px
          Extrapolation.CLAMP
        )
      }
    ]
  }))

  const headerPaddingShrinkStyle = useAnimatedStyle(() => ({
    paddingVertical: interpolate(
      scrollY.value,
      [0, HEADER_COLLAPSE_THRESHOLD], // scroll range
      [spacing.l, spacing.s], // padding range
      Extrapolation.CLAMP
    ),
    gap: interpolate(
      scrollY.value,
      [0, HEADER_COLLAPSE_THRESHOLD], // scroll range
      [spacing.l, 0], // padding range
      Extrapolation.CLAMP
    )
  }))

  const filtersAnimatedStyle = useAnimatedStyle(() => ({
    // display: scrollY.value > 300 ? 'none' : 'flex',
    transform: [
      {
        translateY:
          interpolate(
            scrollY.value,
            [0, HEADER_COLLAPSE_THRESHOLD], // adjust as needed
            [0, -HEADER_SLIDE_HEIGHT], // slide up by HEADER_SLIDE_HEIGHT
            Extrapolation.CLAMP
          ) +
          interpolate(
            scrollY.value,
            [FILTER_SCROLL_THRESHOLD - 50, FILTER_SCROLL_THRESHOLD], // adjust as needed
            [0, -spacing['4xl']], // slide up by HEADER_SLIDE_HEIGHT
            Extrapolation.CLAMP
          )
      }
    ],
    backgroundColor: interpolateColor(
      scrollY.value,
      [0, HEADER_COLLAPSE_THRESHOLD], // scroll range
      [color.background.default, color.neutral.n25]
    ),
    borderColor: interpolateColor(
      scrollY.value,
      [0, HEADER_COLLAPSE_THRESHOLD], // scroll range
      [color.border.strong, color.neutral.n25]
    )
  }))

  const contentSlideAnimatedStyle = useAnimatedStyle(() => ({
    marginTop:
      interpolate(
        scrollY.value,
        [0, HEADER_COLLAPSE_THRESHOLD], // adjust as needed
        [0, -HEADER_SLIDE_HEIGHT], // slide up by HEADER_SLIDE_HEIGHT
        Extrapolation.CLAMP
      ) +
      interpolate(
        scrollY.value,
        [FILTER_SCROLL_THRESHOLD - 50, FILTER_SCROLL_THRESHOLD], // adjust as needed
        [0, -spacing['4xl']], // slide up by HEADER_SLIDE_HEIGHT
        Extrapolation.CLAMP
      )
  }))

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
          <AnimatedFlex style={[{ zIndex: 2 }, headerSlideAnimatedStyle]}>
            <ImageBackground source={imageSearchHeaderBackground}>
              <AnimatedFlex pt='unit14' ph='l' style={headerPaddingShrinkStyle}>
                <Flex
                  direction='row'
                  gap='m'
                  h={spacing.unit11}
                  alignItems='center'
                >
                  <Animated.View
                    style={[inputAnimatedStyle, avatarSlideAnimatedStyle]}
                  >
                    <Flex w={spacing.unit10}>
                      <AccountPictureHeader onPress={handleOpenLeftNavDrawer} />
                    </Flex>
                  </Animated.View>
                  <Animated.View
                    style={[
                      headerTextAnimatedStyle,
                      { justifyContent: 'center' }
                    ]}
                  >
                    <Text variant='heading' color='staticWhite'>
                      {messages.explore}
                    </Text>
                  </Animated.View>
                </Flex>
                <AnimatedText
                  variant='title'
                  color='staticWhite'
                  style={[headerTextAnimatedStyle]}
                >
                  {messages.description}
                </AnimatedText>
                <Animated.View style={inputAnimatedStyle}>
                  <TextInput
                    label='Search'
                    autoFocus={autoFocus}
                    placeholder={messages.searchPlaceholder}
                    size={TextInputSize.SMALL}
                    startIcon={IconSearch}
                    onChangeText={setSearchInput}
                    value={searchInput}
                    endIcon={(props) => (
                      <IconButton
                        icon={IconCloseAlt}
                        color='subdued'
                        onPress={handleClearSearch}
                        hitSlop={10}
                        {...props}
                      />
                    )}
                  />
                </Animated.View>
              </AnimatedFlex>
            </ImageBackground>
          </AnimatedFlex>
          <AnimatedFlex style={[filtersAnimatedStyle, { zIndex: 1 }]}>
            <SearchCategoriesAndFilters />
          </AnimatedFlex>

          <Animated.ScrollView
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
          </Animated.ScrollView>
        </ScreenContent>
      </Screen>
    </SearchContext.Provider>
  )
}
