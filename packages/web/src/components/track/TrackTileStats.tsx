import { useGetTrackById } from '@audius/common/api'
import { useIsTrackUnlockable } from '@audius/common/hooks'
import { ID } from '@audius/common/models'
import { Flex, Skeleton } from '@audius/harmony'

import { EntityRank } from 'components/lineup/EntityRank'
import { useIsMobile } from 'hooks/useIsMobile'

import { TrackAccessTypeLabel } from './TrackAccessTypeLabel'
import { TrackLockedStatusBadge } from './TrackLockedStatusBadge'
import {
  CommentMetric,
  PlayMetric,
  RepostsMetric,
  SavesMetric
} from './TrackTileMetrics'
import { TrackTileSize } from './types'

type TrackTileStatsProps = {
  trackId: ID
  isTrending?: boolean
  rankIndex?: number
  size: TrackTileSize
  isLoading?: boolean
}

export const TrackTileStats = (props: TrackTileStatsProps) => {
  const { trackId, isTrending, rankIndex, size, isLoading } = props

  const isUnlockable = useIsTrackUnlockable(trackId)
  const isMobile = useIsMobile()

  const { data: track } = useGetTrackById(
    { id: trackId },
    { disabled: !!trackId }
  )

  if (isLoading || !track) {
    return <Skeleton w='30%' h={isMobile ? 16 : 20} />
  }

  const { is_unlisted } = track

  return (
    <Flex
      justifyContent='space-between'
      alignItems='center'
      pv={isMobile ? 's' : 'xs'}
    >
      <Flex gap='l'>
        {isTrending ? <EntityRank index={rankIndex!} /> : null}
        <TrackAccessTypeLabel trackId={trackId} />
        {is_unlisted ? null : (
          <>
            <RepostsMetric trackId={trackId} size={size} />
            <SavesMetric trackId={trackId} />
            <CommentMetric trackId={trackId} />
          </>
        )}
      </Flex>
      {isUnlockable ? (
        <TrackLockedStatusBadge trackId={trackId} />
      ) : is_unlisted ? null : (
        <PlayMetric trackId={trackId} />
      )}
    </Flex>
  )
}
