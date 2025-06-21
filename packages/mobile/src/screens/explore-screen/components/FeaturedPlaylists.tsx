import React from 'react'

import { useExploreContent, useCollections } from '@audius/common/api'
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

  const { isLoading: isCollectionsLoading } = useCollections(
    exploreContent?.featuredPlaylists ?? null
  )
  console.log('asdf featured playlists', {
    exploreContent: exploreContent?.featuredPlaylists,
    isCollectionsLoading,
    isExploreContentLoading,
    externalLoading
  })

  // Use external loading state if provided, otherwise use internal loading state
  // If exploreContent is still loading, we should show loading
  // If we have collection IDs but collections are still loading, we should show loading
  const isLoading =
    externalLoading !== undefined
      ? externalLoading
      : isExploreContentLoading || isCollectionsLoading

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
