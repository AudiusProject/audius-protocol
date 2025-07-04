import React from 'react'

import { useBestSellingAlbums } from '@audius/common/api'
import { exploreMessages as messages } from '@audius/common/messages'

import { useTheme } from '@audius/harmony-native'
import { CollectionList } from 'app/components/collection-list'

import { ExploreSection } from './ExploreSection'

export const BestSelling = () => {
  const { spacing } = useTheme()

  const { data, isLoading } = useBestSellingAlbums()

  return (
    <ExploreSection title={messages.bestSelling} isLoading={isLoading}>
      <CollectionList
        horizontal
        collectionIds={data ?? []}
        carouselSpacing={spacing.l}
      />
    </ExploreSection>
  )
}
