import React, { useEffect, useRef } from 'react'

import { Platform } from 'react-native'
import Animated, {
  Extrapolation,
  interpolate,
  useAnimatedScrollHandler,
  useAnimatedStyle,
  useSharedValue,
  withTiming
} from 'react-native-reanimated'

import { Flex, useTheme } from '@audius/harmony-native'
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
  useSearchQuery
} from '../search-screen/searchState'

import { ExploreContent } from './components/ExploreContent'
import { SearchExploreHeader } from './components/SearchExploreHeader'

// Animation parameters
const HEADER_SLIDE_HEIGHT = 46
const FILTER_SCROLL_THRESHOLD = 300
export const SCROLL_FACTOR = Platform.OS === 'ios' ? 1 : 3

const SearchExploreContent = () => {
  const { spacing, motion } = useTheme()
  const { params } = useRoute<'Search'>()

  // Get state from context
  const [category, setCategory] = useSearchCategory()
  const [filters, setFilters] = useSearchFilters()
  const [query, setQuery] = useSearchQuery()
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

  useScrollToTop(() => {
    scrollRef.current?.scrollTo({
      y: 0,
      animated: false
    })
    setQuery('')
    setCategory('all')
    setFilters({})
  })

  useEffect(() => {
    if (query.length <= 1) {
      // Reset scroll on new or empty queries
      scrollRef.current?.scrollTo?.({ y: 0, animated: false })
    }
  })

  // Animations
  const contentPaddingStyle = useAnimatedStyle(() => {
    // Clamped scroll prevents jitter
    return {
      paddingTop:
        query || params?.autoFocus
          ? withTiming(-HEADER_SLIDE_HEIGHT, motion.calm)
          : interpolate(
              scrollY.value,
              [0, 80 * SCROLL_FACTOR],
              [0, 80],
              Extrapolation.CLAMP
            )
    }
  })

  const scrollHandler = useAnimatedScrollHandler({
    onScroll: (event) => {
      const y = event.contentOffset.y
      const contentHeight = event.contentSize.height
      const layoutHeight = event.layoutMeasurement.height
      const isAtBottom = y + layoutHeight >= contentHeight
      const canScroll = contentHeight > layoutHeight

      // Only apply scroll animations if there's enough content to scroll
      // fixes jitter when content is small
      if (!canScroll) {
        scrollY.value = 0
        return
      }

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
        filterTranslateY.value = withTiming(-spacing['4xl'], motion.calm)
      } else if (
        y < FILTER_SCROLL_THRESHOLD ||
        scrollDirection.value === 'up'
      ) {
        filterTranslateY.value = withTiming(0, motion.calm)
      }
    }
  })

  const showSearch = Boolean(category !== 'all' || query)
  return (
    <ScreenContent>
      <SearchExploreHeader
        scrollY={scrollY}
        filterTranslateY={filterTranslateY}
        scrollRef={scrollRef}
      />
      {showSearch && (query || hasAnyFilter) ? (
        <SearchResults />
      ) : showSearch ? (
        <RecentSearches ListHeaderComponent={<SearchCatalogTile />} />
      ) : null}
      <Animated.ScrollView
        ref={scrollRef}
        onScroll={scrollHandler}
        scrollEventThrottle={16} // for android to match iOS
        style={[contentPaddingStyle]}
        showsVerticalScrollIndicator={false}
      >
        <Flex style={{ display: showSearch ? 'none' : 'flex' }}>
          <ExploreContent />
        </Flex>
      </Animated.ScrollView>
    </ScreenContent>
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
      <Screen url='Explore' header={() => <></>}>
        <SearchExploreContent />
      </Screen>
    </SearchProvider>
  )
}
