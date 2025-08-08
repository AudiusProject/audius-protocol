import React from 'react'

import { useRecentlyCommentedTracks } from '@audius/common/api'
import { exploreMessages as messages } from '@audius/common/messages'
import { QueueSource } from '@audius/common/store'

import { ExploreSection } from './ExploreSection'
import { TrackTileCarousel } from './TrackTileCarousel'

export const ActiveDiscussions = () => {
  const { data: recentlyCommentedTracks, isLoading } =
    useRecentlyCommentedTracks({ pageSize: 10 })

  if (
    !isLoading &&
    (!recentlyCommentedTracks || recentlyCommentedTracks.length === 0)
  ) {
    return null
  }

  return (
    <ExploreSection title={messages.activeDiscussions}>
      <TrackTileCarousel
        tracks={recentlyCommentedTracks}
        isLoading={isLoading}
        source={QueueSource.EXPLORE}
      />
    </ExploreSection>
  )
}
