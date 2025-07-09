import React from 'react'

import {
  useRecentlyCommentedTracks,
  useRecommendedTracks
} from '@audius/common/api'
import { exploreMessages as messages } from '@audius/common/messages'

import { ExploreSection } from './ExploreSection'
import { TrackTileCarousel } from './TrackTileCarousel'

export const ActiveDiscussions = () => {
  const { data: recentlyCommentedTracks, isLoading } =
    useRecentlyCommentedTracks()

  if (!recentlyCommentedTracks || recentlyCommentedTracks.length === 0) {
    return null
  }

  return (
    <ExploreSection title={messages.activeDiscussions} isLoading={isLoading}>
      <TrackTileCarousel
        tracks={recentlyCommentedTracks}
        uidPrefix='recently-commented-track'
      />
    </ExploreSection>
  )
}
