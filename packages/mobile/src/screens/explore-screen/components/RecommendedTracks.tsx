import React from 'react'

import { useRecommendedTracks } from '@audius/common/api'
import { exploreMessages as messages } from '@audius/common/messages'

import { ExploreSection } from './ExploreSection'
import { TrackTileCarousel } from './TrackTileCarousel'

export const RecommendedTracks = () => {
  const { data: recommendedTracks, isLoading } = useRecommendedTracks()
  if (!recommendedTracks || recommendedTracks.length === 0) {
    return null
  }

  return (
    <ExploreSection title={messages.forYou} isLoading={isLoading}>
      <TrackTileCarousel
        tracks={recommendedTracks}
        uidPrefix='recommended-track'
      />
    </ExploreSection>
  )
}
