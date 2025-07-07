import React from 'react'

import { useBestSelling } from '@audius/common/api'
import { exploreMessages as messages } from '@audius/common/messages'
import { css } from '@emotion/native'
import { ScrollView } from 'react-native'

import { Flex, useTheme } from '@audius/harmony-native'
import { CollectionList } from 'app/components/collection-list'
import { CollectionCard } from 'app/components/collection-list/CollectionCard'
import { TrackCard } from 'app/components/track/TrackCard'

import { ExploreSection } from './ExploreSection'

export const BestSelling = () => {
  const { spacing } = useTheme()

  const { data, isLoading } = useBestSelling()

  return (
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
  )
}
