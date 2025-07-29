import React from 'react'

import { useFeatureFlag } from '@audius/common/hooks'
import { FeatureFlags } from '@audius/common/services'

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
import { ProgressiveScrollView } from './ProgressiveScrollView'
import { QuickSearchGrid } from './QuickSearch'
import { RecentPremiumTracks } from './RecentPremiumTracks'
import { RecentlyPlayedTracks } from './RecentlyPlayed'
import { RecommendedTracks } from './RecommendedTracks'
import { TrendingPlaylists } from './TrendingPlaylists'
import { UndergroundTrendingTracks } from './UndergroundTrendingTracks'

const MemoizedExploreContent = () => {
  const { isEnabled: isSearchExploreGoodiesEnabled } = useFeatureFlag(
    FeatureFlags.SEARCH_EXPLORE_GOODIES
  )

  return (
    <ProgressiveScrollView>
      {isSearchExploreGoodiesEnabled ? (
        <>
          <RecommendedTracks />
          <RecentlyPlayedTracks />
          <QuickSearchGrid />
        </>
      ) : null}
      <FeaturedPlaylists />
      <FeaturedRemixContests />
      {isSearchExploreGoodiesEnabled ? <UndergroundTrendingTracks /> : null}
      <ArtistSpotlight />
      <LabelSpotlight />
      {isSearchExploreGoodiesEnabled ? <ActiveDiscussions /> : null}
      <MoodsGrid />
      {isSearchExploreGoodiesEnabled ? (
        <>
          <TrendingPlaylists />
          <MostSharedTracks />
          <BestSelling />
          <FeelingLucky />
          <RecentPremiumTracks />
        </>
      ) : null}

      <BestOfAudiusTiles />
    </ProgressiveScrollView>
  )
}

// Memoize the entire component since it has no props
export const ExploreContent = React.memo(MemoizedExploreContent)
