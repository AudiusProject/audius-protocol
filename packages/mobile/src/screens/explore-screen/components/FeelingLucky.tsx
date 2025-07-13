import React, { useMemo } from 'react'

import { useFeelingLuckyTracks } from '@audius/common/api'
import { useToggleTrack } from '@audius/common/hooks'
import { exploreMessages as messages } from '@audius/common/messages'
import { Kind } from '@audius/common/models'
import { QueueSource } from '@audius/common/store'
import { makeUid } from '@audius/common/utils'

import { Button, Flex, Skeleton, Text } from '@audius/harmony-native'
import { TrackTile } from 'app/components/lineup-tile'

export const FeelingLucky = () => {
  const {
    data: feelingLuckyTracks = [],
    refetch: refetchFeelingLucky,
    isLoading
  } = useFeelingLuckyTracks({ limit: 1 })
  const track = feelingLuckyTracks[0]

  const uid = useMemo(() => {
    return track?.track_id ? makeUid(Kind.TRACKS, track.track_id) : null
  }, [track?.track_id])

  const { togglePlay } = useToggleTrack({
    id: track?.track_id,
    uid,
    source: QueueSource.EXPLORE
  })

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
      ) : track && uid ? (
        <TrackTile
          id={track.track_id}
          uid={uid}
          togglePlay={togglePlay}
          index={0}
        />
      ) : null}
    </Flex>
  )
}
