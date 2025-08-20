import React, { useCallback } from 'react'

import type { Lineup as LineupData } from '@audius/common/models'
import { Status } from '@audius/common/models'
import type { LineupBaseActions } from '@audius/common/store'
import { ScrollView } from 'react-native'
import { useDispatch } from 'react-redux'

import { Flex } from '@audius/harmony-native'
import type { TogglePlayConfig, LineupItem } from 'app/components/lineup/types'
import {
  CollectionTile,
  CollectionTileSkeleton
} from 'app/components/lineup-tile'

interface CollectionTileCarouselProps {
  lineup: LineupData<LineupItem>
  actions: LineupBaseActions
  isTrending?: boolean
}

export const CollectionLineupCarousel = ({
  lineup,
  isTrending,
  actions
}: CollectionTileCarouselProps) => {
  const dispatch = useDispatch()
  const togglePlay = useCallback(
    ({ uid, id, source }: TogglePlayConfig) => {
      dispatch(actions.togglePlay(uid, id, source))
    },
    [actions, dispatch]
  )

  if (lineup.status !== Status.SUCCESS) {
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
              <CollectionTileSkeleton noShimmer />
            </Flex>
          ))}
        </ScrollView>
      </Flex>
    )
  }

  return !lineup.entries || lineup.entries.length === 0 ? null : (
    <Flex direction='row' mh={-16}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ paddingHorizontal: 16, gap: 16 }}
      >
        {lineup.entries.map((item, index) => (
          <Flex key={item.id} direction='column' w={343}>
            <CollectionTile
              {...item}
              id={item.id}
              index={index}
              isTrending={isTrending}
              togglePlay={togglePlay}
              uid={item.uid}
              actions={actions}
            />
          </Flex>
        ))}
      </ScrollView>
    </Flex>
  )
}
