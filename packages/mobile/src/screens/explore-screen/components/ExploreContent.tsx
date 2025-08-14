import React from 'react'

import { useFeatureFlag } from '@audius/common/hooks'
import { FeatureFlags } from '@audius/common/services'

import { Flex } from '@audius/harmony-native'
import { RecentSearches } from 'app/screens/search-screen/RecentSearches'
import { useSearchCategory } from 'app/screens/search-screen/searchState'

import { ActiveDiscussions } from './ActiveDiscussions'
import { ArtistSpotlight } from './ArtistSpotlight'
import { BestOfAudiusTiles } from './BestOfAudiusTiles'
import { BestSelling } from './BestSelling'
import { FeaturedPlaylists } from './FeaturedPlaylists'
import { FeaturedRemixContests } from './FeaturedRemixContests'
import { FeelingLucky } from './FeelingLucky'
import { LabelSpotlight } from './LabelSpotlight'
import { MoodsGrid } from './MoodsGrid'
import { MostSharedTracks } from './MostSharedTracks'
import { QuickSearchGrid } from './QuickSearchGrid'
import { RecentPremiumTracks } from './RecentPremiumTracks'
import { RecentlyPlayedTracks } from './RecentlyPlayed'
import { RecommendedTracks } from './RecommendedTracks'
import { TrendingPlaylists } from './TrendingPlaylists'
import { UndergroundTrendingTracks } from './UndergroundTrendingTracks'

const MemoizedExploreContent = () => {
  const [category] = useSearchCategory()
  const { isEnabled: isSearchExploreGoodiesEnabled } = useFeatureFlag(
    FeatureFlags.SEARCH_EXPLORE_GOODIES
  )

  const showTrackContent = category === 'tracks' || category === 'all'
  const showPlaylistContent = category === 'playlists' || category === 'all'
  const showUserContent = category === 'users' || category === 'all'
  const showAlbumContent = category === 'albums' || category === 'all'

  return (
    <Flex gap='2xl' pt='s' pb={150} ph='l'>
      {showTrackContent && <RecommendedTracks />}
      {showTrackContent && <RecentlyPlayedTracks />}
      {showTrackContent && <QuickSearchGrid />}
      {showPlaylistContent && <FeaturedPlaylists />}
      {showTrackContent && <FeaturedRemixContests />}
      {isSearchExploreGoodiesEnabled && showTrackContent && (
        <UndergroundTrendingTracks />
      )}
      {showUserContent && <ArtistSpotlight />}
      {showUserContent && <LabelSpotlight />}
      {isSearchExploreGoodiesEnabled && showTrackContent ? (
        <ActiveDiscussions />
      ) : null}
      {(showTrackContent || showAlbumContent || showPlaylistContent) && (
        <MoodsGrid />
      )}
      {isSearchExploreGoodiesEnabled ? (
        <>
          {showPlaylistContent && <TrendingPlaylists />}
          {showTrackContent && <MostSharedTracks />}
          {(showAlbumContent || showTrackContent) && <BestSelling />}
          {/* TODO: Feeling lucky for playlists/albums
          https://linear.app/audius/issue/PE-6585/feeling-lucky-for-playlistsalbums
           */}
          {showTrackContent && <RecentPremiumTracks />}
          {showTrackContent && <FeelingLucky />}
        </>
      ) : null}
      {!isSearchExploreGoodiesEnabled && <BestOfAudiusTiles />}
      <RecentSearches />
    </Flex>
  )
}

// Memoize the entire component since it has no props
export const ExploreContent = React.memo(MemoizedExploreContent)
