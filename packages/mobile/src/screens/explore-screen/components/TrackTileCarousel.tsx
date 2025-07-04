import React from 'react'

import { css } from '@emotion/native'
import { ScrollView } from 'react-native'

import { Flex } from '@audius/harmony-native'
import { TrackTile } from 'app/components/lineup-tile'

interface TrackTileCarouselProps {
  tracks: number[]
  uidPrefix: string
}

export const TrackTileCarousel = ({
  tracks,
  uidPrefix
}: TrackTileCarouselProps) => {
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
            style={css({
              minWidth: 343,
              marginRight: pairIndex < trackPairs.length - 1 ? 16 : 0
            })}
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
