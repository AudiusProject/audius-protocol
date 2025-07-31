import React from 'react'

import { useRecentPremiumTracks } from '@audius/common/api'
import { exploreMessages as messages } from '@audius/common/messages'

import { TrackTile } from 'components/track/desktop/TrackTile'

import { ExploreSection } from './ExploreSection'

export const RecentPremiumTracksSection = () => {
  const { data, isLoading } = useRecentPremiumTracks()

  if (!isLoading && (!data || data.length === 0)) {
    return null
  }

  return (
    <ExploreSection
      title={messages.recentlyListedForSale}
      data={data}
      isLoading={isLoading}
      Tile={TrackTile}
    />
  )
}
