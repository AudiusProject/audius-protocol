import { useFeatureFlag } from '@audius/common/hooks'
import { User, PlaybackSource } from '@audius/common/models'
import { FeatureFlags } from '@audius/common/services'
import { useTrackPageLineup } from '@audius/common/src/api/tan-query/useTrackPageLineup'
import { tracksActions } from '@audius/common/src/store/pages/track/lineup/actions'
import { playerSelectors } from '@audius/common/store'
import { Flex, Text } from '@audius/harmony'
import { useSelector } from 'react-redux'

import { TanQueryLineup } from 'components/lineup/TanQueryLineup'
import { LineupVariant } from 'components/lineup/types'

import { useTrackPageSize } from './useTrackPageSize'

const { getUid, getTrackId, getBuffering } = playerSelectors

const DEFAULT_PAGE_SIZE = 6

type TrackPageLineupProps = {
  user: User | null
  trackId: number | null | undefined
  commentsDisabled?: boolean
}

const messages = {
  originalTrack: 'Original Track',
  remixes: 'Remixes of this Track',
  moreBy: (name: string) => `More by ${name}`,
  youMightAlsoLike: 'You Might Also Like'
}

export const TrackPageLineup = ({
  user,
  trackId,
  commentsDisabled
}: TrackPageLineupProps) => {
  const {
    indices,
    pageSize = DEFAULT_PAGE_SIZE,
    ...queryData
  } = useTrackPageLineup({
    trackId,
    ownerHandle: user?.handle
  })

  const { isDesktop } = useTrackPageSize()
  const playingUid = useSelector(getUid)
  const playingTrackId = useSelector(getTrackId)
  const isBuffering = useSelector(getBuffering)

  const { isEnabled: commentsFlagEnabled } = useFeatureFlag(
    FeatureFlags.COMMENTS_ENABLED
  )
  const isCommentingEnabled = commentsFlagEnabled && !commentsDisabled

  const renderRemixParentSection = () => {
    if (!indices) return null
    if (indices.remixParentIndex === null) return null

    return (
      <Flex direction='column' gap='l'>
        <Text variant='title' size='l'>
          {messages.originalTrack}
        </Text>
        <TanQueryLineup
          lineupQueryData={queryData}
          pageSize={1}
          variant={LineupVariant.SECTION}
          offset={indices.remixParentIndex}
          playingUid={playingUid}
          playingTrackId={playingTrackId}
          buffering={isBuffering}
          actions={tracksActions}
          playingSource={PlaybackSource.TRACK_TILE}
        />
      </Flex>
    )
  }

  const renderRemixesSection = () => {
    if (!indices) return null
    if (indices.remixesStartIndex === null) return null
    const start = indices.remixesStartIndex
    const end = indices.moreByTracksStartIndex

    return (
      <Flex direction='column' gap='l' alignItems='flex-start'>
        <Text variant='title' size='l'>
          {messages.remixes}
        </Text>
        <TanQueryLineup
          lineupQueryData={queryData}
          pageSize={end !== null ? end - start : 0}
          variant={LineupVariant.SECTION}
          offset={start}
          playingUid={playingUid}
          playingTrackId={playingTrackId}
          buffering={isBuffering}
          actions={tracksActions}
          playingSource={PlaybackSource.TRACK_TILE}
        />
      </Flex>
    )
  }

  const renderMoreBySection = () => {
    if (!indices) return null
    if (indices.moreByTracksStartIndex === null) return null
    const start = indices.moreByTracksStartIndex
    const end = indices.recommendedTracksStartIndex

    return (
      <Flex direction='column' gap='l' alignItems='flex-start'>
        <Text variant='title' size='l'>
          {messages.moreBy(user?.name ?? '')}
        </Text>
        <TanQueryLineup
          lineupQueryData={queryData}
          pageSize={end !== null ? end - start : pageSize}
          variant={LineupVariant.SECTION}
          offset={start}
          playingUid={playingUid}
          playingTrackId={playingTrackId}
          buffering={isBuffering}
          actions={tracksActions}
          playingSource={PlaybackSource.TRACK_TILE}
        />
      </Flex>
    )
  }

  const renderRecommendedSection = () => {
    if (!indices) return null
    if (indices.recommendedTracksStartIndex === null) return null

    return (
      <Flex direction='column' gap='l'>
        <Text variant='title' size='l'>
          {messages.youMightAlsoLike}
        </Text>
        <TanQueryLineup
          lineupQueryData={queryData}
          pageSize={pageSize}
          variant={LineupVariant.SECTION}
          offset={indices.recommendedTracksStartIndex}
          playingUid={playingUid}
          playingTrackId={playingTrackId}
          buffering={isBuffering}
          actions={tracksActions}
          playingSource={PlaybackSource.TRACK_TILE}
        />
      </Flex>
    )
  }

  return (
    <Flex
      direction='column'
      alignItems={isCommentingEnabled && isDesktop ? 'flex-start' : 'center'}
      gap='2xl'
      flex={1}
      css={{
        minWidth: 330,
        maxWidth: isCommentingEnabled ? '100%' : 774
      }}
    >
      {renderRemixParentSection()}
      {renderRemixesSection()}
      {renderMoreBySection()}
      {renderRecommendedSection()}
    </Flex>
  )
}
