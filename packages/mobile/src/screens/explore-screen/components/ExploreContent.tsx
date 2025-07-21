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
import { RecentPremiumTracks } from './RecentPremiumTracks'
import { RecentlyPlayedTracks } from './RecentlyPlayed'
import { RecommendedTracks } from './RecommendedTracks'

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
        </>
      ) : null}
      <FeaturedPlaylists />
      <FeaturedRemixContests />
      <ArtistSpotlight />
      <LabelSpotlight />
      {isSearchExploreGoodiesEnabled ? <ActiveDiscussions /> : null}
      <MoodsGrid />
      {isSearchExploreGoodiesEnabled ? (
        <>
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
