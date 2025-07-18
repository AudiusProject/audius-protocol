import React from 'react'

import { css } from '@emotion/native'
import { ScrollView } from 'react-native'

import { Flex } from '@audius/harmony-native'
import { LineupTileSkeleton, TrackTile } from 'app/components/lineup-tile'

interface TrackTileCarouselProps {
  tracks?: number[]
  uidPrefix: string
  isLoading?: boolean
}

export const TrackTileCarousel = ({
  tracks,
  uidPrefix,
  isLoading
}: TrackTileCarouselProps) => {
  if (isLoading || !tracks) {
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

  // Chunk tracks into pairs for 2-track columns
  const trackPairs: number[][] = []
  for (let i = 0; i < tracks.length; i += 2) {
    trackPairs.push(tracks.slice(i, i + 2))
  }

  return (
    <Flex direction='row' mh={-16}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ paddingHorizontal: 16 }}
      >
        {trackPairs.map((pair, pairIndex) => (
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
        ))}
      </ScrollView>
    </Flex>
  )
}
