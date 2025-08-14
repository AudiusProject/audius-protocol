import React from 'react'

import { useExploreContent, useTracks } from '@audius/common/api'
import { exploreMessages as messages } from '@audius/common/messages'

import { useTheme } from '@audius/harmony-native'
import { CardList } from 'app/components/core'
import { RemixContestCard } from 'app/components/remix-carousel/RemixContestCard'
import { TrackCardSkeleton } from 'app/components/track/TrackCardSkeleton'

import { useDeferredElement } from '../../../hooks/useDeferredElement'

import { ExploreSection } from './ExploreSection'

export const FeaturedRemixContests = () => {
  const { spacing } = useTheme()
  const { InViewWrapper, inView } = useDeferredElement()

  const { data: exploreContent } = useExploreContent({ enabled: inView })
  const { data: remixContests } = useTracks(
    exploreContent?.featuredRemixContests,
    { enabled: inView }
  )

  return (
    <InViewWrapper>
      <ExploreSection title={messages.featuredRemixContests}>
        <CardList
          data={remixContests?.map((track) => ({ trackId: track.track_id }))}
          renderItem={({ item }) => {
            return <RemixContestCard trackId={item.trackId} />
          }}
          horizontal
          carouselSpacing={spacing.l}
          LoadingCardComponent={TrackCardSkeleton}
        />
      </ExploreSection>
    </InViewWrapper>
  )
}
