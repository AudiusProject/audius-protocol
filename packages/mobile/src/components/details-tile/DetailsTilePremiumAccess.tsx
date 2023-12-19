import type { ID, StreamConditions } from '@audius/common'
import {
  isContentCollectibleGated,
  isContentFollowGated,
  isContentTipGated
} from '@audius/common'
import type { ViewStyle } from 'react-native'

import { DetailsTileHasAccess } from './DetailsTileHasAccess'
import { DetailsTileNoAccess } from './DetailsTileNoAccess'

type DetailsTileGatedAccessProps = {
  trackId: ID
  streamConditions: StreamConditions
  isOwner: boolean
  hasStreamAccess: boolean
  style?: ViewStyle
}

export const DetailsTileGatedAccess = ({
  trackId,
  streamConditions,
  isOwner,
  hasStreamAccess,
  style
}: DetailsTileGatedAccessProps) => {
  const shouldDisplay =
    isContentCollectibleGated(streamConditions) ||
    isContentFollowGated(streamConditions) ||
    isContentTipGated(streamConditions)

  if (!shouldDisplay) return null

  if (hasStreamAccess) {
    return (
      <DetailsTileHasAccess
        streamConditions={streamConditions}
        isOwner={isOwner}
        style={style}
      />
    )
  }

  return (
    <DetailsTileNoAccess
      trackId={trackId}
      streamConditions={streamConditions}
      style={style}
    />
  )
}
