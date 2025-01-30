import { useFeatureFlag } from '@audius/common/hooks'
import { User, PlaybackSource } from '@audius/common/models'
import { FeatureFlags } from '@audius/common/services'
import { useTrackPageLineup } from '@audius/common/src/api/tan-query/useTrackPageLineup'
import { tracksActions } from '@audius/common/src/store/pages/track/lineup/actions'
import { playerSelectors } from '@audius/common/store'
import { Flex, Text, IconRemix } from '@audius/harmony'
import type { IconComponent } from '@audius/harmony'
import { useSelector } from 'react-redux'

import { TanQueryLineup } from 'components/lineup/TanQueryLineup'
import { LineupVariant } from 'components/lineup/types'

import { ViewOtherRemixesButton } from './ViewOtherRemixesButton'
import { useTrackPageSize } from './useTrackPageSize'

const { getUid, getTrackId, getBuffering } = playerSelectors

const DEFAULT_PAGE_SIZE = 6

type TrackPageLineupProps = {
  user: User | null
  trackId: number | null | undefined
  commentsDisabled?: boolean
}

type SectionProps = {
  title: string
  icon?: IconComponent
  children: React.ReactNode
}

const Section = ({ title, icon: Icon, children }: SectionProps) => {
  return (
    <Flex direction='column' gap='l' w='100%'>
      <Flex gap='s' alignItems='center'>
        {Icon && <Icon />}
        <Text variant='title' size='l'>
          {title}
        </Text>
      </Flex>
      {children}
    </Flex>
  )
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
    ...lineupData
  } = useTrackPageLineup({
    trackId,
    ownerHandle: user?.handle
  })

  const { isDesktop, isMobile } = useTrackPageSize()
  const playingUid = useSelector(getUid)
  const playingTrackId = useSelector(getTrackId)
  const isBuffering = useSelector(getBuffering)

  const { isEnabled: commentsFlagEnabled } = useFeatureFlag(
    FeatureFlags.COMMENTS_ENABLED
  )
  const isCommentingEnabled = commentsFlagEnabled && !commentsDisabled
  const lineupVariant =
    (isCommentingEnabled && isDesktop) || isMobile
      ? LineupVariant.SECTION
      : LineupVariant.CONDENSED
  if (!indices) return null

  const renderRemixParentSection = () => {
    if (indices.remixParentIndex === null) return null

    return (
      <Section title={messages.originalTrack}>
        <TanQueryLineup
          lineupQueryData={lineupData}
          pageSize={1}
          variant={lineupVariant}
          start={indices.remixParentIndex}
          playingUid={playingUid}
          playingTrackId={playingTrackId}
          buffering={isBuffering}
          actions={tracksActions}
          playingSource={PlaybackSource.TRACK_TILE}
        />
      </Section>
    )
  }

  const renderRemixesSection = () => {
    if (indices.remixesStartIndex === null || !trackId) return null
    const start = indices.remixesStartIndex
    const end = indices.moreByTracksStartIndex

    return (
      <Section title={messages.remixes} icon={IconRemix}>
        <TanQueryLineup
          lineupQueryData={lineupData}
          pageSize={end !== null ? end - start : 0}
          variant={lineupVariant}
          start={start}
          playingUid={playingUid}
          playingTrackId={playingTrackId}
          buffering={isBuffering}
          actions={tracksActions}
          playingSource={PlaybackSource.TRACK_TILE}
        />
        <ViewOtherRemixesButton parentTrackId={trackId} size='xs' />
      </Section>
    )
  }

  const renderMoreBySection = () => {
    if (indices.moreByTracksStartIndex === null) return null
    const start = indices.moreByTracksStartIndex
    const end = indices.recommendedTracksStartIndex

    return (
      <Section title={messages.moreBy(user?.name ?? '')}>
        <TanQueryLineup
          lineupQueryData={lineupData}
          pageSize={end !== null ? end - start : 0}
          variant={lineupVariant}
          start={start}
          playingUid={playingUid}
          playingTrackId={playingTrackId}
          buffering={isBuffering}
          actions={tracksActions}
          playingSource={PlaybackSource.TRACK_TILE}
        />
      </Section>
    )
  }

  const renderRecommendedSection = () => {
    if (indices.recommendedTracksStartIndex === null) return null

    return (
      <Section title={messages.youMightAlsoLike}>
        <TanQueryLineup
          lineupQueryData={lineupData}
          pageSize={pageSize}
          variant={lineupVariant}
          start={indices.recommendedTracksStartIndex}
          playingUid={playingUid}
          playingTrackId={playingTrackId}
          buffering={isBuffering}
          actions={tracksActions}
          playingSource={PlaybackSource.TRACK_TILE}
        />
      </Section>
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
