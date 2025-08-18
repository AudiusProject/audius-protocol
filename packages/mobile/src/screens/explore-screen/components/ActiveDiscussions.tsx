import React from 'react'

import { useRecentlyCommentedTracks } from '@audius/common/api'
import { exploreMessages as messages } from '@audius/common/messages'
import { QueueSource } from '@audius/common/store'

import { useDeferredElement } from '../../../hooks/useDeferredElement'

import { ExploreSection } from './ExploreSection'
import { TrackTileCarousel } from './TrackTileCarousel'

export const ActiveDiscussions = () => {
  const { inView, InViewWrapper } = useDeferredElement()
  const { data: recentlyCommentedTracks, isPending } =
    useRecentlyCommentedTracks({ pageSize: 10 }, { enabled: inView })

  return (
    <InViewWrapper>
      <ExploreSection title={messages.activeDiscussions}>
        <TrackTileCarousel
          tracks={recentlyCommentedTracks}
          isLoading={isPending || !inView}
          source={QueueSource.EXPLORE}
        />
      </ExploreSection>
    </InViewWrapper>
  )
}
