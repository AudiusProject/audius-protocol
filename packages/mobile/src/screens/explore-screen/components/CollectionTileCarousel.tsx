import React, { useMemo } from 'react'

import { Kind } from '@audius/common/models'
import { QueueSource } from '@audius/common/store'
import { makeUid } from '@audius/common/utils'
import { ScrollView } from 'react-native'

import { Flex } from '@audius/harmony-native'
import { CollectionTile, LineupTileSkeleton } from 'app/components/lineup-tile'

interface CollectionTileCarouselProps {
  collectionIds?: number[]
  isLoading?: boolean
  isTrending?: boolean
}

const CarouselItem = ({
  id,
  index,
  isTrending
}: {
  id: number
  index: number
  isTrending?: boolean
}) => {
  const uid = useMemo(
    () => makeUid(Kind.COLLECTIONS, id, QueueSource.EXPLORE),
    [id]
  )
  return (
    <CollectionTile
      id={id}
      uid={uid}
      togglePlay={() => {}}
      index={index}
      isTrending={isTrending}
    />
  )
}

export const CollectionTileCarousel = ({
  collectionIds,
  isLoading,
  isTrending
}: CollectionTileCarouselProps) => {
  if (isLoading) {
    return (
      <Flex direction='row' mh={-16}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ paddingHorizontal: 16 }}
        >
          {[0, 1].map((columnIndex) => (
            <Flex
              key={columnIndex}
              direction='column'
              gap='m'
              w={343}
              mr={columnIndex === 0 ? 16 : 0}
            >
              <LineupTileSkeleton />
            </Flex>
          ))}
        </ScrollView>
      </Flex>
    )
  }

  return !collectionIds || collectionIds.length === 0 ? null : (
    <Flex direction='row' mh={-16}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ paddingHorizontal: 16, gap: 16 }}
      >
        {collectionIds.map((collectionId, index) => (
          <Flex key={collectionId} direction='column' w={343}>
            <CarouselItem
              id={collectionId}
              isTrending={isTrending}
              index={index}
            />
          </Flex>
        ))}
      </ScrollView>
    </Flex>
  )
}
