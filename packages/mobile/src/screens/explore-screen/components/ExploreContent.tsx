import React from 'react'

import { Flex } from '@audius/harmony-native'
import { RecentSearches } from 'app/screens/search-screen/RecentSearches'
import { useSearchCategory } from 'app/screens/search-screen/searchState'

import { ActiveDiscussions } from './ActiveDiscussions'
import { ArtistSpotlight } from './ArtistSpotlight'
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
      {showTrackContent && <UndergroundTrendingTracks />}
      {showUserContent && <ArtistSpotlight />}
      {showUserContent && <LabelSpotlight />}
      {showTrackContent && <ActiveDiscussions />}
      {(showTrackContent || showAlbumContent || showPlaylistContent) && (
        <MoodsGrid />
      )}
      {showPlaylistContent && <TrendingPlaylists />}
      {showTrackContent && <MostSharedTracks />}
      {(showAlbumContent || showTrackContent) && <BestSelling />}
      {/* TODO: Feeling lucky for playlists/albums
      https://linear.app/audius/issue/PE-6585/feeling-lucky-for-playlistsalbums
       */}
      {showTrackContent && <RecentPremiumTracks />}
      {showTrackContent && <FeelingLucky />}
      <RecentSearches />
    </Flex>
  )
}

// Memoize the entire component since it has no props
export const ExploreContent = React.memo(MemoizedExploreContent)
