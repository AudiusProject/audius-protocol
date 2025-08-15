import React from 'react'

import { useRecentlyPlayedTracks } from '@audius/common/api'
import { exploreMessages as messages } from '@audius/common/messages'

import { useTheme } from '@audius/harmony-native'
import { TrackCardList } from 'app/components/track-card-list'
import { useDeferredElement } from 'app/hooks/useDeferredElement'

import { ExploreSection } from './ExploreSection'

export const RecentlyPlayedTracks = () => {
  const { spacing } = useTheme()
  const { InViewWrapper, inView } = useDeferredElement()
  const { data: recentlyPlayedTracks } = useRecentlyPlayedTracks(
    { pageSize: 10 },
    { enabled: inView }
  )

  return (
    <InViewWrapper>
      <ExploreSection
        title={messages.recentlyPlayed}
        viewAllLink='ListeningHistoryScreen'
      >
        <TrackCardList
          trackIds={recentlyPlayedTracks}
          horizontal
          carouselSpacing={spacing.l}
        />
      </ExploreSection>
    </InViewWrapper>
  )
}
