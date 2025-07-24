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
  isTrending
}: {
  id: number
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
      index={0}
      isTrending={isTrending}
    />
  )
}

// TODO: Not rendering full height w/ tracks (is it based on available space? )
// Spacing between tiles is wrong

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
        contentContainerStyle={{ paddingHorizontal: 16 }}
      >
        {collectionIds.map((collectionId) => (
          <CarouselItem
            key={collectionId}
            id={collectionId}
            isTrending={isTrending}
          />
        ))}
        {/* {trackPairs.map((pair, pairIndex) => (
          <Flex
            key={pairIndex}
            direction='column'
            gap='m'
            w={343}
            mr={pairIndex < trackPairs.length - 1 ? 16 : 0}
          >
            {pair.map((track, trackIndex) => (
              <TrackTile
                key={track}
                id={track}
                uid={`${uidPrefix}-${track}`}
                togglePlay={() => {}}
                index={pairIndex * 2 + trackIndex}
              />
            ))}
          </Flex>
        ))} */}
      </ScrollView>
    </Flex>
  )
}
