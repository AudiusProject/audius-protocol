import React from 'react'

import { useBestSelling } from '@audius/common/api'
import { exploreMessages as messages } from '@audius/common/messages'

import { useTheme } from '@audius/harmony-native'
import { CollectionCard } from 'app/components/collection-list/CollectionCard'
import { CardList } from 'app/components/core'
import { TrackCard } from 'app/components/track/TrackCard'
import { TrackCardSkeleton } from 'app/components/track/TrackCardSkeleton'
import { useDeferredElement } from 'app/hooks/useDeferredElement'
import { useSearchCategory } from 'app/screens/search-screen/searchState'

import { ExploreSection } from './ExploreSection'

export const BestSelling = () => {
  const { spacing } = useTheme()
  const [category] = useSearchCategory()
  const { inView, InViewWrapper } = useDeferredElement()

  const type =
    category === 'albums' ? 'album' : category === 'tracks' ? 'track' : 'all'

  const { data, isPending } = useBestSelling(
    { pageSize: 10, type },
    { enabled: inView }
  )

  return (
    <InViewWrapper>
      <ExploreSection title={messages.bestSelling}>
        <CardList
          data={data}
          isLoading={!inView || isPending}
          renderItem={({ item }) =>
            item.contentType === 'album' ? (
              <CollectionCard id={item.id} />
            ) : (
              <TrackCard id={item.id} />
            )
          }
          horizontal
          carouselSpacing={spacing.m}
          LoadingCardComponent={TrackCardSkeleton}
        />
      </ExploreSection>
    </InViewWrapper>
  )
}
