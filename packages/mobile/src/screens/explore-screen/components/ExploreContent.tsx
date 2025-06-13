import React, { useCallback, useMemo } from 'react'

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
import { ScrollView, Image } from 'react-native'
import { useSelector } from 'react-redux'

import { Flex, Paper, Text, useTheme } from '@audius/harmony-native'
import { CollectionList } from 'app/components/collection-list'
import { RemixCarousel } from 'app/components/remix-carousel/RemixCarousel'
import { UserList } from 'app/components/user-list'
import { useIsUSDCEnabled } from 'app/hooks/useIsUSDCEnabled'
import { moodMap } from 'app/utils/moods'

import { RecentSearches } from '../../search-screen/RecentSearches'
import { SearchCatalogTile } from '../../search-screen/SearchCatalogTile'
import { SearchResults } from '../../search-screen/search-results/SearchResults'
import {
  useSearchCategory,
  useSearchFilters,
  useSearchQuery
} from '../../search-screen/searchState'
import {
  PREMIUM_TRACKS,
  TRENDING_PLAYLISTS,
  TRENDING_UNDERGROUND
} from '../collections'
import { REMIXABLES } from '../smartCollections'

import { ColorTile } from './ColorTile'

const tiles = [
  TRENDING_PLAYLISTS,
  TRENDING_UNDERGROUND,
  PREMIUM_TRACKS,
  REMIXABLES
]

const itemKindByCategory: Record<string, Kind | null> = {
  all: null,
  users: Kind.USERS,
  tracks: Kind.TRACKS,
  playlists: Kind.COLLECTIONS,
  albums: Kind.COLLECTIONS
}

const { getSearchHistory } = searchSelectors

export const ExploreContent = () => {
  const { spacing } = useTheme()
  const isUSDCPurchasesEnabled = useIsUSDCEnabled()

  // Get state from context
  const [category, setCategory] = useSearchCategory()
  const [filters, setFilters] = useSearchFilters()
  const [query] = useSearchQuery()

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

  const hasSearchItems = useMemo(
    () =>
      categoryKind
        ? history.some((item) => item.kind === categoryKind)
        : history,
    [categoryKind, history]
  )

  // Handlers
  const handleMoodPress = useCallback(
    (moodLabel: Mood) => {
      setCategory('tracks')
      setFilters({ mood: moodLabel })
    },
    [setCategory, setFilters]
  )

  const moodEntries = useMemo(
    () => Object.entries(MOODS) as [string, MoodInfo][],
    []
  )

  return (
    <ScrollView>
      {category !== 'all' || query ? (
        <>
          {query || hasAnyFilter ? (
            <SearchResults />
          ) : hasSearchItems ? (
            <RecentSearches ListHeaderComponent={<SearchCatalogTile />} />
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
              isLoading={isExploreContentLoading || isFeaturedArtistsLoading}
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
              isLoading={isExploreContentLoading || isFeaturedLabelsLoading}
            />
          </Flex>

          <Flex justifyContent='center' gap='l'>
            <Text variant='title' size='l' textAlign='center'>
              {messages.exploreByMood}
            </Text>
            <Flex wrap='wrap' direction='row' justifyContent='center' gap='s'>
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
  )
}
