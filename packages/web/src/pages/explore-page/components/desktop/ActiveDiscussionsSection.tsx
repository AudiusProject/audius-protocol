import React from 'react'

import { useRecentlyCommentedTracks } from '@audius/common/api'
import { exploreMessages as messages } from '@audius/common/messages'

import { TrackTile } from 'components/track/desktop/TrackTile'

import { ExploreSection } from './ExploreSection'

export const ActiveDiscussionsSection = () => {
  const { data, isLoading } = useRecentlyCommentedTracks({
    pageSize: 10
  })

  if (!isLoading && (!data || data.length === 0)) {
    return null
  }

  return (
    <ExploreSection
      title={messages.activeDiscussions}
      data={data}
      isLoading={isLoading}
      Tile={TrackTile}
    />
  )
}
