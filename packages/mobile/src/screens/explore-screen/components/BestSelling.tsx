import React from 'react'

import { useBestSelling } from '@audius/common/api'
import { exploreMessages as messages } from '@audius/common/messages'
import { ScrollView } from 'react-native'

import { Flex, useTheme } from '@audius/harmony-native'
import { CollectionCard } from 'app/components/collection-list/CollectionCard'
import { TrackCard } from 'app/components/track/TrackCard'
import { useSearchCategory } from 'app/screens/search-screen/searchState'

import { ExploreSection } from './ExploreSection'

export const BestSelling = () => {
  const { spacing } = useTheme()
  const [category] = useSearchCategory()

  const { data, isLoading } = useBestSelling({
    pageSize: 10,
    type:
      category === 'albums' ? 'album' : category === 'tracks' ? 'track' : 'all'
  })

  return !isLoading && data && data.length > 0 ? (
    <ExploreSection title={messages.bestSelling} isLoading={isLoading}>
      <Flex mh={-16}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{
            gap: spacing.m,
            paddingHorizontal: 16
          }}
        >
          {data?.map((item) => (
            <Flex key={item.id} w={160}>
              {item.contentType === 'album' ? (
                <CollectionCard id={item.id} />
              ) : (
                <TrackCard id={item.id} />
              )}
            </Flex>
          ))}
        </ScrollView>
      </Flex>
    </ExploreSection>
  ) : null
}
