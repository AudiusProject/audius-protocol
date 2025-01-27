import { useTrack, useRemixes } from '@audius/common/api'
import { useFeatureFlag } from '@audius/common/hooks'
import type { ID, Track } from '@audius/common/models'
import { FeatureFlags } from '@audius/common/services'
import { remixesPageLineupActions } from '@audius/common/store'
import {
  Button,
  Flex,
  IconRemix,
  IconArrowRight,
  Text,
  Box
} from '@audius/harmony'
import { Link } from 'react-router-dom-v5-compat'

import Lineup from 'components/lineup/Lineup'
import { LineupVariant } from 'components/lineup/types'
import { trackRemixesPage } from 'utils/route'

import { useTrackPageSize } from './useTrackPageSize'

const messages = {
  viewAllRemixes: 'View All Remixes',
  remixes: 'Remixes Of This Track'
}

const MAX_REMIXES_TO_DISPLAY = 6

type TrackRemixesProrps = {
  trackId: ID
}

export const TrackRemixes = (props: TrackRemixesProrps) => {
  const { trackId } = props
  const { isDesktop, isMobile } = useTrackPageSize()
  const { data: track } = useTrack(trackId)
  const { lineup, play, pause, isPlaying, source } = useRemixes({
    trackId
  })
  const { isEnabled: commentsFlagEnabled } = useFeatureFlag(
    FeatureFlags.COMMENTS_ENABLED
  )

  if (!track) {
    return null
  }

  const {
    _remixes: remixes,
    _remixes_count: remixesCount,
    permalink,
    comments_disabled
  } = track as unknown as Track
  const isCommentingEnabled = commentsFlagEnabled && !comments_disabled
  const remixTrackIds = remixes?.map(({ track_id }) => track_id) ?? null

  const lineupVariant =
    (isCommentingEnabled && isDesktop) || isMobile
      ? LineupVariant.SECTION
      : LineupVariant.CONDENSED

  if (!remixTrackIds || !remixTrackIds.length) {
    return null
  }

  return (
    <Flex
      direction='column'
      gap='s'
      w={!isDesktop || isCommentingEnabled ? '100%' : 720}
    >
      <Flex
        row
        alignItems='center'
        gap='s'
        justifyContent={!isCommentingEnabled ? 'center' : 'left'}
      >
        <IconRemix color='default' />
        <Text variant='title' size='l'>
          {messages.remixes}
        </Text>
      </Flex>
      <Lineup
        lineup={lineup}
        actions={remixesPageLineupActions}
        count={Math.min(MAX_REMIXES_TO_DISPLAY, remixTrackIds.length)}
        variant={lineupVariant}
        selfLoad
        playing={isPlaying}
        playTrack={play}
        pauseTrack={pause}
        playingUid={lineup?.entries?.[0]?.uid}
        playingTrackId={lineup?.entries?.[0]?.id}
        playingSource={source}
        buffering={false}
      />
      {remixesCount && remixesCount > MAX_REMIXES_TO_DISPLAY ? (
        <Box alignSelf='flex-start'>
          <Button iconRight={IconArrowRight} size='xs' asChild>
            <Link to={trackRemixesPage(permalink)}>
              {messages.viewAllRemixes}
            </Link>
          </Button>
        </Box>
      ) : null}
    </Flex>
  )
}
