import React from 'react'

import { useExploreContent, useUsers } from '@audius/common/api'
import { exploreMessages as messages } from '@audius/common/messages'
import { ScrollView } from 'react-native'

import { Flex, useTheme } from '@audius/harmony-native'
import { CollectionList } from 'app/components/collection-list'
import { RemixCarousel } from 'app/components/remix-carousel/RemixCarousel'
import { UserList } from 'app/components/user-list'

import { BestOfAudiusTiles } from './BestOfAudiusTiles'
import { ExploreSection } from './ExploreSection'
import { MoodsGrid } from './MoodsGrid'

export const ExploreContent = () => {
  const { spacing } = useTheme()

  const { data: exploreContent, isLoading: isExploreContentLoading } =
    useExploreContent()
  const { data: featuredArtists, isLoading: isFeaturedArtistsLoading } =
    useUsers(exploreContent?.featuredProfiles)
  const { data: featuredLabels, isLoading: isFeaturedLabelsLoading } = useUsers(
    exploreContent?.featuredLabels
  )

  return (
    <ScrollView>
      <Flex direction='column' ph='l' pt='xl' pb='3xl'>
        <ExploreSection
          title={messages.featuredPlaylists}
          isLoading={isExploreContentLoading}
        >
          <CollectionList
            horizontal
            collectionIds={exploreContent?.featuredPlaylists ?? []}
            carouselSpacing={spacing.l}
          />
        </ExploreSection>

        <ExploreSection
          title={messages.featuredRemixContests}
          isLoading={isExploreContentLoading}
        >
          <RemixCarousel
            trackIds={exploreContent?.featuredRemixContests}
            carouselSpacing={spacing.l}
          />
        </ExploreSection>

        <ExploreSection
          title={messages.artistSpotlight}
          isLoading={isExploreContentLoading || isFeaturedArtistsLoading}
        >
          <UserList
            horizontal
            profiles={featuredArtists}
            carouselSpacing={spacing.l}
          />
        </ExploreSection>

        <ExploreSection
          title={messages.labelSpotlight}
          isLoading={isExploreContentLoading || isFeaturedLabelsLoading}
        >
          <UserList
            horizontal
            profiles={featuredLabels}
            carouselSpacing={spacing.l}
          />
        </ExploreSection>

        <MoodsGrid />

        <BestOfAudiusTiles />
      </Flex>
    </ScrollView>
  )
}
