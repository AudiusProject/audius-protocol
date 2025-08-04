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
import { useIsMobile } from 'hooks/useIsMobile'

export const FeelingLuckySection = () => {
  const isMobile = useIsMobile()
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
    <Flex direction='column' mh='l'>
      <Flex gap='xl' direction='column'>
        <Flex justifyContent='space-between' gap='l' alignItems='center'>
          <Text
            variant={isMobile ? 'title' : 'heading'}
            size={isMobile ? 'l' : 'm'}
          >
            {messages.feelingLucky}
          </Text>
          <Button
            variant='secondary'
            size={isMobile ? 'xs' : 'small'}
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
