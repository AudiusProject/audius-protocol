import React from 'react'

import { Flex } from '@audius/harmony'

import { useIsMobile } from 'hooks/useIsMobile'

import { PlayableTile } from './PlayableTile'
import { TILE_WIDTH, MOBILE_TILE_WIDTH } from './constants'

export const TilePairs: React.FC<{
  data: number[]
  Tile: React.ComponentType<any>
}> = ({ data, Tile }) => {
  const isMobile = useIsMobile()
  const tileWidth = isMobile ? MOBILE_TILE_WIDTH : TILE_WIDTH
  const pairs = []
  for (let i = 0; i < data.length; i += 2) {
    pairs.push(data.slice(i, i + 2))
  }
  return (
    <>
      {pairs.map((pair, pairIndex) => (
        <Flex
          key={pairIndex}
          direction='column'
          gap='m'
          css={{ minWidth: tileWidth, width: tileWidth }}
        >
          {pair.map((id, idIndex) => (
            <PlayableTile
              key={id}
              id={id}
              index={pairIndex * 2 + idIndex}
              Tile={Tile}
              size='l'
              variant='large'
            />
          ))}
        </Flex>
      ))}
    </>
  )
}

export const TileSkeletons: React.FC<{
  Tile: React.ComponentType<any>
}> = ({ Tile }) => {
  const isMobile = useIsMobile()
  const tileWidth = isMobile ? MOBILE_TILE_WIDTH : TILE_WIDTH
  return (
    <>
      {Array.from({ length: 2 }).map((_, i) => (
        <Flex
          key={i}
          direction='column'
          gap='m'
          css={{ minWidth: tileWidth, width: tileWidth }}
        >
          <Tile key={`${i}-0`} id={0} size='m' />
          <Tile key={`${i}-1`} id={0} size='m' />
        </Flex>
      ))}
    </>
  )
}
