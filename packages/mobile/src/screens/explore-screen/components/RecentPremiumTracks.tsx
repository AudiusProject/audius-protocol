import React from 'react'

import { useRecentPremiumTracks } from '@audius/common/api'
import { exploreMessages as messages } from '@audius/common/messages'
import { QueueSource } from '@audius/common/store'

import { ExploreSection } from './ExploreSection'
import { TrackTileCarousel } from './TrackTileCarousel'

export const RecentPremiumTracks = () => {
  const { data: recentPremiumTracks, isLoading } = useRecentPremiumTracks()
  if (
    !isLoading &&
    (!recentPremiumTracks || recentPremiumTracks.length === 0)
  ) {
    return null
  }
  return (
    <ExploreSection title={messages.recentlyListedForSale}>
      <TrackTileCarousel
        tracks={recentPremiumTracks}
        isLoading={isLoading}
        source={QueueSource.EXPLORE}
      />
    </ExploreSection>
  )
}
