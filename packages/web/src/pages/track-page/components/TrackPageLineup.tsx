import { useTrackPageLineup } from '@audius/common/api'
import { useFeatureFlag } from '@audius/common/hooks'
import { User } from '@audius/common/models'
import { FeatureFlags } from '@audius/common/services'
import { trackPageLineupActions } from '@audius/common/store'
import { Flex, Text } from '@audius/harmony'

import Lineup from 'components/lineup/Lineup'
import { useTanQueryLineupProps } from 'components/lineup/hooks'
import { LineupVariant } from 'components/lineup/types'

import { useTrackPageSize } from './useTrackPageSize'

const messages = {
  moreBy: 'More By',
  originalTrack: 'Original Track'
}

type TrackPageLineupProps = {
  user: User | null
  trackId: number | null | undefined
}

export const TrackPageLineup = ({ user, trackId }: TrackPageLineupProps) => {
  const { isDesktop } = useTrackPageSize()
  const { isEnabled: commentsFlagEnabled } = useFeatureFlag(
    FeatureFlags.COMMENTS_ENABLED
  )

  const { lineup, play, pause, isPlaying, pageSize } = useTrackPageLineup({
    trackId,
    ownerHandle: user?.handle
  })

  const lineupProps = useTanQueryLineupProps()

  const renderTitle = (title: string) => (
    <Text variant='title' size='l'>
      {title}
    </Text>
  )

  const lineupVariant =
    isDesktop && commentsFlagEnabled
      ? LineupVariant.SECTION
      : LineupVariant.CONDENSED

  if (!lineup.entries.length) return null

  return (
    <Flex
      direction='column'
      alignItems='flex-start'
      justifyContent='center'
      gap='l'
      w='100%'
    >
      {renderTitle(`${messages.moreBy} ${user?.name ?? ''}`)}
      <Lineup
        lineup={lineup}
        variant={lineupVariant}
        actions={trackPageLineupActions.tracksActions}
        playing={isPlaying}
        playTrack={play}
        pauseTrack={pause}
        pageSize={pageSize}
        {...lineupProps}
      />
    </Flex>
  )
}
