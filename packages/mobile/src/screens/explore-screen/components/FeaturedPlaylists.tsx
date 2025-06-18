import React from 'react'

import { useExploreContent } from '@audius/common/api'
import { exploreMessages as messages } from '@audius/common/messages'

import { useTheme } from '@audius/harmony-native'
import { CollectionList } from 'app/components/collection-list'

import { ExploreSection } from './ExploreSection'

interface FeaturedPlaylistsProps {
  isLoading?: boolean
}

export const FeaturedPlaylists = ({
  isLoading: externalLoading
}: FeaturedPlaylistsProps) => {
  const { spacing } = useTheme()

  const { data: exploreContent, isLoading: isExploreContentLoading } =
    useExploreContent()

  // Use external loading state if provided, otherwise use internal loading state
  const isLoading =
    externalLoading !== undefined ? externalLoading : isExploreContentLoading

  return (
    <ExploreSection title={messages.featuredPlaylists} isLoading={isLoading}>
      <CollectionList
        horizontal
        collectionIds={exploreContent?.featuredPlaylists ?? []}
        carouselSpacing={spacing.l}
      />
    </ExploreSection>
  )
}
