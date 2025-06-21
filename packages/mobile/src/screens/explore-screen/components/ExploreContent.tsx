import React from 'react'

import { ArtistSpotlight } from './ArtistSpotlight'
import { BestOfAudiusTiles } from './BestOfAudiusTiles'
import { FeaturedPlaylists } from './FeaturedPlaylists'
import { FeaturedRemixContests } from './FeaturedRemixContests'
import { LabelSpotlight } from './LabelSpotlight'
import { MoodsGrid } from './MoodsGrid'
import { ProgressiveScrollView } from './ProgressiveScrollView'

const MemoizedExploreContent = () => {
  return (
    <ProgressiveScrollView>
      <FeaturedPlaylists />
      <FeaturedRemixContests />
      <ArtistSpotlight />
      <LabelSpotlight />
      <MoodsGrid />
      <BestOfAudiusTiles />
    </ProgressiveScrollView>
  )
}

// Memoize the entire component since it has no props
export const ExploreContent = React.memo(MemoizedExploreContent)
