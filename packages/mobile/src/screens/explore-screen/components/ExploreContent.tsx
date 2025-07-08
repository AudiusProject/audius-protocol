import React from 'react'

import { ArtistSpotlight } from './ArtistSpotlight'
import { BestOfAudiusTiles } from './BestOfAudiusTiles'
import { BestSelling } from './BestSelling'
import { FeaturedPlaylists } from './FeaturedPlaylists'
import { FeaturedRemixContests } from './FeaturedRemixContests'
import { LabelSpotlight } from './LabelSpotlight'
import { MoodsGrid } from './MoodsGrid'
import { ProgressiveScrollView } from './ProgressiveScrollView'
import { RecentPremiumTracks } from './RecentPremiumTracks'
import { RecommendedTracks } from './RecommendedTracks'

const MemoizedExploreContent = () => {
  return (
    <ProgressiveScrollView>
      <RecommendedTracks />
      <FeaturedPlaylists />
      <FeaturedRemixContests />
      <ArtistSpotlight />
      <LabelSpotlight />
      <MoodsGrid />
      <BestSelling />
      <RecentPremiumTracks />
      <BestOfAudiusTiles />
    </ProgressiveScrollView>
  )
}

// Memoize the entire component since it has no props
export const ExploreContent = React.memo(MemoizedExploreContent)
