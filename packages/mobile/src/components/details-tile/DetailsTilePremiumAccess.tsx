import type { ID, AccessConditions } from '@audius/common/models'
import {
  isContentCollectibleGated,
  isContentFollowGated,
  isContentTipGated
} from '@audius/common/models'
import type { ViewStyle } from 'react-native'

import { DetailsTileHasAccess } from './DetailsTileHasAccess'
import { DetailsTileNoAccess } from './DetailsTileNoAccess'

type DetailsTileGatedAccessProps = {
  trackId: ID
  streamConditions: AccessConditions
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
