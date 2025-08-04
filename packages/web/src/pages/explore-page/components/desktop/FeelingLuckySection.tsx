import { useCallback, useMemo } from 'react'

import { useFeelingLuckyTracks } from '@audius/common/api'
import { useToggleTrack } from '@audius/common/hooks'
import { exploreMessages as messages } from '@audius/common/messages'
import { UID, ID, Kind } from '@audius/common/models'
import { QueueSource } from '@audius/common/store'
import { makeUid } from '@audius/common/utils'
import { Text, Flex, Button, IconArrowRotate } from '@audius/harmony'

import { TrackTile } from 'components/track/desktop/TrackTile'
import { TrackTileSize } from 'components/track/types'

export const FeelingLuckySection = () => {
  const {
    data: feelingLuckyTrack,
    isLoading,
    refetch: refetchFeelingLucky
  } = useFeelingLuckyTracks({ limit: 1 })

  // Create UID and togglePlay for feeling lucky track
  const feelingLuckyTrackId = feelingLuckyTrack?.[0]?.track_id ?? 0
  const feelingLuckyUid = useMemo(
    () =>
      feelingLuckyTrackId
        ? makeUid(Kind.TRACKS, feelingLuckyTrackId, QueueSource.EXPLORE)
        : '',
    [feelingLuckyTrackId]
  )

  const { togglePlay: toggleFeelingLucky } = useToggleTrack({
    id: feelingLuckyTrackId,
    uid: feelingLuckyUid,
    source: QueueSource.EXPLORE
  })

  const handleTogglePlay = useCallback(
    (tileUid: UID, trackId: ID) => {
      if (tileUid === feelingLuckyUid && trackId === feelingLuckyTrackId) {
        toggleFeelingLucky()
      }
    },
    [feelingLuckyUid, feelingLuckyTrackId, toggleFeelingLucky]
  )

  if (!isLoading && feelingLuckyTrackId === 0) {
    return null
  }

  return (
    <Flex direction='column'>
      <Flex gap='xl' direction='column'>
        <Flex justifyContent='space-between'>
          <Text variant='heading'>{messages.feelingLucky}</Text>
          <Button
            variant='secondary'
            size='small'
            onClick={() => refetchFeelingLucky()}
            iconLeft={IconArrowRotate}
          >
            {messages.imFeelingLucky}
          </Button>
        </Flex>
        <TrackTile
          uid={feelingLuckyUid}
          id={feelingLuckyTrackId}
          index={0}
          size={TrackTileSize.LARGE}
          statSize={'small'}
          ordered={false}
          togglePlay={handleTogglePlay}
          hasLoaded={() => {}}
          isLoading={false}
          isTrending={false}
          isFeed={false}
        />
      </Flex>
    </Flex>
  )
}
