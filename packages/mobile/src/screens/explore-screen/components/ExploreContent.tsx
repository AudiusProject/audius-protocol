import React from 'react'

import { ActiveDiscussions } from './ActiveDiscussions'
import { ArtistSpotlight } from './ArtistSpotlight'
import { BestOfAudiusTiles } from './BestOfAudiusTiles'
import { BestSelling } from './BestSelling'
import { FeaturedPlaylists } from './FeaturedPlaylists'
import { FeaturedRemixContests } from './FeaturedRemixContests'
import { FeelingLucky } from './FeelingLucky'
import { LabelSpotlight } from './LabelSpotlight'
import { MoodsGrid } from './MoodsGrid'
import { ProgressiveScrollView } from './ProgressiveScrollView'
import { RecentPremiumTracks } from './RecentPremiumTracks'
import { RecentlyPlayedTracks } from './RecentlyPlayed'
import { RecommendedTracks } from './RecommendedTracks'

const MemoizedExploreContent = () => {
  return (
    <ProgressiveScrollView>
      <RecommendedTracks />
      <RecentlyPlayedTracks />
      <FeaturedPlaylists />
      <FeaturedRemixContests />
      <ArtistSpotlight />
      <LabelSpotlight />
      <ActiveDiscussions />
      <MoodsGrid />
      <BestSelling />
      <FeelingLucky />
      <RecentPremiumTracks />
      <BestOfAudiusTiles />
    </ProgressiveScrollView>
  )
}

// Memoize the entire component since it has no props
export const ExploreContent = React.memo(MemoizedExploreContent)
