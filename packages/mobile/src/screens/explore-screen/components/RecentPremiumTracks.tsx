import React from 'react'

import { useRecentPremiumTracks } from '@audius/common/api'
import { exploreMessages as messages } from '@audius/common/messages'
import { QueueSource } from '@audius/common/store'

import { useDeferredElement } from '../../../hooks/useDeferredElement'

import { ExploreSection } from './ExploreSection'
import { TrackTileCarousel } from './TrackTileCarousel'

export const RecentPremiumTracks = () => {
  const { inView, InViewWrapper } = useDeferredElement()
  const { data: recentPremiumTracks, isPending } = useRecentPremiumTracks(
    { pageSize: 10 },
    { enabled: inView }
  )

  return (
    <InViewWrapper>
      <ExploreSection title={messages.recentlyListedForSale}>
        <TrackTileCarousel
          tracks={recentPremiumTracks}
          isLoading={isPending || !inView}
          source={QueueSource.EXPLORE}
        />
      </ExploreSection>
    </InViewWrapper>
  )
}
