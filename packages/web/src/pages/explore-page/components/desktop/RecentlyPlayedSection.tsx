import React from 'react'

import { useRecentlyPlayedTracks } from '@audius/common/api'
import { exploreMessages as messages } from '@audius/common/messages'

import { TrackCard } from 'components/track/TrackCard'

import { ExploreSection } from './ExploreSection'

export const RecentlyPlayedSection = () => {
  const { data, isLoading } = useRecentlyPlayedTracks({
    pageSize: 10
  })

  if (!isLoading && (!data || data.length === 0)) {
    return null
  }

  return (
    <ExploreSection
      title={messages.recentlyPlayed}
      data={data}
      isLoading={isLoading}
      Card={TrackCard}
    />
  )
}
