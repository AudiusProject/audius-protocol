import React, { useMemo } from 'react'

import { useFeelingLuckyTracks } from '@audius/common/api'
import { useToggleTrack } from '@audius/common/hooks'
import { exploreMessages as messages } from '@audius/common/messages'
import { Kind } from '@audius/common/models'
import { QueueSource } from '@audius/common/store'
import { makeUid } from '@audius/common/utils'

import { Button, Flex, Text } from '@audius/harmony-native'
import { LineupTileSkeleton, TrackTile } from 'app/components/lineup-tile'

import { useDeferredElement } from '../../../hooks/useDeferredElement'

export const FeelingLucky = () => {
  const { inView, InViewWrapper } = useDeferredElement()
  const {
    data: feelingLuckyTracks = [],
    refetch: refetchFeelingLucky,
    isPending
  } = useFeelingLuckyTracks({ limit: 1 }, { enabled: inView })
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
    <InViewWrapper>
      <Flex justifyContent={'flex-start'} gap='m'>
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
        {!inView || isPending ? (
          <LineupTileSkeleton noShimmer />
        ) : track && uid ? (
          <TrackTile
            id={track.track_id}
            uid={uid}
            togglePlay={togglePlay}
            index={0}
          />
        ) : null}
      </Flex>
    </InViewWrapper>
  )
}
