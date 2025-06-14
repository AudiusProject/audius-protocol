import React from 'react'

import { useExploreContent } from '@audius/common/api'
import { exploreMessages as messages } from '@audius/common/messages'

import { useTheme } from '@audius/harmony-native'
import { RemixCarousel } from 'app/components/remix-carousel/RemixCarousel'

import { ExploreSection } from './ExploreSection'

interface FeaturedRemixContestsProps {
  isLoading?: boolean
}

export const FeaturedRemixContests = ({
  isLoading: externalLoading
}: FeaturedRemixContestsProps) => {
  const { spacing } = useTheme()

  const { data: exploreContent, isLoading: isExploreContentLoading } =
    useExploreContent()

  // Use external loading state if provided, otherwise use internal loading state
  const isLoading =
    externalLoading !== undefined ? externalLoading : isExploreContentLoading

  return (
    <ExploreSection
      title={messages.featuredRemixContests}
      isLoading={isLoading}
    >
      <RemixCarousel
        trackIds={exploreContent?.featuredRemixContests}
        carouselSpacing={spacing.l}
      />
    </ExploreSection>
  )
}
