import React from 'react'

import { useMostSharedTracks } from '@audius/common/api'
import { exploreMessages as messages } from '@audius/common/messages'
import { QueueSource } from '@audius/common/store'
import { full } from '@audius/sdk'

import { useDeferredElement } from '../../../hooks/useDeferredElement'

import { ExploreSection } from './ExploreSection'
import { TrackTileCarousel } from './TrackTileCarousel'

export const MostSharedTracks = () => {
  const { inView, InViewWrapper } = useDeferredElement()
  const { data: mostSharedTracks, isPending } = useMostSharedTracks(
    {
      pageSize: 10,
      timeRange: full.GetMostSharedTracksTimeRangeEnum.Week
    },
    { enabled: inView }
  )

  return (
    <InViewWrapper>
      <ExploreSection title={messages.mostShared}>
        <TrackTileCarousel
          tracks={mostSharedTracks}
          isLoading={isPending}
          source={QueueSource.EXPLORE}
          inView={inView}
        />
      </ExploreSection>
    </InViewWrapper>
  )
}
