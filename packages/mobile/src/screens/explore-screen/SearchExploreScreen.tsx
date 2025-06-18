import React, { useRef } from 'react'

import { searchSelectors } from '@audius/common/store'
import Animated, {
  useAnimatedScrollHandler,
  useSharedValue,
  interpolate,
  useAnimatedStyle,
  Extrapolation,
  withTiming
} from 'react-native-reanimated'
import { useSelector } from 'react-redux'

import { useTheme } from '@audius/harmony-native'
import { Screen, ScreenContent } from 'app/components/core'
import { useRoute } from 'app/hooks/useRoute'
import { useScrollToTop } from 'app/hooks/useScrollToTop'

import { RecentSearches } from '../search-screen/RecentSearches'
import { SearchCatalogTile } from '../search-screen/SearchCatalogTile'
import { SearchResults } from '../search-screen/search-results/SearchResults'
import {
  SearchProvider,
  useSearchCategory,
  useSearchFilters,
  useSearchDebouncedQuery
} from '../search-screen/searchState'

import { ExploreContent } from './components/ExploreContent'
import { SearchExploreHeader } from './components/SearchExploreHeader'

const { getSearchHistory } = searchSelectors

// Animation parameters
const HEADER_SLIDE_HEIGHT = 46
const FILTER_SCROLL_THRESHOLD = 300
const HEADER_COLLAPSE_THRESHOLD = 50

const SearchExploreContent = () => {
  const { spacing } = useTheme()

  // Get state from context
  const [category, setCategory] = useSearchCategory()
  const [filters, setFilters] = useSearchFilters()
  const debouncedQuery = useSearchDebouncedQuery()

  // Animation state
  const scrollY = useSharedValue(0)
  const filterTranslateY = useSharedValue(0)
  const prevScrollY = useSharedValue(0)
  const scrollDirection = useSharedValue<'up' | 'down'>('down')
  const scrollRef = useRef<Animated.ScrollView>(null)

  // Derived data
  const hasAnyFilter = Object.values(filters).some(
    (value) => value !== undefined
  )
  const history = useSelector(getSearchHistory)
  const showRecentSearches = history.length > 0

  useScrollToTop(() => {
    scrollRef.current?.scrollTo({
      y: 0,
      animated: false
    })
    setCategory('all')
    setFilters({})
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

  return (
    <Screen url='Explore' header={() => <></>}>
      <ScreenContent>
        <SearchExploreHeader
          scrollY={scrollY}
          filterTranslateY={filterTranslateY}
          scrollRef={scrollRef}
        />

        <Animated.ScrollView
          ref={scrollRef}
          onScroll={scrollHandler}
          style={[contentSlideAnimatedStyle]}
        >
          {category !== 'all' || debouncedQuery ? (
            <>
              {debouncedQuery || hasAnyFilter ? (
                <SearchResults />
              ) : showRecentSearches ? (
                <RecentSearches ListHeaderComponent={<SearchCatalogTile />} />
              ) : (
                <SearchCatalogTile />
              )}
            </>
          ) : (
            <ExploreContent />
          )}
        </Animated.ScrollView>
      </ScreenContent>
    </Screen>
  )
}

export const SearchExploreScreen = () => {
  const { params } = useRoute<'Search'>()

  return (
    <SearchProvider
      initialCategory={params?.category ?? 'all'}
      initialFilters={params?.filters ?? {}}
      initialAutoFocus={params?.autoFocus ?? false}
      initialQuery={params?.query ?? ''}
    >
      <SearchExploreContent />
    </SearchProvider>
  )
}
