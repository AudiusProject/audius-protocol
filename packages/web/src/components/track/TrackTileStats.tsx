import { useIsTrackUnlockable } from '@audius/common/hooks'
import { ID } from '@audius/common/models'
import { cacheTracksSelectors } from '@audius/common/store'
import { Flex, Skeleton } from '@audius/harmony'

import { EntityRank } from 'components/lineup/EntityRank'
import { useIsMobile } from 'hooks/useIsMobile'
import { useSelector } from 'utils/reducer'

import { TrackAccessTypeLabel } from './TrackAccessTypeLabel'
import { TrackLockedStatusBadge } from './TrackLockedStatusBadge'
import {
  CommentMetric,
  PlayMetric,
  RepostsMetric,
  SavesMetric
} from './TrackTileMetrics'
import { TrackTileSize } from './types'

const { getTrack } = cacheTracksSelectors

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

  const isUnlisted = useSelector((state) => {
    return getTrack(state, { id: trackId })?.is_unlisted
  })

  if (isLoading) {
    return (
      <Flex h='2xl' alignItems='center'>
        <Skeleton w='40%' h={isMobile ? 16 : 20} />
      </Flex>
    )
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
        {isUnlisted ? null : (
          <>
            <RepostsMetric trackId={trackId} size={size} />
            <SavesMetric trackId={trackId} />
            <CommentMetric trackId={trackId} size={size} />
          </>
        )}
      </Flex>
      {isUnlockable ? (
        <TrackLockedStatusBadge trackId={trackId} />
      ) : isUnlisted ? null : (
        <PlayMetric trackId={trackId} />
      )}
    </Flex>
  )
}
