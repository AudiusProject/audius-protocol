import React from 'react'

import { useMostSharedTracks } from '@audius/common/api'
import { exploreMessages as messages } from '@audius/common/messages'
import { full } from '@audius/sdk'

import { TrackCard } from 'components/track/TrackCard'

import { ExploreSection } from './ExploreSection'

export const MostSharedSection = () => {
  const { data, isLoading } = useMostSharedTracks({
    pageSize: 10,
    timeRange: full.GetMostSharedTracksTimeRangeEnum.Week
  })

  if (!isLoading && (!data || data.length === 0)) {
    return null
  }

  return (
    <ExploreSection
      title={messages.mostShared}
      data={data}
      isLoading={isLoading}
      Card={TrackCard}
    />
  )
}
