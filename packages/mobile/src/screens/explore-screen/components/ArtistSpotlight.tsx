import React from 'react'

import { useExploreContent, useUsers } from '@audius/common/api'
import { exploreMessages as messages } from '@audius/common/messages'

import { useTheme } from '@audius/harmony-native'
import { UserList } from 'app/components/user-list'

import { ExploreSection } from './ExploreSection'

interface ArtistSpotlightProps {
  isLoading?: boolean
}

export const ArtistSpotlight = ({
  isLoading: externalLoading
}: ArtistSpotlightProps) => {
  const { spacing } = useTheme()

  const { data: exploreContent, isLoading: isExploreContentLoading } =
    useExploreContent()
  const { data: featuredArtists, isLoading: isFeaturedArtistsLoading } =
    useUsers(exploreContent?.featuredProfiles)

  // Use external loading state if provided, otherwise use internal loading state
  const isLoading =
    externalLoading !== undefined
      ? externalLoading
      : isExploreContentLoading || isFeaturedArtistsLoading

  return (
    <ExploreSection title={messages.artistSpotlight} isLoading={isLoading}>
      <UserList
        horizontal
        profiles={featuredArtists}
        carouselSpacing={spacing.l}
      />
    </ExploreSection>
  )
}
