import React from 'react'

import { useExploreContent, useUsers } from '@audius/common/api'
import { exploreMessages as messages } from '@audius/common/messages'

import { useTheme } from '@audius/harmony-native'
import { UserList } from 'app/components/user-list'

import { ExploreSection } from './ExploreSection'

interface LabelSpotlightProps {
  isLoading?: boolean
}

export const LabelSpotlight = ({
  isLoading: externalLoading
}: LabelSpotlightProps) => {
  const { spacing } = useTheme()

  const { data: exploreContent, isLoading: isExploreContentLoading } =
    useExploreContent()
  const { data: featuredLabels, isLoading: isFeaturedLabelsLoading } = useUsers(
    exploreContent?.featuredLabels
  )

  // Use external loading state if provided, otherwise use internal loading state
  const isLoading =
    externalLoading !== undefined
      ? externalLoading
      : isExploreContentLoading || isFeaturedLabelsLoading

  return (
    <ExploreSection title={messages.labelSpotlight} isLoading={isLoading}>
      <UserList
        horizontal
        profiles={featuredLabels}
        carouselSpacing={spacing.l}
      />
    </ExploreSection>
  )
}
