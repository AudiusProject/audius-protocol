import React, { useEffect, useRef } from 'react'

import Animated, {
  useAnimatedScrollHandler,
  useSharedValue,
  interpolate,
  useAnimatedStyle,
  Extrapolation,
  withTiming
} from 'react-native-reanimated'

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
  useSearchQuery
} from '../search-screen/searchState'

import { ExploreContent } from './components/ExploreContent'
import { SearchExploreHeader } from './components/SearchExploreHeader'

// Animation parameters
const HEADER_SLIDE_HEIGHT = 46
const FILTER_SCROLL_THRESHOLD = 300
const HEADER_COLLAPSE_THRESHOLD = 50

const SearchExploreContent = () => {
  const { spacing, motion } = useTheme()

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

  // content margin expands when header / filter collapses
  const contentSlideAnimatedStyle = useAnimatedStyle(() => ({
    marginTop: query
      ? withTiming(-HEADER_COLLAPSE_THRESHOLD * 2.5, motion.calm)
      : scrollY.value === 0
        ? withTiming(0, motion.calm)
        : interpolate(
            scrollY.value,
            [0, HEADER_COLLAPSE_THRESHOLD],
            [0, -HEADER_SLIDE_HEIGHT],
            Extrapolation.CLAMP
          ) +
          interpolate(
            scrollY.value,
            [
              FILTER_SCROLL_THRESHOLD - HEADER_COLLAPSE_THRESHOLD,
              FILTER_SCROLL_THRESHOLD
            ],
            [0, -spacing['4xl']],
            Extrapolation.CLAMP
          )
  }))

  const contentPaddingStyle = useAnimatedStyle(() => ({
    paddingTop: query
      ? withTiming(80, motion.calm)
      : scrollY.value === 0
        ? withTiming(0, motion.calm)
        : interpolate(scrollY.value, [0, 80], [0, 80], Extrapolation.CLAMP) +
          filterTranslateY.value,
    // Add minimum height to prevent jitter with small content
    minHeight: '100%'
  }))

  return (
    <ScreenContent>
      <SearchExploreHeader
        scrollY={scrollY}
        filterTranslateY={filterTranslateY}
        scrollRef={scrollRef}
      />

      <Animated.ScrollView
        ref={scrollRef}
        onScroll={scrollHandler}
        style={[contentSlideAnimatedStyle, contentPaddingStyle]}
        showsVerticalScrollIndicator={false}
      >
        {category !== 'all' || query ? (
          <>
            {query || hasAnyFilter ? (
              <SearchResults />
            ) : (
              <RecentSearches ListHeaderComponent={<SearchCatalogTile />} />
            )}
          </>
        ) : (
          <ExploreContent />
        )}
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
