import { ID } from '@audius/common/models'
import { Flex, Skeleton } from '@audius/harmony'

import { EntityRank } from 'components/lineup/EntityRank'
import { useIsMobile } from 'hooks/useIsMobile'

import { TrackAccessTypeLabel } from './TrackAccessTypeLabel'
import {
  TrackLockedStatusPill,
  useIsTrackUnlockable
} from './TrackLockedStatusPill'
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

  if (isLoading) {
    return <Skeleton w='30%' h={isMobile ? 16 : 20} />
  }

  return (
    <Flex
      justifyContent='space-between'
      alignItems='center'
      pv={isMobile ? 's' : 'xs'}
    >
      <Flex gap='l'>
        {isTrending ? <EntityRank index={rankIndex!} /> : null}
        <TrackAccessTypeLabel trackId={trackId} />
        <RepostsMetric trackId={trackId} size={size} />
        <SavesMetric trackId={trackId} />
        <CommentMetric trackId={trackId} />
      </Flex>
      {isUnlockable ? (
        <TrackLockedStatusPill trackId={trackId} />
      ) : (
        <PlayMetric trackId={trackId} />
      )}
    </Flex>
  )
}
