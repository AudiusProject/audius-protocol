import React from 'react'

import { useFeelingLuckyTracks } from '@audius/common/api'
import { exploreMessages as messages } from '@audius/common/messages'
import type { UID, ID, PlaybackSource } from '@audius/common/models'

import { Button, Flex, Skeleton, Text } from '@audius/harmony-native'
import { TrackTile } from 'app/components/lineup-tile'

export const FeelingLucky = () => {
  const {
    data: feelingLuckyTracks,
    refetch: refetchFeelingLucky,
    isLoading
  } = useFeelingLuckyTracks({ limit: 1 })

  console.log('asdf feelingLuckyTracks: ', feelingLuckyTracks)
  if (!feelingLuckyTracks || feelingLuckyTracks.length === 0) {
    return null
  }

  return (
    <Flex mb='l' justifyContent={'flex-start'} gap='m'>
      <Flex direction='row' justifyContent='space-between'>
        <Text variant='title' size='l' textAlign={'left'}>
          {messages.feelingLucky}
        </Text>
        <Button
          variant='secondary'
          size='xs'
          onPress={() => refetchFeelingLucky()}
        >
          {messages.imFeelingLucky}
        </Button>
      </Flex>
      {isLoading ? (
        <Flex h={260} w='100%'>
          <Skeleton noShimmer />
        </Flex>
      ) : (
        <TrackTile
          id={feelingLuckyTracks[0]}
          uid={''}
          togglePlay={function (args: {
            uid: UID
            id: ID
            source: PlaybackSource
          }): void {
            throw new Error('Function not implemented.')
          }}
          index={0}
        />
      )}
    </Flex>
  )
}
